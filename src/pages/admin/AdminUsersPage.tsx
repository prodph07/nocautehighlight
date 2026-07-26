import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useOutletContext, Navigate } from 'react-router-dom';
import { Users, Search, ShoppingBag, DollarSign, MessageCircle, ChevronRight, X, Loader2, UserCheck, UserX, Award, Download, Calendar, Layers, CheckSquare, Square, ChevronDown } from 'lucide-react';

interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    whatsapp?: string;
    cpf?: string;
    is_admin?: boolean;
    is_editor?: boolean;
    created_at: string;
}

interface UserPurchasedItem {
    orderId: string;
    orderDate: string;
    totalAmount: number;
    accessLevel: string;
    videoTitle: string;
    eventName: string;
}

interface UserStats extends UserProfile {
    totalOrders: number;
    totalSpent: number;
    hasPurchased: boolean;
    purchasedItems: UserPurchasedItem[];
    lastPurchaseDate?: string;
}

type FilterStatus = 'all' | 'buyers' | 'leads' | 'inactive';
type SortOption = 'spent_desc' | 'orders_desc' | 'recent' | 'oldest' | 'name_asc';

export function AdminUsersPage() {
    const { isAdmin } = useOutletContext<{ isAdmin: boolean }>();

    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [paidOrders, setPaidOrders] = useState<any[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
    const [isEventFilterOpen, setIsEventFilterOpen] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('orders_desc');

    const [selectedUser, setSelectedUser] = useState<UserStats | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            // 1. Fetch all user profiles
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            // 2. Fetch all paid orders with order items and video info
            const { data: ordersData } = await supabase
                .from('orders')
                .select(`
                    id,
                    user_id,
                    created_at,
                    total_amount,
                    status,
                    order_items (
                        id,
                        access_level,
                        video_id,
                        videos ( id, title, event_name )
                    )
                `)
                .eq('status', 'paid')
                .order('created_at', { ascending: false });

            setUsers(profilesData || []);
            setPaidOrders(ordersData || []);
        } catch (err) {
            console.error('Error loading users data:', err);
        } finally {
            setLoading(false);
        }
    }

    // Process user statistics
    const userStatsList: UserStats[] = useMemo(() => {
        // Group orders by user_id
        const userOrdersMap: Record<string, any[]> = {};
        paidOrders.forEach(order => {
            if (!userOrdersMap[order.user_id]) {
                userOrdersMap[order.user_id] = [];
            }
            userOrdersMap[order.user_id].push(order);
        });

        return users.map(user => {
            const userOrders = userOrdersMap[user.id] || [];
            let totalSpent = 0;
            const purchasedItems: UserPurchasedItem[] = [];

            userOrders.forEach(order => {
                totalSpent += (order.total_amount || 0);
                
                (order.order_items || []).forEach((item: any) => {
                    purchasedItems.push({
                        orderId: order.id,
                        orderDate: order.created_at,
                        totalAmount: order.total_amount || 0,
                        accessLevel: item.access_level || 'N/A',
                        videoTitle: item.videos?.title || 'Vídeo Desconhecido',
                        eventName: item.videos?.event_name || 'Evento Desconhecido'
                    });
                });
            });

            return {
                ...user,
                totalOrders: userOrders.length,
                totalSpent,
                hasPurchased: userOrders.length > 0,
                purchasedItems,
                lastPurchaseDate: userOrders.length > 0 ? userOrders[0].created_at : undefined
            };
        });
    }, [users, paidOrders]);

    // Extract list of all unique events from paid orders
    const availableEvents = useMemo(() => {
        const eventsSet = new Set<string>();
        paidOrders.forEach(order => {
            (order.order_items || []).forEach((item: any) => {
                const name = item.videos?.event_name;
                if (name) {
                    eventsSet.add(name);
                }
            });
        });
        return Array.from(eventsSet).sort();
    }, [paidOrders]);

    // Calculate Event Sum / Aggregates for selected events
    const eventSummary = useMemo(() => {
        const activeEventsSet = new Set(selectedEvents);
        const filterByEvents = activeEventsSet.size > 0;

        let totalRevenue = 0;
        let totalItemsSold = 0;
        const buyerIdsSet = new Set<string>();
        const userEventCounts: Record<string, Set<string>> = {};

        paidOrders.forEach(order => {
            const orderItems = order.order_items || [];
            const matchingItems = filterByEvents
                ? orderItems.filter((item: any) => activeEventsSet.has(item.videos?.event_name))
                : orderItems;

            if (matchingItems.length > 0) {
                buyerIdsSet.add(order.user_id);
                totalItemsSold += matchingItems.length;

                const orderTotal = order.total_amount || 0;
                const itemShare = orderItems.length > 0 ? (orderTotal / orderItems.length) * matchingItems.length : 0;
                totalRevenue += itemShare;

                if (!userEventCounts[order.user_id]) {
                    userEventCounts[order.user_id] = new Set<string>();
                }
                matchingItems.forEach((item: any) => {
                    if (item.videos?.event_name) {
                        userEventCounts[order.user_id].add(item.videos.event_name);
                    }
                });
            }
        });

        const repeatBuyersCount = Object.values(userEventCounts).filter(set => set.size > 1).length;

        return {
            isFiltered: filterByEvents,
            selectedCount: activeEventsSet.size,
            totalEventsAvailable: availableEvents.length,
            totalBuyers: buyerIdsSet.size,
            totalItemsSold,
            totalRevenue,
            repeatBuyersCount
        };
    }, [paidOrders, selectedEvents, availableEvents]);

    // Top Level Summary Stats
    const summary = useMemo(() => {
        const totalUsers = userStatsList.length;
        const buyersCount = userStatsList.filter(u => u.hasPurchased).length;
        const leadsCount = totalUsers - buyersCount;
        const totalRevenue = userStatsList.reduce((acc, u) => acc + u.totalSpent, 0);
        const averageTicket = buyersCount > 0 ? totalRevenue / buyersCount : 0;

        return {
            totalUsers,
            buyersCount,
            leadsCount,
            totalRevenue,
            averageTicket
        };
    }, [userStatsList]);

    // Filtered & Sorted Users
    const filteredUsers = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const activeEventsSet = new Set(selectedEvents);

        return userStatsList
            .filter(u => {
                // Event Filter
                if (activeEventsSet.size > 0) {
                    const userEventNames = u.purchasedItems.map(item => item.eventName);
                    const hasMatchingEvent = userEventNames.some(name => activeEventsSet.has(name));
                    if (!hasMatchingEvent) return false;
                }

                // Status Filter
                if (statusFilter === 'buyers' && !u.hasPurchased) return false;
                if (statusFilter === 'leads' && u.hasPurchased) return false;
                if (statusFilter === 'inactive') {
                    // Inactive if last purchase date is older than 30 days or no purchase and created >30 days ago
                    const referenceDate = u.lastPurchaseDate ? new Date(u.lastPurchaseDate) : new Date(u.created_at);
                    if (referenceDate > thirtyDaysAgo) return false;
                }

                // Search Term
                const term = searchTerm.toLowerCase().trim();
                if (!term) return true;

                const nameMatch = (u.full_name || '').toLowerCase().includes(term);
                const emailMatch = u.email.toLowerCase().includes(term);
                const phoneMatch = (u.whatsapp || '').includes(term);
                const cpfMatch = (u.cpf || '').includes(term);
                const eventMatch = u.purchasedItems.some(i => i.eventName.toLowerCase().includes(term));

                return nameMatch || emailMatch || phoneMatch || cpfMatch || eventMatch;
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case 'spent_desc':
                        return b.totalSpent - a.totalSpent;
                    case 'orders_desc':
                        return b.totalOrders - a.totalOrders;
                    case 'recent':
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    case 'oldest':
                        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    case 'name_asc':
                        return (a.full_name || a.email).localeCompare(b.full_name || b.email);
                    default:
                        return 0;
                }
            });
    }, [userStatsList, statusFilter, searchTerm, sortBy, selectedEvents]);

    const toggleEventSelection = (eventName: string) => {
        setSelectedEvents(prev =>
            prev.includes(eventName)
                ? prev.filter(e => e !== eventName)
                : [...prev, eventName]
        );
    };

    const selectAllEvents = () => {
        setSelectedEvents([...availableEvents]);
    };

    const clearEventSelection = () => {
        setSelectedEvents([]);
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const cleanPhone = (phone?: string) => {
        if (!phone) return '';
        let cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10 || cleaned.length === 11) {
            cleaned = '55' + cleaned;
        }
        return cleaned;
    };

    const handleExportCSV = () => {
        const headers = ['Nome', 'Email', 'WhatsApp', 'CPF', 'Status', 'Nº Compras', 'Total Gasto (R$)', 'Data Cadastro'];
        const rows = filteredUsers.map(u => [
            `"${u.full_name || ''}"`,
            `"${u.email}"`,
            `"${u.whatsapp || ''}"`,
            `"${u.cpf || ''}"`,
            `"${u.hasPurchased ? 'Comprador' : 'Lead'}"`,
            u.totalOrders,
            u.totalSpent.toFixed(2),
            `"${new Date(u.created_at).toLocaleDateString('pt-BR')}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `usuarios_high_nocaute_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isAdmin) return <Navigate to="/admin/production" replace />;

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-brand-orange" />
                <p className="text-gray-400 font-bold uppercase tracking-widest animate-pulse">Carregando usuários...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black font-heading uppercase italic tracking-widest text-white">
                        Gestão de <span className="text-brand-orange">Usuários</span>
                    </h2>
                    <p className="text-gray-400 mt-1 font-medium">Mapeie seus clientes, veja histórico de compras e identifique oportunidades.</p>
                </div>

                <button
                    onClick={handleExportCSV}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-dark border border-brand-red/20 hover:border-brand-orange text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shrink-0"
                >
                    <Download className="w-4 h-4 text-brand-orange" />
                    Exportar Lista (CSV)
                </button>
            </div>

            {/* Top Cards Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-black p-6 rounded-2xl border border-brand-red/20 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total de Cadastrados</p>
                        <h3 className="text-2xl font-black font-heading text-white mt-1">{summary.totalUsers}</h3>
                    </div>
                    <div className="p-3 bg-brand-dark rounded-xl border border-gray-800 text-brand-orange">
                        <Users className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-black p-6 rounded-2xl border border-brand-red/20 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Clientes Compradores</p>
                        <h3 className="text-2xl font-black font-heading text-green-400 mt-1">{summary.buyersCount}</h3>
                        <p className="text-[10px] text-gray-500 mt-1 font-semibold">{summary.totalUsers > 0 ? Math.round((summary.buyersCount / summary.totalUsers) * 100) : 0}% de conversão</p>
                    </div>
                    <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-xl text-green-400">
                        <UserCheck className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-black p-6 rounded-2xl border border-brand-red/20 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Leads (Não Compraram)</p>
                        <h3 className="text-2xl font-black font-heading text-yellow-400 mt-1">{summary.leadsCount}</h3>
                        <p className="text-[10px] text-gray-500 mt-1 font-semibold">Potenciais compradores</p>
                    </div>
                    <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-xl text-yellow-400">
                        <UserX className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-black p-6 rounded-2xl border border-brand-red/20 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gasto Médio p/ Comprador</p>
                        <h3 className="text-2xl font-black font-heading text-brand-orange mt-1">{formatCurrency(summary.averageTicket)}</h3>
                    </div>
                    <div className="p-3 bg-brand-dark rounded-xl border border-gray-800 text-brand-orange">
                        <DollarSign className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Unified Filter & Toolbar Controls */}
            <div className="bg-black p-4 rounded-2xl border border-brand-red/20 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-orange" />
                    <input
                        type="text"
                        placeholder="BUSCAR POR NOME, EMAIL, WHATSAPP OU EVENTO..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-9 py-2.5 bg-brand-dark border border-gray-700 rounded-xl text-white placeholder-gray-500 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-brand-orange transition-all"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Status Tabs */}
                    <div className="flex items-center bg-brand-dark p-1 rounded-xl border border-gray-800">
                        {[
                            { id: 'all', label: 'Todos' },
                            { id: 'buyers', label: 'Compradores' },
                            { id: 'leads', label: 'Não Compraram' },
                            { id: 'inactive', label: 'Inativos (+30d)' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setStatusFilter(f.id as FilterStatus)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                    statusFilter === f.id
                                        ? 'bg-brand-orange text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Event Filter Toggle Button */}
                    <div className="relative">
                        <button
                            onClick={() => setIsEventFilterOpen(!isEventFilterOpen)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border shrink-0 ${
                                selectedEvents.length > 0
                                    ? 'bg-purple-900/40 text-purple-300 border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                                    : 'bg-brand-dark text-gray-300 border-gray-700 hover:border-gray-500'
                            }`}
                        >
                            <Calendar className="w-4 h-4 text-purple-400" />
                            <span>{selectedEvents.length === 0 ? 'Filtrar por Evento' : `${selectedEvents.length} Evento(s)`}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isEventFilterOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Floating Event Selection Drawer */}
                        {isEventFilterOpen && (
                            <div className="absolute right-0 lg:left-0 lg:right-auto mt-2 w-[300px] sm:w-[400px] md:w-[500px] bg-brand-dark p-5 rounded-2xl border border-purple-500/50 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 animate-fadeIn origin-top">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-800 pb-3 mb-4 gap-3">
                                    <div className="flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-purple-400" />
                                        <h4 className="text-xs font-black uppercase tracking-wider text-white">
                                            Selecione Eventos
                                        </h4>
                                    </div>
                                    <div className="flex items-center gap-2 self-end sm:self-auto">
                                        <button
                                            onClick={selectAllEvents}
                                            className="text-[10px] text-gray-300 hover:text-white font-bold uppercase tracking-wider px-2.5 py-1 bg-black rounded border border-gray-700 transition-colors"
                                        >
                                            Todos
                                        </button>
                                        {selectedEvents.length > 0 && (
                                            <button
                                                onClick={clearEventSelection}
                                                className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider px-2.5 py-1 bg-red-950/40 rounded border border-red-500/30 transition-colors"
                                            >
                                                Limpar ({selectedEvents.length})
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setIsEventFilterOpen(false)}
                                            className="ml-1 text-gray-400 hover:text-white"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {availableEvents.length === 0 ? (
                                    <p className="text-xs text-gray-500 italic">Nenhum evento encontrado.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                        {availableEvents.map(evtName => {
                                            const isSelected = selectedEvents.includes(evtName);
                                            return (
                                                <button
                                                    key={evtName}
                                                    onClick={() => toggleEventSelection(evtName)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border ${
                                                        isSelected
                                                            ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_10px_rgba(147,51,234,0.4)]'
                                                            : 'bg-black text-gray-400 border-gray-800 hover:border-gray-700 hover:text-white'
                                                    }`}
                                                >
                                                    {isSelected ? <CheckSquare className="w-3.5 h-3.5 shrink-0" /> : <Square className="w-3.5 h-3.5 shrink-0 opacity-50" />}
                                                    <span className="text-left line-clamp-1">{evtName}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sorting Select */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="bg-brand-dark text-white border border-gray-700 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider outline-none focus:border-brand-orange cursor-pointer"
                    >
                        <option value="orders_desc">Mais Compras (Fidelidade)</option>
                        <option value="spent_desc">Maior Valor Gasto (VIP)</option>
                        <option value="recent">Mais Recentes</option>
                        <option value="oldest">Mais Antigos</option>
                        <option value="name_asc">Nome (A - Z)</option>
                    </select>
                </div>
            </div>

            {/* Event Sum Banner (Soma de Eventos) - Only shown when events are selected */}
            {selectedEvents.length > 0 && (
                <div className="bg-gradient-to-r from-purple-950/60 via-brand-dark to-purple-950/60 p-4 rounded-2xl border border-purple-500/40 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-900/40 border border-purple-500/40 text-purple-400 rounded-xl">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-purple-300">
                                Soma de {eventSummary.selectedCount} Evento(s) Selecionado(s)
                            </p>
                            <p className="text-[11px] text-gray-400 font-medium truncate max-w-md mt-0.5">
                                {selectedEvents.join(' • ')}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-sm w-full md:w-auto justify-between md:justify-end">
                        <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Faturamento</span>
                            <span className="font-black text-green-400 font-heading text-lg">{formatCurrency(eventSummary.totalRevenue)}</span>
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Compradores</span>
                            <span className="font-black text-white font-heading text-lg">{eventSummary.totalBuyers}</span>
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Lutas</span>
                            <span className="font-black text-brand-orange font-heading text-lg">{eventSummary.totalItemsSold}</span>
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Recorrentes</span>
                            <span className="font-black text-purple-400 font-heading text-lg" title="Clientes que compraram em mais de 1 dos eventos selecionados">{eventSummary.repeatBuyersCount}</span>
                        </div>

                        <button
                            onClick={clearEventSelection}
                            className="px-3 py-1 bg-purple-900/30 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                        >
                            Limpar
                        </button>
                    </div>
                </div>
            )}

            {/* Users Table / List */}
            {filteredUsers.length === 0 ? (
                <div className="bg-black p-12 rounded-2xl border border-brand-red/20 text-center text-gray-500 font-bold uppercase tracking-widest italic">
                    Nenhum usuário encontrado com os filtros aplicados.
                </div>
            ) : (
                <div className="bg-black rounded-2xl border border-brand-red/20 shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-brand-dark border-b border-gray-800 text-xs uppercase font-black font-heading text-gray-400 tracking-wider">
                                <tr>
                                    <th className="p-4">Usuário / Cliente</th>
                                    <th className="p-4">Contato</th>
                                    <th className="p-4">Eventos Comprados</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-center">Nº Compras</th>
                                    <th className="p-4 text-right">Total Gasto</th>
                                    <th className="p-4 text-center">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {filteredUsers.map(user => {
                                    const cleanedWp = cleanPhone(user.whatsapp);
                                    const uniqueUserEvents = Array.from(new Set(user.purchasedItems.map(i => i.eventName)));
                                    
                                    // Custom WhatsApp message templates
                                    const wpMessage = user.hasPurchased
                                        ? `Olá ${user.full_name || ''}, tudo bem? Sou da equipe High Nocaute!`
                                        : `Olá ${user.full_name || ''}, vi que você criou sua conta na High Nocaute! Precisa de ajuda para encontrar a luta da sua equipe ou gostaria de um cupom especial de primeira compra?`;

                                    return (
                                        <tr key={user.id} className="hover:bg-brand-dark/50 transition-colors">
                                            {/* Name & Role */}
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black font-heading text-sm uppercase shrink-0 ${
                                                        user.hasPurchased 
                                                            ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                                                            : 'bg-gray-800 text-gray-400 border border-gray-700'
                                                    }`}>
                                                        {user.full_name ? user.full_name.substring(0, 2) : user.email.substring(0, 2)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-white uppercase tracking-wide truncate flex items-center gap-2">
                                                            <span>{user.full_name || 'Sem nome cadastrado'}</span>
                                                            {user.totalOrders >= 3 && (
                                                                <span className="px-1.5 py-0.5 bg-yellow-900/40 border border-yellow-500/30 text-yellow-400 text-[9px] rounded font-sans uppercase font-bold flex items-center gap-1" title="Cliente Fiel (+3 Compras)">
                                                                    <Award className="w-3 h-3" /> VIP
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-gray-500 font-medium">Cadastrado em {new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Contact */}
                                            <td className="p-4">
                                                <p className="text-xs text-gray-300 font-medium truncate">{user.email}</p>
                                                {user.whatsapp ? (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-gray-400 font-medium">{user.whatsapp}</span>
                                                        {cleanedWp && (
                                                            <a
                                                                href={`https://wa.me/${cleanedWp}?text=${encodeURIComponent(wpMessage)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[#25D366] hover:text-green-400 transition-colors p-1"
                                                                title={user.hasPurchased ? "Conversar no WhatsApp" : "Abordar Lead com Oferta"}
                                                            >
                                                                <MessageCircle className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-gray-600 italic">Sem Whats</span>
                                                )}
                                            </td>

                                            {/* Events Purchased */}
                                            <td className="p-4 max-w-[200px]">
                                                {uniqueUserEvents.length === 0 ? (
                                                    <span className="text-[10px] text-gray-600 italic">Nenhum</span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1">
                                                        {uniqueUserEvents.map((evt, idx) => (
                                                            <span
                                                                key={idx}
                                                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border truncate max-w-[150px] ${
                                                                    selectedEvents.includes(evt)
                                                                        ? 'bg-purple-900/50 text-purple-300 border-purple-500/50'
                                                                        : 'bg-gray-800/80 text-gray-300 border-gray-700'
                                                                }`}
                                                                title={evt}
                                                            >
                                                                {evt}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="p-4">
                                                {user.hasPurchased ? (
                                                    <span className="px-2.5 py-1 bg-green-900/30 text-green-400 border border-green-500/30 rounded-lg text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1">
                                                        <UserCheck className="w-3.5 h-3.5" /> Comprador
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 bg-yellow-900/30 text-yellow-400 border border-yellow-500/30 rounded-lg text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1">
                                                        <UserX className="w-3.5 h-3.5" /> Lead (0 Compras)
                                                    </span>
                                                )}
                                            </td>

                                            {/* Orders Count */}
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                                                    user.totalOrders > 0 ? 'bg-brand-red/20 text-brand-orange border border-brand-orange/30' : 'text-gray-500'
                                                }`}>
                                                    {user.totalOrders} {user.totalOrders === 1 ? 'pedido' : 'pedidos'}
                                                </span>
                                            </td>

                                            {/* Total Spent */}
                                            <td className="p-4 text-right">
                                                <span className="font-black text-white font-heading text-base">
                                                    {formatCurrency(user.totalSpent)}
                                                </span>
                                            </td>

                                            {/* Action Button */}
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => setSelectedUser(user)}
                                                    className="px-3 py-1.5 bg-brand-dark hover:bg-gray-800 text-brand-orange border border-gray-700 hover:border-brand-orange rounded-xl text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1"
                                                >
                                                    Ver Ficha
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* User Details Modal / Drawer */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#111] border border-brand-red/30 p-6 sm:p-8 rounded-2xl w-full max-w-2xl relative shadow-[0_0_40px_rgba(220,38,38,0.2)] max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setSelectedUser(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Customer Overview Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800 pb-6 mb-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black font-heading text-xl uppercase ${
                                    selectedUser.hasPurchased 
                                        ? 'bg-green-900/30 text-green-400 border border-green-500/30' 
                                        : 'bg-gray-800 text-gray-400 border border-gray-700'
                                }`}>
                                    {selectedUser.full_name ? selectedUser.full_name.substring(0, 2) : selectedUser.email.substring(0, 2)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black font-heading uppercase text-white tracking-wide">
                                        {selectedUser.full_name || 'Sem Nome Cadastrado'}
                                    </h3>
                                    <p className="text-xs text-gray-400">{selectedUser.email}</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">Cadastrado em {new Date(selectedUser.created_at).toLocaleDateString('pt-BR')}</p>
                                </div>
                            </div>

                            {cleanPhone(selectedUser.whatsapp) && (
                                <a
                                    href={`https://wa.me/${cleanPhone(selectedUser.whatsapp)}?text=${encodeURIComponent(
                                        selectedUser.hasPurchased
                                            ? `Olá ${selectedUser.full_name || ''}, tudo bem? Sou da equipe High Nocaute.`
                                            : `Olá ${selectedUser.full_name || ''}, vi que você criou sua conta na High Nocaute! Precisa de ajuda para encontrar a luta da sua equipe ou gostaria de um cupom especial de primeira compra?`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    {selectedUser.hasPurchased ? 'Iniciar WhatsApp' : 'Abordar Lead no WhatsApp'}
                                </a>
                            )}
                        </div>

                        {/* Financial / Summary Bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 bg-brand-dark p-4 rounded-xl border border-gray-800">
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total de Pedidos</p>
                                <p className="text-lg font-black font-heading text-white">{selectedUser.totalOrders}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Investido</p>
                                <p className="text-lg font-black font-heading text-brand-orange">{formatCurrency(selectedUser.totalSpent)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Status do Perfil</p>
                                <p className="text-xs font-bold uppercase mt-1">
                                    {selectedUser.hasPurchased ? (
                                        <span className="text-green-400">Cliente Ativo</span>
                                    ) : (
                                        <span className="text-yellow-400">Lead Sem Compras</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Purchased Fights / Highlights History */}
                        <div>
                            <h4 className="text-lg font-black font-heading uppercase italic tracking-widest text-white mb-4 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-brand-orange" />
                                Histórico de Lutas Compradas
                            </h4>

                            {selectedUser.purchasedItems.length === 0 ? (
                                <div className="p-6 bg-brand-dark/40 rounded-xl border border-gray-800 text-center text-gray-500 text-xs font-bold uppercase tracking-wider">
                                    Este usuário ainda não realizou nenhuma compra.
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {selectedUser.purchasedItems.map((item, idx) => (
                                        <div key={idx} className="bg-brand-dark p-4 rounded-xl border border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                            <div>
                                                <p className="text-xs text-brand-orange font-bold uppercase tracking-wider">{item.eventName}</p>
                                                <h5 className="font-bold text-white text-sm uppercase tracking-wide mt-0.5">{item.videoTitle}</h5>
                                                <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-2">
                                                    <span>Pacote: <strong className="text-gray-300">{item.accessLevel}</strong></span>
                                                    <span>•</span>
                                                    <span>Data: {new Date(item.orderDate).toLocaleDateString('pt-BR')}</span>
                                                </p>
                                            </div>
                                            <div className="text-left sm:text-right shrink-0">
                                                <span className="text-sm font-black font-heading text-white">{formatCurrency(item.totalAmount)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Scrollbar Custom Style */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #333;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}

