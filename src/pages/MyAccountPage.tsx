import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Package, ExternalLink, Edit3, CheckCircle, Clock } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { VideoService } from '../services/video.service';
import { supabase } from '../lib/supabase';
import { ProductionDetailsModal } from '../components/ProductionDetailsModal';
import { PixPaymentModal } from '../components/PixPaymentModal';
import { type Order, type OrderItem, type ProductionFormData } from '../types';

export function MyAccountPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [myOrders, setMyOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrderItem, setSelectedOrderItem] = useState<OrderItem | null>(null);

    // Pix Modal state
    const [isPixModalOpen, setIsPixModalOpen] = useState(false);
    const [selectedPixOrder, setSelectedPixOrder] = useState<Order | null>(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/');
            return;
        }
        setUser(user);
        loadData(user.id);
    };

    const loadData = async (userId: string) => {
        setLoading(true);
        const ordersData = await VideoService.getMyOrders(userId);
        setMyOrders(ordersData);
        setLoading(false);
    };

    const handleOpenModal = (item: OrderItem) => {
        setSelectedOrderItem(item);
        setIsModalOpen(true);
    };

    const handleSubmitForm = async (formData: ProductionFormData) => {
        if (!selectedOrderItem) return;

        // If the item was pending_form, move it to in_production.
        // Otherwise, it might be an edit for an item already in_production or delivered, so we keep the existing status.
        const newStatus = (!selectedOrderItem.production_status || selectedOrderItem.production_status === 'pending_form')
            ? 'in_production'
            : selectedOrderItem.production_status;

        const { error } = await supabase
            .from('order_items')
            .update({
                production_status: newStatus,
                production_form_data: formData
            })
            .eq('id', selectedOrderItem.id);

        if (error) throw error;

        // Reload data to reflect status change
        if (user) loadData(user.id);
    };

    const handleWatchDelivered = (url: string) => {
        let finalUrl = url;
        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
            finalUrl = `https://${url}`;
        }
        window.open(finalUrl, '_blank', 'noopener,noreferrer');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const handleOpenPixModal = (order: Order) => {
        setSelectedPixOrder(order);
        setIsPixModalOpen(true);
    };

    const paidOrderItems = myOrders
        .filter(o => o.status === 'paid')
        .flatMap(o => o.order_items || [])
        .map(item => {
            // Find the parent order to pass dates if needed
            const parentOrder = myOrders.find(o => o.id === item.order_id);
            return { ...item, order_date: parentOrder?.created_at };
        });

    if (loading && !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Minha Conta</h1>
                    <button
                        onClick={handleLogout}
                        className="flex items-center text-gray-600 hover:text-red-600 transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-2" />
                        Sair
                    </button>
                </div>

                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                    <Edit3 className="w-6 h-6 mr-2 text-blue-600" />
                    Minhas Edições e Highlights
                </h2>

                {paidOrderItems.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm mb-12">
                        <p className="text-gray-500 mb-4">Você ainda não possui pacotes de edição pagos.</p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                        >
                            Ver Catálogo de Eventos
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                        {paidOrderItems.map(item => (
                            <div key={item.id} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 flex flex-col">
                                <div className="mb-4 flex-grow">
                                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">
                                        {item.videos?.title || 'Pacote de Highlight'}
                                    </h3>

                                    {/* Status Badge */}
                                    <div className="mt-3">
                                        {(!item.production_status || item.production_status === 'pending_form') && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                                Ação Necessária
                                            </span>
                                        )}
                                        {item.production_status === 'in_production' && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                <Clock className="w-3 h-3 mr-1" />
                                                Em Produção
                                            </span>
                                        )}
                                        {item.production_status === 'delivered' && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Entregue
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 mt-auto flex flex-col gap-2">
                                    {(!item.production_status || item.production_status === 'pending_form') && (
                                        <button
                                            onClick={() => handleOpenModal(item)}
                                            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                            Preencher Dados da Luta
                                        </button>
                                    )}
                                    {item.production_status === 'in_production' && (
                                        <>
                                            <div className="w-full py-2.5 bg-gray-100 text-gray-600 rounded-lg font-medium text-center text-sm cursor-not-allowed">
                                                Aguarde. Seu highlight está sendo editado!
                                            </div>
                                            <button
                                                onClick={() => handleOpenModal(item)}
                                                className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                                Alterar Informações
                                            </button>
                                        </>
                                    )}
                                    {item.production_status === 'delivered' && (
                                        <>
                                            <button
                                                onClick={() => handleWatchDelivered(item.delivered_video_url || '#')}
                                                className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                Acessar / Baixar Vídeo
                                            </button>
                                            <button
                                                onClick={() => handleOpenModal(item)}
                                                className="w-full py-2 text-sm text-gray-500 hover:text-blue-600 font-medium flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                                Revisar Informações da Edição
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                    <Package className="w-6 h-6 mr-2 text-gray-500" />
                    Histórico de Pedidos
                </h2>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {myOrders.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            Nenhum pedido encontrado.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-600">
                                        <th className="p-4 font-medium">Pedido</th>
                                        <th className="p-4 font-medium">Data</th>
                                        <th className="p-4 font-medium">Itens</th>
                                        <th className="p-4 font-medium">Status</th>
                                        <th className="p-4 font-medium text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myOrders.map(order => (
                                        <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4 text-sm font-mono text-gray-500">
                                                {order.id.substring(0, 8).toUpperCase()}
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">
                                                {new Date(order.created_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="p-4 text-sm text-gray-900 font-medium">
                                                {order.order_items?.map((item: any, idx: number) => (
                                                    <div key={idx} className="line-clamp-1">
                                                        {item.videos?.title || 'Ingresso / Vídeo'}
                                                    </div>
                                                ))}
                                            </td>
                                            <td className="p-4">
                                                {order.status === 'paid' && (
                                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Aprovado</span>
                                                )}
                                                {order.status === 'pending' && (
                                                    <div className="flex flex-col gap-2 items-start">
                                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Pendente Pagamento</span>
                                                        {order.payment_method === 'pix' && order.pix_qr_code && (
                                                            <button
                                                                onClick={() => handleOpenPixModal(order)}
                                                                className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium mt-1"
                                                            >
                                                                Pagar Agora / Ver Pix
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                                {(order.status === 'canceled' || order.status === 'failed') && (
                                                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Cancelado</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right font-bold text-gray-900">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {selectedOrderItem && (
                <ProductionDetailsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleSubmitForm}
                    initialData={selectedOrderItem.production_form_data || undefined}
                />
            )}

            {selectedPixOrder && selectedPixOrder.pix_qr_code && (
                <PixPaymentModal
                    isOpen={isPixModalOpen}
                    onClose={() => setIsPixModalOpen(false)}
                    qrCode={selectedPixOrder.pix_qr_code}
                    qrCodeUrl={selectedPixOrder.pix_qr_code_url || null}
                />
            )}
        </div>
    );
}
