import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { DollarSign, Video, Users, TrendingUp, Calendar, ShoppingCart, Loader2, Wallet } from 'lucide-react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfMonth, startOfToday, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type DateFilter = 'today' | '7days' | '30days' | 'month' | 'custom' | 'all';

export function AdminDashboardPage() {
    const { isAdmin } = useOutletContext<{ isAdmin: boolean }>();

    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState<DateFilter>('30days');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    
    // Raw Data state
    const [allVideos, setAllVideos] = useState<any[]>([]);
    const [allPaidOrders, setAllPaidOrders] = useState<any[]>([]);
    const [allOrderItems, setAllOrderItems] = useState<any[]>([]);
    const [totalUsersCount, setTotalUsersCount] = useState(0);

    // Pagarme balance
    const [pagarmeBalance, setPagarmeBalance] = useState<{available: number, waiting_funds: number} | null>(null);

    useEffect(() => {
        loadRawData();
        loadBalance();
    }, []);

    async function loadBalance() {
        try {
            const { data, error } = await supabase.functions.invoke('pagarme-balance');
            if (error) throw error;
            console.log('DEBUG BALANCE RAW DATA:', data);

            if (data && data.success && data.data) {
                // A API da Pagar.me v5 retorna available_amount e waiting_funds_amount
                const available = data.data.available_amount ?? data.data.available?.amount ?? 0;
                const waiting_funds = data.data.waiting_funds_amount ?? data.data.waiting_funds?.amount ?? 0;
                
                setPagarmeBalance({ 
                    available: available / 100, 
                    waiting_funds: waiting_funds / 100 
                });
            }
        } catch (err) {
            console.error('Failed to load pagarme balance:', err);
        }
    }

    async function loadRawData() {
        setLoading(true);
        try {
            // 1. Fetch all active videos
            const { data: videos } = await supabase
                .from('videos')
                .select('id, title, event_name, is_active')
                .eq('is_active', true);

            // 2. Fetch all paid orders
            const { data: orders } = await supabase
                .from('orders')
                .select('id, created_at, status, total_amount, profiles(full_name, email, whatsapp)')
                .eq('status', 'paid')
                .order('created_at', { ascending: true }); // ascending for charts

            // 3. Fetch all order items linked to paid orders (to cross reference sales easily)
            const { data: items } = await supabase
                .from('order_items')
                .select('id, order_id, video_id, access_level, production_form_data, orders!inner(status, profiles(full_name, whatsapp))')
                .eq('orders.status', 'paid');

            // 4. Fetch total users
            const { count: usersCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            setAllVideos(videos || []);
            setAllPaidOrders(orders || []);
            setAllOrderItems(items || []);
            setTotalUsersCount(usersCount || 0);

        } catch (error) {
            console.error('Error loading admin stats:', error);
        } finally {
            setLoading(false);
        }
    }

    // -- DERIVED DATA BASED ON DATE FILTER --

    const filteredOrders = useMemo(() => {
        if (dateFilter === 'all') return allPaidOrders;
        
        let cutoffDate = new Date();
        const today = startOfToday();

        if (dateFilter === 'custom') {
            if (!startDate && !endDate) return allPaidOrders;
            return allPaidOrders.filter(order => {
                const orderDate = parseISO(order.created_at);
                if (startDate && orderDate < new Date(`${startDate}T00:00:00`)) return false;
                if (endDate && orderDate > new Date(`${endDate}T23:59:59.999`)) return false;
                return true;
            });
        }

        switch (dateFilter) {
            case 'today': cutoffDate = today; break;
            case '7days': cutoffDate = subDays(today, 7); break;
            case '30days': cutoffDate = subDays(today, 30); break;
            case 'month': cutoffDate = startOfMonth(today); break;
        }

        return allPaidOrders.filter(order => isAfter(parseISO(order.created_at), cutoffDate));
    }, [allPaidOrders, dateFilter, startDate, endDate]);

    // Calculate Top Level Stats
    const stats = useMemo(() => {
        const totalRevenue = filteredOrders.reduce((acc, order) => acc + (order.total_amount || 0), 0);
        return {
            totalRevenue,
            totalOrders: filteredOrders.length,
            activeVideos: allVideos.length,
            totalUsers: totalUsersCount
        };
    }, [filteredOrders, allVideos, totalUsersCount]);

    // Calculate Chart Data (Revenue by Date)
    const chartData = useMemo(() => {
        const grouped: Record<string, number> = {};
        
        filteredOrders.forEach(order => {
            // format to 'DD/MM'
            const dateStr = format(parseISO(order.created_at), 'dd/MM', { locale: ptBR });
            if (!grouped[dateStr]) grouped[dateStr] = 0;
            grouped[dateStr] += (order.total_amount || 0);
        });

        // Convert to array
        return Object.keys(grouped).map(date => ({
            date,
            Faturamento: grouped[date]
        }));
    }, [filteredOrders]);

    // Calculate Revenue per Event (based on filtered orders)
    const eventRevenueData = useMemo(() => {
        const grouped: Record<string, { faturamento: number, vendas: number }> = {};
        
        // Find which orders belong to which event via order_items
        const orderIdToEventMap: Record<string, string> = {};
        allOrderItems.forEach(item => {
            const video = allVideos.find(v => v.id === item.video_id);
            if (video && video.event_name) {
                // If an order has multiple items, we might double count or pick the first.
                // Assuming 1 video per order in current business logic:
                if (!orderIdToEventMap[item.order_id]) {
                    orderIdToEventMap[item.order_id] = video.event_name;
                }
            }
        });

        filteredOrders.forEach(order => {
            const eventName = orderIdToEventMap[order.id] || 'Outros / Desconhecido';
            if (!grouped[eventName]) grouped[eventName] = { faturamento: 0, vendas: 0 };
            grouped[eventName].faturamento += (order.total_amount || 0);
            grouped[eventName].vendas += 1;
        });

        return Object.keys(grouped).map(event_name => ({
            name: event_name,
            Faturamento: grouped[event_name].faturamento,
            Vendas: grouped[event_name].vendas
        })).sort((a, b) => b.Faturamento - a.Faturamento);

    }, [filteredOrders, allOrderItems, allVideos]);

    // Formatters
    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
        <div className="bg-black p-6 rounded-2xl shadow-[0_0_15px_rgba(220,38,38,0.1)] border border-brand-red/20 relative overflow-hidden group">
            <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`p-3 rounded-lg bg-brand-dark border border-gray-800`}>
                    <Icon className="w-6 h-6 text-brand-orange" />
                </div>
            </div>
            <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider relative z-10">{title}</h3>
            <p className="text-2xl font-black font-heading tracking-widest text-white mt-1 relative z-10">{value}</p>
        </div>
    );

    if (!isAdmin) return <Navigate to="/admin/production" replace />;

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-brand-orange" />
                <p className="text-gray-400 font-bold uppercase tracking-widest animate-pulse">Carregando métricas...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-black font-heading uppercase italic tracking-widest text-white">Dashboard <span className="text-brand-orange">Geral</span></h2>
                    <p className="text-gray-400 mt-1 font-medium">Acompanhe métricas e o faturamento detalhado da plataforma.</p>
                </div>

                {/* Date Filters */}
                <div className="flex flex-col items-start md:items-end gap-3">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'today', label: 'Hoje' },
                            { id: '7days', label: '7 Dias' },
                            { id: '30days', label: '30 Dias' },
                            { id: 'month', label: 'Este Mês' },
                            { id: 'custom', label: 'Personalizado' },
                            { id: 'all', label: 'Tudo' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setDateFilter(f.id as DateFilter)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                                    dateFilter === f.id 
                                    ? 'bg-brand-orange text-white border-brand-orange shadow-[0_0_15px_rgba(249,115,22,0.4)]' 
                                    : 'bg-black text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Inputs de Data Personalizada */}
                    {dateFilter === 'custom' && (
                        <div className="flex flex-wrap items-center gap-3 bg-black p-3 rounded-xl border border-brand-red/20 w-full md:w-auto">
                            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase">
                                <span>De:</span>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-brand-dark border border-gray-700 text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-brand-orange"
                                />
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase">
                                <span>Até:</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-brand-dark border border-gray-700 text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-brand-orange"
                                />
                            </div>
                            {(startDate || endDate) && (
                                <button
                                    onClick={() => { setStartDate(''); setEndDate(''); }}
                                    className="text-xs text-brand-orange hover:underline font-bold uppercase tracking-wider px-2"
                                >
                                    Limpar
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard
                    title="Disponível (Saque)"
                    value={pagarmeBalance ? formatCurrency(pagarmeBalance.available) : '...'}
                    icon={Wallet}
                    colorClass="from-emerald-500/10"
                />
                <StatCard
                    title="Faturamento"
                    value={formatCurrency(stats.totalRevenue)}
                    icon={DollarSign}
                    colorClass="from-green-500/10"
                />
                <StatCard
                    title="Vendas Pagas"
                    value={stats.totalOrders}
                    icon={ShoppingCart}
                    colorClass="from-blue-500/10"
                />
                <StatCard
                    title="Vídeos Ativos"
                    value={stats.activeVideos}
                    icon={Video}
                    colorClass="from-brand-red/10"
                />
                <StatCard
                    title="Clientes Cadastrados"
                    value={stats.totalUsers}
                    icon={Users}
                    colorClass="from-purple-500/10"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Evolution Chart */}
                <div className="bg-black p-6 rounded-2xl shadow-lg border border-brand-red/20 lg:col-span-2 flex flex-col">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
                        <TrendingUp className="w-5 h-5 text-brand-orange" />
                        <h3 className="font-black font-heading uppercase italic tracking-widest text-white">Evolução de <span className="text-brand-orange">Faturamento</span></h3>
                    </div>
                    
                    <div className="flex-grow w-full h-[300px]">
                        {chartData.length === 0 ? (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 italic">Nenhuma venda encontrada no período.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="date" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                                    <YAxis tickFormatter={(value) => `R$ ${value}`} stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                                    <RechartsTooltip 
                                        formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Faturamento']}
                                        contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                                        itemStyle={{ color: '#f97316', fontWeight: 'bold' }}
                                    />
                                    <Line type="monotone" dataKey="Faturamento" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316' }} activeDot={{ r: 6, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Revenue by Event */}
                <div className="bg-black p-6 rounded-2xl shadow-lg border border-brand-red/20 flex flex-col">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
                        <Calendar className="w-5 h-5 text-brand-orange" />
                        <h3 className="font-black font-heading uppercase italic tracking-widest text-white">Por <span className="text-brand-orange">Evento</span></h3>
                    </div>
                    
                    <div className="flex-grow w-full">
                        {eventRevenueData.length === 0 ? (
                            <div className="w-full h-[200px] flex items-center justify-center text-gray-500 italic">Sem faturamento no período.</div>
                        ) : (
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {eventRevenueData.map((ev, idx) => (
                                    <div key={idx} className="bg-brand-dark p-4 rounded-xl border border-gray-800 hover:border-brand-red/30 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-white font-bold text-sm tracking-wide uppercase line-clamp-1 flex-1 pr-2">{ev.name}</h4>
                                            <span className="text-brand-orange font-black text-sm whitespace-nowrap">{formatCurrency(ev.Faturamento)}</span>
                                        </div>
                                        <div className="w-full bg-black h-2 rounded-full overflow-hidden">
                                            <div 
                                                className="bg-brand-orange h-full rounded-full" 
                                                style={{ width: `${Math.max(5, (ev.Faturamento / eventRevenueData[0].Faturamento) * 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2 font-medium">{ev.Vendas} venda(s) associada(s)</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Styles for Scrollbar inside component for isolation */}
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
                .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                    background-color: #555;
                }
            `}</style>
        </div>
    );
}

