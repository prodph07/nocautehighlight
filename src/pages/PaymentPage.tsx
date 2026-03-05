import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, QrCode, Loader2, Lock } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { type PaymentMethod } from '../types';
import { VideoService } from '../services/video.service';
import { PagarmeService } from '../services/pagarme.service';
import { SettingsService } from '../services/settings.service';
import { supabase } from '../lib/supabase';
import { isValidCPF } from '../utils/validators';

export function PaymentPage() {
    const location = useLocation();
    const navigate = useNavigate();
    // REMOVED PIPES
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const paymentMethod = 'pix';
    const [user, setUser] = useState<any>(null);

    const [qrCode, setQrCode] = useState<any>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<any>(null);

    // Upsell state
    const [upsellPrice, setUpsellPrice] = useState<number>(20); // Default, updated on load
    const [wantsFullFight, setWantsFullFight] = useState(false);
    // orderId state removed as it is never read for rendering

    const eventSlug = location.state?.eventSlug;

    useEffect(() => {
        checkUserAndLoadEvent();
    }, [eventSlug]);

    const checkUserAndLoadEvent = async () => {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/');
            return;
        }
        setUser(user);

        if (eventSlug) {
            const [videoData, settingsData] = await Promise.all([
                VideoService.getBySlug(eventSlug),
                SettingsService.getSettings()
            ]);

            if (videoData) {
                setEvent(videoData);
                setUpsellPrice(Number(settingsData.full_fight_upsell_price));
            } else {
                navigate('/');
            }
        } else {
            navigate('/');
        }
        setLoading(false);
    };

    const handleCheckout = async () => {
        if (!event) return;
        if (!user) return;

        setProcessing(true);
        setQrCode(null);
        setQrCodeUrl(null);

        let finalCpf = user.user_metadata?.cpf ? user.user_metadata.cpf.replace(/\\D+/g, '') : '';

        if (!isValidCPF(finalCpf)) {
            const inputCpf = window.prompt("Seu cadastro de teste está sem CPF válido. Por favor, digite um CPF válido (somente números) para prosseguir:");
            if (!inputCpf) {
                setProcessing(false);
                return;
            }
            finalCpf = inputCpf.replace(/\D+/g, '');
            if (!isValidCPF(finalCpf)) {
                alert("CPF inválido informado. Compra cancelada.");
                setProcessing(false);
                return;
            }
            // Save it so they don't have to type again
            try {
                await supabase.auth.updateUser({ data: { cpf: finalCpf } });
            } catch (e) {
                console.error("Failed to update profile metadata", e);
            }
        }

        // Always ensure profile exists for the foreign key in orders table
        try {
            await supabase.from('profiles').upsert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || 'Cliente',
                whatsapp: user.user_metadata?.whatsapp || '',
                cpf: finalCpf
            });
        } catch (e) {
            console.error("Failed to ensure profile exists", e);
        }

        try {
            // Replace logical OR with ternary
            const customerName = user.user_metadata?.full_name ? user.user_metadata.full_name : 'Cliente';

            const rawPhone = user.user_metadata?.whatsapp ? user.user_metadata.whatsapp.replace(/\\D/g, '') : '';
            let countryCode = '55';
            let areaCode = '11';
            let phoneNum = '999999999';

            if (rawPhone.length >= 10) {
                if (rawPhone.length >= 12 && rawPhone.startsWith('55')) {
                    countryCode = '55';
                    areaCode = rawPhone.substring(2, 4);
                    phoneNum = rawPhone.substring(4);
                } else {
                    areaCode = rawPhone.substring(0, 2);
                    phoneNum = rawPhone.substring(2);
                }
            }

            const finalAmount = event.price_highlight + (wantsFullFight ? upsellPrice : 0);

            const transaction = await PagarmeService.createTransaction({
                amount: Math.round(finalAmount * 100),
                description: `Acesso ao evento: ${event.title}${wantsFullFight ? ' + Luta na Íntegra' : ''}`,
                payment_method: paymentMethod as PaymentMethod,
                customer: {
                    name: customerName,
                    email: user.email,
                    document: finalCpf,
                    phones: {
                        mobile_phone: {
                            country_code: countryCode,
                            area_code: areaCode,
                            number: phoneNum
                        }
                    }
                }
            });

            console.log('Transaction Result:', transaction);

            const status = transaction.status ? transaction.status : 'pending';

            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id,
                    status: status,
                    gateway_id: transaction.id,
                    payment_method: paymentMethod,
                    total_amount: finalAmount,
                    pix_qr_code: transaction.qrcode || null,
                    pix_qr_code_url: transaction.qrcode_url || null
                })
                .select()
                .single();

            if (orderError) throw orderError;
            // setOrderId removed

            if (orderError) throw orderError;

            // FIX: Always insert the order item so the order is linked to the video.
            // When the webhook (or admin) flips the order status to 'paid', the VideoService will find it.
            const { error: itemError } = await supabase
                .from('order_items')
                .insert({
                    order_id: orderData.id,
                    video_id: event.id,
                    access_level: wantsFullFight ? 'full_access' : 'highlight_only'
                });

            if (itemError) {
                console.error("Failed to insert order item:", itemError);
                throw new Error("Erro ao linkar o vídeo ao seu pedido.");
            }

            if (paymentMethod === 'pix' && transaction.qrcode) {
                setQrCode(transaction.qrcode);
                const url = transaction.qrcode_url ? transaction.qrcode_url : null;
                setQrCodeUrl(url);
            } else {
                alert('Pedido realizado! Se foi cartão, o acesso será liberado em breve.');
                navigate('/minha-conta');
            }

        } catch (error: any) {
            console.error('Checkout error:', error);
            const msg = error.message ? error.message : JSON.stringify(error);
            alert(`Erro ao processar pagamento: ${msg}`);
        } finally {
            setProcessing(false);
        }
    };

    const handleCopyPix = () => {
        if (qrCode) {
            navigator.clipboard.writeText(qrCode);
            alert('Código Pix copiado!');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-dark flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-brand-orange" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-brand-dark flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-brand-orange" />
            </div>
        );
    }

    if (qrCode) {
        return (
            <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-4 font-sans text-gray-100">
                <div className="bg-black border border-brand-red/30 p-8 rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.2)] max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-brand-red/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <QrCode className="w-8 h-8 text-brand-orange" />
                    </div>
                    <h2 className="text-2xl font-black font-heading uppercase italic text-white mb-2 tracking-wider">Pagamento Pix Gerado!</h2>
                    <p className="text-gray-400 mb-6 font-medium">Escaneie o QR Code ou copie o código abaixo para pagar.</p>

                    {qrCodeUrl ? (
                        <div className="mb-6 flex justify-center">
                            <img src={qrCodeUrl} alt="QR Code Pix" loading="lazy" className="w-48 h-48" />
                        </div>
                    ) : (
                        <div className="mb-6 bg-gray-100 p-4 rounded text-xs break-all hidden">
                            Image unavailable
                        </div>
                    )}

                    <div className="bg-brand-dark p-4 rounded-xl border border-brand-red/20 mb-6 break-all text-xs font-mono text-gray-400 overflow-x-auto selection:bg-brand-orange/30">
                        {qrCode}
                    </div>

                    <button
                        onClick={handleCopyPix}
                        className="w-full py-3.5 bg-gradient-to-r from-brand-red to-brand-orange text-white rounded-xl font-black font-heading uppercase italic tracking-wider mb-4 hover:shadow-lg hover:shadow-brand-red/30 transition-all"
                    >
                        Copiar Código Pix
                    </button>

                    <button
                        onClick={() => navigate('/minha-conta')}
                        className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                        Já paguei / Ver Meus Pedidos
                    </button>
                </div>
            </div>
        )
    }

    // cast for render
    const evt = event as any;

    return (
        <div className="min-h-screen bg-brand-dark flex flex-col font-sans text-gray-100">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-12 flex-grow w-full">
                <h1 className="text-4xl font-black font-heading uppercase italic tracking-wider text-white mb-8 border-l-4 border-brand-orange pl-4">Finalizar Compra</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-black p-6 rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.1)] border border-brand-red/20 h-fit">
                        <h2 className="text-xl font-black font-heading uppercase tracking-widest text-white mb-4">Resumo do Pedido</h2>
                        <div className="flex gap-4 mb-4">
                            <img
                                src={evt.teaser_url ? evt.teaser_url : 'https://via.placeholder.com/150'}
                                alt={evt.title}
                                loading="lazy"
                                className="w-24 h-16 object-cover rounded-lg"
                            />
                            <div>
                                <h3 className="font-bold text-white line-clamp-2 uppercase font-heading tracking-wide mb-1">{evt.title}</h3>
                                <p className="text-sm text-brand-orange font-bold uppercase tracking-wider">{evt.event_name}</p>
                            </div>
                        </div>

                        {/* Upsell Checkbox */}
                        <div className="mb-6 p-4 rounded-xl border border-brand-red/30 bg-brand-red/5 hover:bg-brand-red/10 transition-colors cursor-pointer" onClick={() => setWantsFullFight(!wantsFullFight)}>
                            <label className="flex items-start gap-3 cursor-pointer">
                                <div className="pt-0.5">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-gray-600 bg-brand-dark text-brand-orange focus:ring-brand-orange focus:ring-offset-brand-dark cursor-pointer"
                                        checked={wantsFullFight}
                                        onChange={(e) => setWantsFullFight(e.target.checked)}
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-white uppercase font-heading tracking-wider">Quero a Luta na Íntegra</span>
                                        <span className="bg-gradient-to-r from-brand-red to-brand-orange text-white text-xs px-2.5 py-1 rounded font-black font-heading tracking-widest shadow-md">
                                            + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(upsellPrice)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium">
                                        Adicione a gravação completa da luta (sem cortes) ao seu pacote e receba todos os rounds.
                                    </p>
                                </div>
                            </label>
                        </div>

                        <div className="border-t border-brand-red/20 pt-4 flex justify-between items-center text-xl font-black font-heading uppercase italic tracking-widest text-white">
                            <span>Total</span>
                            <span className="text-brand-orange drop-shadow-sm">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(evt.price_highlight + (wantsFullFight ? upsellPrice : 0))}
                            </span>
                        </div>
                    </div>

                    <div className="bg-black p-6 rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.1)] border border-brand-red/20">
                        <div className="flex items-center gap-2 mb-6">
                            <Lock className="w-6 h-6 text-brand-orange" />
                            <h2 className="text-xl font-black font-heading uppercase tracking-widest text-white">Pagamento Seguro</h2>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div
                                className="p-4 rounded-xl border border-brand-orange bg-brand-orange/10 flex items-center gap-4 transition-all"
                            >
                                <QrCode className="w-6 h-6 text-brand-orange" />
                                <div className="flex-grow">
                                    <span className="block font-bold text-white">Pix (Instantâneo)</span>
                                    <span className="text-xs text-brand-red font-medium">Aprovação imediata</span>
                                </div>
                                <div className="w-5 h-5 rounded-full border-2 border-brand-orange flex items-center justify-center">
                                    <div className="w-2.5 h-2.5 rounded-full bg-brand-orange" />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={processing}
                            className="w-full py-4 bg-gradient-to-r from-brand-red to-brand-orange text-white rounded-xl font-black font-heading uppercase italic tracking-widest text-xl hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center transition-all transform hover:-translate-y-1"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Processando...
                                </>
                            ) : (
                                `Pagar ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(evt.price_highlight + (wantsFullFight ? upsellPrice : 0))}`
                            )}
                        </button>

                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                            <ShieldCheck className="w-3 h-3" />
                            Ambiente 100% Seguro
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
