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
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

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
            case 'paid': return 'bg-green-900/40 text-green-400 border-green-500/30';
            case 'pending': return 'bg-yellow-900/40 text-yellow-400 border-yellow-500/30';
            case 'canceled':
            case 'failed': return 'bg-brand-red/20 text-brand-orange border-brand-orange/30';
            default: return 'bg-gray-800 text-gray-300 border-gray-700';
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

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, searchTerm, itemsPerPage]);

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
                    <h1 className="text-2xl font-black font-heading uppercase italic tracking-widest text-white flex items-center gap-3">
                        <Package className="w-8 h-8 text-brand-orange" />
                        Gerenciamento de Pedidos
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Veja todos os pedidos, status de pagamentos e dados dos clientes.</p>
                </div>

                <button
                    onClick={exportToCsv}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brand-red to-brand-orange text-white rounded-lg font-black font-heading uppercase tracking-widest text-sm hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all w-full md:w-auto"
                >
                    <Download className="w-4 h-4" />
                    Exportar CSV
                </button>
            </div>

            <div className="bg-black rounded-2xl shadow-lg border border-brand-red/20 overflow-hidden">
                <div className="p-4 border-b border-brand-red/20 flex flex-col lg:flex-row gap-4 justify-between bg-brand-dark/50">
                    <div className="flex flex-wrap gap-2 self-start">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors border ${statusFilter === 'all' ? 'bg-brand-red/20 text-brand-orange border-brand-orange/30' : 'bg-transparent text-gray-400 border-gray-700 hover:text-white hover:border-gray-500'}`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setStatusFilter('paid')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-1 border ${statusFilter === 'paid' ? 'bg-green-900/40 text-green-400 border-green-500/30' : 'bg-transparent text-gray-400 border-gray-700 hover:text-white hover:border-gray-500'}`}
                        >
                            <CheckCircle className="w-4 h-4" /> Aprovados
                        </button>
                        <button
                            onClick={() => setStatusFilter('pending')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-1 border ${statusFilter === 'pending' ? 'bg-yellow-900/40 text-yellow-400 border-yellow-500/30' : 'bg-transparent text-gray-400 border-gray-700 hover:text-white hover:border-gray-500'}`}
                        >
                            <Clock className="w-4 h-4" /> Pendentes
                        </button>
                        <button
                            onClick={() => setStatusFilter('failed')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-1 border ${statusFilter === 'failed' ? 'bg-brand-red/20 text-brand-orange border-brand-orange/30' : 'bg-transparent text-gray-400 border-gray-700 hover:text-white hover:border-gray-500'}`}
                        >
                            <XCircle className="w-4 h-4" /> Falhos
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
                            <span className="text-gray-400 text-sm font-bold uppercase font-heading">Ver:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="bg-brand-dark border border-brand-red/20 text-white text-sm rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-brand-orange outline-none cursor-pointer"
                            >
                                <option value={10}>10</option>
                                <option value={15}>15</option>
                                <option value={20}>20</option>
                            </select>
                        </div>
                        
                        <div className="relative w-full sm:w-64 lg:w-80">
                            <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Buscar (nome, email, pacote)..."
                                className="w-full pl-10 pr-4 py-2 bg-brand-dark border border-brand-red/20 text-white rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-brand-dark border-b border-brand-red/30">
                                <th className="p-4 font-black font-heading uppercase tracking-widest text-white text-xs w-24">ID</th>
                                <th className="p-4 font-black font-heading uppercase tracking-widest text-white text-xs">Cliente</th>
                                <th className="p-4 font-black font-heading uppercase tracking-widest text-white text-xs">Item Comprado</th>
                                <th className="p-4 font-black font-heading uppercase tracking-widest text-white text-xs">Data</th>
                                <th className="p-4 font-black font-heading uppercase tracking-widest text-white text-xs">Pagamento</th>
                                <th className="p-4 font-black font-heading uppercase tracking-widest text-white text-xs text-right">Valor</th>
                                <th className="p-4 font-black font-heading uppercase tracking-widest text-white text-xs text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-400 font-bold uppercase tracking-wider font-heading">Carregando pedidos...</td></tr>
                            ) : paginatedOrders.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-400 font-bold uppercase tracking-wider font-heading">Nenhum pedido encontrado.</td></tr>
                            ) : (
                                paginatedOrders.map(order => {
                                    const firstItem = order.order_items?.[0];
                                    const isFullAccess = firstItem?.access_level === 'full_access';

                                    return (
                                        <tr key={order.id} className="border-b border-brand-red/10 hover:bg-brand-dark/50 transition-colors">
                                            <td className="p-4 text-xs font-mono text-brand-orange uppercase">
                                                #{order.id.split('-')[0]}
                                            </td>
                                            <td className="p-4 text-sm">
                                                <div className="font-bold text-gray-200 uppercase tracking-wide font-heading">{order.profiles?.full_name || 'Usuário Deletado'}</div>
                                                <div className="text-gray-400 text-xs font-medium">{order.profiles?.email}</div>
                                                <div className="text-gray-500 text-xs mt-1">CPF: {order.profiles?.cpf || 'Não informado'}</div>
                                            </td>
                                            <td className="p-4">
                                                {firstItem ? (
                                                    <div>
                                                        <div className="font-bold font-heading text-white text-sm line-clamp-1 uppercase tracking-wider" title={firstItem.videos.title}>
                                                            {firstItem.videos.title}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-brand-orange font-bold uppercase">{firstItem.videos.event_name}</span>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${isFullAccess ? 'bg-purple-900/40 text-purple-400 border-purple-500/30' : 'bg-blue-900/40 text-blue-400 border-blue-500/30'}`}>
                                                                {isFullAccess ? 'Luta Completa' : 'Highlight'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : <span className="text-gray-500 text-sm italic">Sem item vinculado</span>}
                                            </td>
                                            <td className="p-4 text-sm text-gray-300 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-brand-red" />
                                                    {format(new Date(order.created_at), "dd MMM yy, HH:mm", { locale: ptBR })}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 bg-brand-dark rounded text-xs font-bold border ${order.payment_method === 'pix' ? 'text-green-400 border-green-500/30' : 'text-blue-400 border-blue-500/30'}`}>
                                                    {order.payment_method === 'pix' ? 'PIX' : 'CARTÃO'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-black text-white tracking-widest">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusStyle(order.status)}`}>
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-brand-red/20 bg-brand-dark/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-400 font-medium">
                            Mostrando <span className="text-white font-bold">{startIndex + 1}</span> até <span className="text-white font-bold">{Math.min(startIndex + itemsPerPage, filteredOrders.length)}</span> de <span className="text-white font-bold">{filteredOrders.length}</span> pedidos
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 rounded-lg border border-brand-red/20 bg-brand-dark text-gray-300 font-bold text-sm hover:text-white hover:border-brand-orange disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Anterior
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }).map((_, i) => {
                                    const page = i + 1;
                                    // Make pagination compact if too many pages
                                    if (totalPages > 5) {
                                        if (page !== 1 && page !== totalPages && Math.abs(currentPage - page) > 1) {
                                            if (page === 2 || page === totalPages - 1) return <span key={page} className="text-gray-500 px-1">...</span>;
                                            return null;
                                        }
                                    }

                                    return (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center transition-colors ${currentPage === page ? 'bg-brand-orange text-white' : 'text-gray-400 hover:text-white hover:bg-brand-dark'}`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 rounded-lg border border-brand-red/20 bg-brand-dark text-gray-300 font-bold text-sm hover:text-white hover:border-brand-orange disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Próxima
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
