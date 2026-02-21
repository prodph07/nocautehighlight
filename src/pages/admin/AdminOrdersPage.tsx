import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, Search, Calendar, CheckCircle, Clock, XCircle, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderDetail {
    id: string;
    total_amount: number;
    status: string;
    payment_method: string;
    created_at: string;
    profiles: {
        full_name: string;
        email: string;
        cpf: string;
        whatsapp: string;
    };
    order_items: {
        access_level: string;
        videos: {
            title: string;
            event_name: string;
        };
    }[];
}

export function AdminOrdersPage() {
    const [orders, setOrders] = useState<OrderDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id, 
                    total_amount, 
                    status, 
                    payment_method, 
                    created_at,
                    profiles (full_name, email, cpf, whatsapp),
                    order_items (
                        access_level,
                        videos (title, event_name)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders((data as any[]) || []);
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-700 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'canceled':
            case 'failed': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'paid': return 'Aprovado';
            case 'pending': return 'Pendente';
            case 'canceled': return 'Cancelado';
            case 'failed': return 'Falhou';
            default: return status;
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            order.id.toLowerCase().includes(searchLower) ||
            order.profiles?.full_name?.toLowerCase().includes(searchLower) ||
            order.profiles?.email?.toLowerCase().includes(searchLower) ||
            order.profiles?.cpf?.includes(searchLower);

        return matchesStatus && matchesSearch;
    });

    const exportToCsv = () => {
        if (filteredOrders.length === 0) return;

        const headers = ['ID Pedido', 'Data', 'Cliente', 'Email', 'CPF', 'WhatsApp', 'Vídeo', 'Acesso', 'Pagamento', 'Status', 'Valor'];

        const csvData = filteredOrders.map(order => {
            const date = new Date(order.created_at).toLocaleDateString('pt-BR');
            const itemName = order.order_items?.[0]?.videos?.title || 'N/A';
            const access = order.order_items?.[0]?.access_level === 'full_access' ? 'Completo' : 'Highlight';

            return [
                order.id,
                date,
                order.profiles?.full_name || '',
                order.profiles?.email || '',
                order.profiles?.cpf || '',
                order.profiles?.whatsapp || '',
                itemName,
                access,
                order.payment_method === 'pix' ? 'Pix' : 'Cartão',
                getStatusLabel(order.status),
                order.total_amount
            ].join(',');
        });

        const csvString = [headers.join(','), ...csvData].join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `pedidos_${format(new Date(), 'dd-MM-yyyy')}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="w-6 h-6 text-blue-600" />
                        Gerenciamento de Pedidos
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Veja todos os pedidos, status de pagamentos e dados dos clientes.</p>
                </div>

                <button
                    onClick={exportToCsv}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
                >
                    <Download className="w-4 h-4" />
                    Exportar
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between bg-gray-50/50">
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg self-start">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${statusFilter === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setStatusFilter('paid')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1 ${statusFilter === 'paid' ? 'bg-white shadow text-green-700' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            <CheckCircle className="w-4 h-4" /> Aprovados
                        </button>
                        <button
                            onClick={() => setStatusFilter('pending')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1 ${statusFilter === 'pending' ? 'bg-white shadow text-yellow-700' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            <Clock className="w-4 h-4" /> Pendentes
                        </button>
                        <button
                            onClick={() => setStatusFilter('failed')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1 ${statusFilter === 'failed' ? 'bg-white shadow text-red-700' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            <XCircle className="w-4 h-4" /> Falhos
                        </button>
                    </div>

                    <div className="relative relative max-w-md w-full">
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar por nome, email, CPF ou ID do pedido..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 uppercase text-xs font-semibold text-gray-500 tracking-wider">
                                <th className="p-4 w-24">ID</th>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Item Comprado</th>
                                <th className="p-4">Data</th>
                                <th className="p-4">Pagamento</th>
                                <th className="p-4 text-right">Valor</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Carregando pedidos...</td></tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Nenhum pedido encontrado.</td></tr>
                            ) : (
                                filteredOrders.map(order => {
                                    const firstItem = order.order_items?.[0];
                                    const isFullAccess = firstItem?.access_level === 'full_access';

                                    return (
                                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4 text-xs font-mono text-gray-400">
                                                {order.id.split('-')[0]}
                                            </td>
                                            <td className="p-4 text-sm">
                                                <div className="font-medium text-gray-900">{order.profiles?.full_name || 'Usuário Deletado'}</div>
                                                <div className="text-gray-500 text-xs">{order.profiles?.email}</div>
                                                <div className="text-gray-400 text-xs mt-1">CPF: {order.profiles?.cpf || 'Não informado'}</div>
                                            </td>
                                            <td className="p-4">
                                                {firstItem ? (
                                                    <div>
                                                        <div className="font-medium text-gray-800 text-sm line-clamp-1" title={firstItem.videos.title}>
                                                            {firstItem.videos.title}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-gray-500">{firstItem.videos.event_name}</span>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${isFullAccess ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                {isFullAccess ? 'Luta Completa' : 'Highlight'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : <span className="text-gray-400 text-sm">Sem item vinculado</span>}
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    {format(new Date(order.created_at), "dd MMM yy, HH:mm", { locale: ptBR })}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 bg-gray-100 rounded text-xs font-semibold ${order.payment_method === 'pix' ? 'text-green-700' : 'text-blue-700'}`}>
                                                    {order.payment_method === 'pix' ? 'PIX' : 'CARTÃO'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-medium text-gray-900">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyle(order.status)}`}>
                                                    {getStatusLabel(order.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
