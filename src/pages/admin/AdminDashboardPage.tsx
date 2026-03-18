import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { DollarSign, Video, Users, TrendingUp } from 'lucide-react';
import { useOutletContext, Navigate } from 'react-router-dom';

export function AdminDashboardPage() {
    const { isAdmin } = useOutletContext<{ isAdmin: boolean }>();

    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        activeVideos: 0,
        totalUsers: 0
    });

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        try {
            // Fetch counts
            const { count: videosCount } = await supabase
                .from('videos')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            const { count: ordersCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'paid');

            const { count: usersCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            // Calculate revenue (simple sum for MVP)
            const { data: revenueData } = await supabase
                .from('orders')
                .select('total_amount')
                .eq('status', 'paid');

            const totalRevenue = revenueData?.reduce((acc, order) => acc + (order.total_amount || 0), 0) || 0;

            setStats({
                totalRevenue: totalRevenue,
                totalOrders: ordersCount || 0,
                activeVideos: videosCount || 0,
                totalUsers: usersCount || 0
            });
        } catch (error) {
            console.error('Error loading admin stats:', error);
        }
    };

    const StatCard = ({ title, value, icon: Icon, color }: any) => (
        <div className="bg-black p-6 rounded-2xl shadow-[0_0_15px_rgba(220,38,38,0.1)] border border-brand-red/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`p-3 rounded-lg bg-brand-dark border border-brand-red/20 ${color}`}>
                    <Icon className="w-6 h-6 text-brand-orange" />
                </div>
                <span className="text-green-500 text-sm font-bold flex items-center bg-green-900/20 px-2 py-1 rounded-full border border-green-500/20">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12%
                </span>
            </div>
            <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider relative z-10">{title}</h3>
            <p className="text-2xl font-black font-heading tracking-widest text-white mt-1 relative z-10">{value}</p>
        </div>
    );

    if (!isAdmin) return <Navigate to="/admin/production" replace />;

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-black font-heading uppercase italic tracking-widest text-white">Dashboard <span className="text-brand-orange">Geral</span></h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Faturamento Total"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRevenue)}
                    icon={DollarSign}
                    color=""
                />
                <StatCard
                    title="Vendas Realizadas"
                    value={stats.totalOrders}
                    icon={Users}
                    color=""
                />
                <StatCard
                    title="Vídeos Ativos"
                    value={stats.activeVideos}
                    icon={Video}
                    color=""
                />
                <StatCard
                    title="Total Usuários"
                    value={stats.totalUsers}
                    icon={Users}
                    color=""
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-black p-6 rounded-2xl shadow-lg border border-brand-red/20">
                    <h3 className="font-black font-heading uppercase italic tracking-widest text-white mb-4 border-b border-brand-red/20 pb-4">Vendas <span className="text-brand-orange">Recentes</span></h3>
                    <RecentSalesList />
                </div>

                <div className="bg-black p-6 rounded-2xl shadow-lg border border-brand-red/20">
                    <h3 className="font-black font-heading uppercase italic tracking-widest text-white mb-4 border-b border-brand-red/20 pb-4">Vídeos Mais <span className="text-brand-orange">Populares</span></h3>
                    <p className="text-gray-500 text-sm italic">Dados indisponíveis no momento.</p>
                </div>
            </div>
        </div>
    );
}

function RecentSalesList() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            const { data } = await supabase
                .from('orders')
                .select(`
                    id, 
                    total_amount, 
                    created_at,
                    status,
                    profiles (full_name, email)
                `)
                .order('created_at', { ascending: false })
                .limit(10);

            if (data) setOrders(data);
            setLoading(false);
        };
        fetchOrders();
    }, []);

    if (loading) return <div className="text-gray-500 text-sm font-bold uppercase tracking-wider">Carregando...</div>;
    if (orders.length === 0) return <div className="text-gray-500 text-sm italic">Nenhuma venda recente.</div>;

    return (
        <div className="space-y-4">
            {orders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 hover:bg-brand-dark/50 rounded-lg transition-colors border-b border-brand-red/10 last:border-0">
                    <div>
                        <p className="font-bold text-gray-200 uppercase tracking-wide">
                            {order.profiles?.full_name || order.profiles?.email || 'Usuário'}
                        </p>
                        <p className="text-xs text-brand-orange uppercase font-mono mt-1">ID: #{order.id.substring(0, 8)}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-black text-green-400 tracking-wider">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">
                            {new Date(order.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
