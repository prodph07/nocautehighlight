import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { DollarSign, Video, Users, TrendingUp, Calendar, MessageCircle, AlertCircle, ShoppingCart, RefreshCw, Loader2 } from 'lucide-react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfMonth, startOfToday, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type DateFilter = 'today' | '7days' | '30days' | 'month' | 'all';

export function AdminDashboardPage() {
    const { isAdmin } = useOutletContext<{ isAdmin: boolean }>();

    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState<DateFilter>('30days');
    
    // Raw Data state
    const [allVideos, setAllVideos] = useState<any[]>([]);
    const [allPaidOrders, setAllPaidOrders] = useState<any[]>([]);
    const [allOrderItems, setAllOrderItems] = useState<any[]>([]);
    const [totalUsersCount, setTotalUsersCount] = useState(0);

    useEffect(() => {
        loadRawData();
    }, []);

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

        switch (dateFilter) {
            case 'today': cutoffDate = today; break;
            case '7days': cutoffDate = subDays(today, 7); break;
            case '30days': cutoffDate = subDays(today, 30); break;
            case 'month': cutoffDate = startOfMonth(today); break;
        }

        return allPaidOrders.filter(order => isAfter(parseISO(order.created_at), cutoffDate));
    }, [allPaidOrders, dateFilter]);

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

    // Calculate Opportunities (LIFETIME data, ignoring date filter)
    const opportunitiesData = useMemo(() => {
        const salesMap: Record<string, any[]> = {};
        allVideos.forEach(v => salesMap[v.id] = []);

        // Populate sales map
        allOrderItems.forEach(item => {
            if (salesMap[item.video_id]) {
                salesMap[item.video_id].push(item);
            }
        });

        const groupedByEvent: Record<string, { unsold: any[], singleSale: any[] }> = {};

        allVideos.forEach(video => {
            const eventName = video.event_name || 'Eventos Desconhecidos';
            if (!groupedByEvent[eventName]) {
                groupedByEvent[eventName] = { unsold: [], singleSale: [] };
            }

            const items = salesMap[video.id];
            if (items.length === 0) {
                groupedByEvent[eventName].unsold.push(video);
            } else if (items.length === 1) {
                const item = items[0];
                const profile = item.orders?.profiles || {};
                const formData = item.production_form_data || {};
                
                groupedByEvent[eventName].singleSale.push({
                    video,
                    buyerData: {
                        name: profile.full_name || 'Desconhecido',
                        whatsapp: profile.whatsapp || null,
                        fighterName: formData.fighterName || null
                    }
                });
            }
        });

        // Ensure sorted inside each event
        Object.values(groupedByEvent).forEach(group => {
            group.unsold.sort((a, b) => a.title.localeCompare(b.title));
            group.singleSale.sort((a, b) => a.video.title.localeCompare(b.video.title));
        });

        return groupedByEvent;
    }, [allVideos, allOrderItems]);

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

    const formatPhoneForLink = (phone: string) => {
        return phone.replace(/\D/g, ''); // só números
    };

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
                    <p className="text-gray-400 mt-1 font-medium">Acompanhe métricas, faturamento e descubra novas oportunidades de venda.</p>
                </div>

                {/* Date Filters */}
                <div className="flex flex-wrap gap-2">
                    {[
                        { id: 'today', label: 'Hoje' },
                        { id: '7days', label: '7 Dias' },
                        { id: '30days', label: '30 Dias' },
                        { id: 'month', label: 'Este Mês' },
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
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

            {/* Opportunities Section */}
            <div className="bg-black p-6 rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.1)] border border-brand-red/20 mt-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 border-b border-gray-800 pb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <AlertCircle className="w-6 h-6 text-brand-orange" />
                            <h3 className="text-2xl font-black font-heading uppercase italic tracking-widest text-white">Oportunidades de <span className="text-brand-orange">Venda</span></h3>
                        </div>
                        <p className="text-gray-400 text-sm font-medium">Lutas com 1 ou nenhuma venda. Aborde o oponente para maximizar seu lucro.</p>
                    </div>
                    <button onClick={loadRawData} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold uppercase tracking-wider px-4 py-2 rounded-lg flex items-center gap-2 border border-gray-600 transition-colors">
                        <RefreshCw className="w-3.5 h-3.5" /> Atualizar Radar
                    </button>
                </div>

                <div className="space-y-6">
                    {Object.entries(opportunitiesData)
                        .sort(([eventA], [eventB]) => eventA.localeCompare(eventB))
                        .map(([eventName, group], eventIndex) => {
                            if (group.unsold.length === 0 && group.singleSale.length === 0) return null;

                            return (
                                <div key={eventIndex} className="bg-brand-dark/40 rounded-2xl border border-gray-800 p-6 shadow-inner">
                                    <h4 className="flex items-center gap-3 text-xl font-black text-white font-heading uppercase italic tracking-widest mb-6 border-b border-gray-800 pb-4">
                                        <Calendar className="w-5 h-5 text-brand-orange" />
                                        {eventName}
                                    </h4>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        
                                        {/* 1 Sale Column */}
                                        <div>
                                            <h5 className="flex items-center gap-2 font-black text-sm text-gray-300 font-heading uppercase tracking-widest mb-4">
                                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-sans border border-blue-500/30">1</span>
                                                Apenas Uma Venda
                                                <span className="ml-auto text-xs text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded font-sans">{group.singleSale.length} lutas</span>
                                            </h5>
                                            
                                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                {group.singleSale.length === 0 ? (
                                                    <p className="text-gray-500 italic text-xs p-3 text-center border border-gray-800 rounded-lg border-dashed">Nenhuma oportunidade na categoria.</p>
                                                ) : (
                                                    group.singleSale.map((item, i) => (
                                                        <div key={i} className="bg-black rounded-lg border border-gray-800 p-4 transition-all hover:border-blue-500/30 group">
                                                            <p className="text-white font-bold text-sm tracking-wide uppercase line-clamp-2 mb-3">{item.video.title}</p>
                                                            
                                                            <div className="bg-brand-dark/80 p-3 rounded-md border border-gray-800">
                                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Dados do Comprador</p>
                                                                <p className="text-xs text-gray-300"><span className="text-gray-500">Perfil:</span> {item.buyerData.name}</p>
                                                                {item.buyerData.fighterName && (
                                                                    <p className="text-xs text-gray-300 mt-1"><span className="text-gray-500">Lutador:</span> <strong className="text-white">{item.buyerData.fighterName}</strong></p>
                                                                )}
                                                            </div>

                                                            {item.buyerData.whatsapp ? (
                                                                <a 
                                                                    href={`https://wa.me/${formatPhoneForLink(item.buyerData.whatsapp)}?text=Olá ${item.buyerData.name}, vi que você adquiriu o highlight da luta da sua equipe. Gostaria de oferecer a edição para o seu oponente também?`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="mt-3 w-full py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                                                                >
                                                                    <MessageCircle className="w-4 h-4" />
                                                                    Abordar no WhatsApp
                                                                </a>
                                                            ) : (
                                                                <div className="mt-3 w-full py-2 bg-gray-800 text-gray-500 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-gray-700">
                                                                    WhatsApp Indisponível
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        {/* 0 Sales Column */}
                                        <div>
                                            <h5 className="flex items-center gap-2 font-black text-sm text-gray-300 font-heading uppercase tracking-widest mb-4">
                                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-xs font-sans border border-red-500/30">0</span>
                                                Nenhuma Venda
                                                <span className="ml-auto text-xs text-red-400 bg-red-900/30 px-2 py-0.5 rounded font-sans">{group.unsold.length} lutas</span>
                                            </h5>
                                            
                                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                {group.unsold.length === 0 ? (
                                                    <p className="text-gray-500 italic text-xs p-3 text-center border border-gray-800 rounded-lg border-dashed">Todas as lutas já tiveram vendas!</p>
                                                ) : (
                                                    group.unsold.map((video, i) => (
                                                        <div key={i} className="bg-black rounded-lg border border-gray-800 p-4 transition-all hover:border-red-500/30">
                                                            <p className="text-white font-bold text-sm tracking-wide uppercase line-clamp-2">{video.title}</p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            );
                    })}
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
