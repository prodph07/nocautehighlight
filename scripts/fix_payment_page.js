const fs = require('fs');
const path = require('path');

const content = `
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, CreditCard, QrCode, Loader2, Lock } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { type FightEvent, type PaymentMethod } from '../types';
import { VideoService } from '../services/video.service';
import { PagarmeService } from '../services/pagarme.service';
import { supabase } from '../lib/supabase';

export function PaymentPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [event, setEvent] = useState<FightEvent __PIPE__ null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
    const [user, setUser] = useState<any>(null);

    const [qrCode, setQrCode] = useState<string __PIPE__ null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string __PIPE__ null>(null);
    const [orderId, setOrderId] = useState<string __PIPE__ null>(null);

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
            const videoData = await VideoService.getBySlug(eventSlug);
            if (videoData) {
                setEvent(videoData);
            } else {
                navigate('/');
            }
        } else {
            navigate('/');
        }
        setLoading(false);
    };

    const handleCheckout = async () => {
        if (!event __PIPE____PIPE__ !user) return;
        setProcessing(true);
        setQrCode(null);
        setQrCodeUrl(null);

        try {
            const transaction = await PagarmeService.createTransaction({
                amount: Math.round(event.price_highlight * 100),
                description: \`Acesso ao evento: \${event.title}\`,
                payment_method: paymentMethod,
                customer: {
                    name: user.user_metadata?.full_name __PIPE____PIPE__ 'Cliente',
                    email: user.email,
                    document: '00000000000',
                    phones: {
                        mobile_phone: {
                            country_code: '55',
                            area_code: '11',
                            number: '999999999'
                        }
                    }
                }
            });

            console.log('Transaction Result:', transaction);

            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id,
                    status: transaction.status __PIPE____PIPE__ 'pending',
                    gateway_id: transaction.id,
                    payment_method: paymentMethod,
                    total_amount: event.price_highlight
                })
                .select()
                .single();

            if (orderError) throw orderError;
            setOrderId(orderData.id);

            if (transaction.status === 'paid' __PIPE____PIPE__ transaction.status === 'pending') {
                 if (transaction.status === 'paid') {
                     await supabase
                        .from('order_items')
                        .insert({
                            order_id: orderData.id,
                            video_id: event.id,
                            access_level: 'highlight_only'
                        });
                 }
            }

            if (paymentMethod === 'pix' && transaction.qrcode) {
                setQrCode(transaction.qrcode);
                setQrCodeUrl(transaction.qrcode_url __PIPE____PIPE__ null);
            } else {
                alert('Pedido realizado! Se foi cartão, o acesso será liberado em breve.');
                navigate('/minha-conta');
            }

        } catch (error: any) {
            console.error('Checkout error:', error);
            alert(\`Erro ao processar pagamento: \${error.message __PIPE____PIPE__ JSON.stringify(error)}\`);
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

    if (loading __PIPE____PIPE__ !event) {
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
                             <img src={qrCodeUrl} alt="QR Code Pix" className="w-48 h-48" />
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
                                src={event.teaser_url __PIPE____PIPE__ 'https://via.placeholder.com/150'}
                                alt={event.title}
                                className="w-24 h-16 object-cover rounded-lg"
                            />
                            <div>
                                <h3 className="font-medium text-gray-900 line-clamp-2">{event.title}</h3>
                                <p className="text-sm text-gray-500">{event.event_name}</p>
                            </div>
                        </div>
                        <div className="border-t border-gray-100 pt-4 flex justify-between items-center text-lg font-bold">
                            <span>Total</span>
                            <span className="text-blue-600">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(event.price_highlight)}
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
                                onClick={() => setPaymentMethod('pix')}
                                className={\`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-4 transition-all \${paymentMethod === 'pix' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}\`}
                            >
                                <QrCode className={\`w-6 h-6 \${paymentMethod === 'pix' ? 'text-blue-600' : 'text-gray-400'}\`} />
                                <div className="flex-grow">
                                    <span className={\`block font-bold \${paymentMethod === 'pix' ? 'text-blue-900' : 'text-gray-700'}\`}>Pix (Instantâneo)</span>
                                    <span className="text-xs text-gray-500">Aprovação imediata</span>
                                </div>
                                <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center \${paymentMethod === 'pix' ? 'border-blue-600' : 'border-gray-300'}\`}>
                                    {paymentMethod === 'pix' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                </div>
                            </div>

                            <div
                                onClick={() => setPaymentMethod('credit_card')}
                                className={\`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-4 transition-all \${paymentMethod === 'credit_card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}\`}
                            >
                                <CreditCard className={\`w-6 h-6 \${paymentMethod === 'credit_card' ? 'text-blue-600' : 'text-gray-400'}\`} />
                                <div className="flex-grow">
                                    <span className={\`block font-bold \${paymentMethod === 'credit_card' ? 'text-blue-900' : 'text-gray-700'}\`}>Cartão de Crédito</span>
                                    <span className="text-xs text-gray-500">Até 12x no cartão</span>
                                </div>
                                <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center \${paymentMethod === 'credit_card' ? 'border-blue-600' : 'border-gray-300'}\`}>
                                    {paymentMethod === 'credit_card' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                </div>
                            </div>
                        </div>

                        {paymentMethod === 'credit_card' && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-500 border border-gray-200">
                                ℹ️ Simulação: O pagamento será aprovado automaticamente.
                            </div>
                        )}

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
                                \`Pagar \${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(event.price_highlight)}\`
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
`;

const cleanContent = content.replace(/__PIPE__/g, '|');
const filePath = path.join(__dirname, '..', 'src', 'pages', 'PaymentPage.tsx');

fs.writeFileSync(filePath, cleanContent);
console.log('Successfully wrote PaymentPage.tsx');
