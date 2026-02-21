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
            finalCpf = inputCpf.replace(/\\D+/g, '');
            if (!isValidCPF(finalCpf)) {
                alert("CPF inválido informado. Compra cancelada.");
                setProcessing(false);
                return;
            }
            // Save it so they don't have to type again (and create missing profiles for old users)
            try {
                await supabase.auth.updateUser({ data: { cpf: finalCpf } });
                await supabase.from('profiles').upsert({
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || 'Cliente',
                    whatsapp: user.user_metadata?.whatsapp || '',
                    cpf: finalCpf
                });
            } catch (e) {
                console.error("Failed to update profile", e);
            }
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
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
        );
    }

    if (qrCode) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <QrCode className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Pix Gerado!</h2>
                    <p className="text-gray-500 mb-6">Escaneie o QR Code ou copie o código abaixo para pagar.</p>

                    {qrCodeUrl ? (
                        <div className="mb-6 flex justify-center">
                            <img src={qrCodeUrl} alt="QR Code Pix" loading="lazy" className="w-48 h-48" />
                        </div>
                    ) : (
                        <div className="mb-6 bg-gray-100 p-4 rounded text-xs break-all hidden">
                            Image unavailable
                        </div>
                    )}

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 break-all text-xs font-mono text-gray-600 overflow-x-auto">
                        {qrCode}
                    </div>

                    <button
                        onClick={handleCopyPix}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mb-4 hover:bg-blue-700 transition-colors"
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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-12 flex-grow w-full">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Finalizar Compra</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Resumo do Pedido</h2>
                        <div className="flex gap-4 mb-4">
                            <img
                                src={evt.teaser_url ? evt.teaser_url : 'https://via.placeholder.com/150'}
                                alt={evt.title}
                                loading="lazy"
                                className="w-24 h-16 object-cover rounded-lg"
                            />
                            <div>
                                <h3 className="font-medium text-gray-900 line-clamp-2">{evt.title}</h3>
                                <p className="text-sm text-gray-500">{evt.event_name}</p>
                            </div>
                        </div>

                        {/* Upsell Checkbox */}
                        <div className="mb-6 p-4 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => setWantsFullFight(!wantsFullFight)}>
                            <label className="flex items-start gap-3 cursor-pointer">
                                <div className="pt-0.5">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        checked={wantsFullFight}
                                        onChange={(e) => setWantsFullFight(e.target.checked)}
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-blue-900">Quero a Luta na Íntegra</span>
                                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">
                                            + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(upsellPrice)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-blue-700/80">
                                        Adicione a gravação completa da luta (sem cortes) ao seu pacote e receba todos os rounds.
                                    </p>
                                </div>
                            </label>
                        </div>

                        <div className="border-t border-gray-100 pt-4 flex justify-between items-center text-lg font-bold">
                            <span>Total</span>
                            <span className="text-blue-600">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(evt.price_highlight + (wantsFullFight ? upsellPrice : 0))}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-6">
                            <Lock className="w-5 h-5 text-green-600" />
                            <h2 className="text-lg font-bold text-gray-900">Pagamento Seguro</h2>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div
                                className="p-4 rounded-xl border-2 border-blue-500 bg-blue-50 flex items-center gap-4 transition-all"
                            >
                                <QrCode className="w-6 h-6 text-blue-600" />
                                <div className="flex-grow">
                                    <span className="block font-bold text-blue-900">Pix (Instantâneo)</span>
                                    <span className="text-xs text-gray-500">Aprovação imediata</span>
                                </div>
                                <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center">
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={processing}
                            className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
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
