import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { DollarSign, Video, Users, TrendingUp } from 'lucide-react';

export function AdminDashboardPage() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        activeVideos: 0,
        totalUsers: 0
    });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-green-500 text-sm font-medium flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12%
                </span>
            </div>
            <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
    );

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard Geral</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Faturamento Total"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRevenue)}
                    icon={DollarSign}
                    color="bg-green-600"
                />
                <StatCard
                    title="Vendas Realizadas"
                    value={stats.totalOrders}
                    icon={Users}
                    color="bg-blue-600"
                />
                <StatCard
                    title="Vídeos Ativos"
                    value={stats.activeVideos}
                    icon={Video}
                    color="bg-purple-600"
                />
                <StatCard
                    title="Total Usuários"
                    value={stats.totalUsers}
                    icon={Users}
                    color="bg-orange-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4">Vendas Recentes</h3>
                    <RecentSalesList />
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4">Vídeos Mais Populares</h3>
                    <p className="text-gray-500 text-sm">Dados indisponíveis no momento.</p>
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

    if (loading) return <div className="text-gray-500 text-sm">Carregando...</div>;
    if (orders.length === 0) return <div className="text-gray-500 text-sm">Nenhuma venda recente.</div>;

    return (
        <div className="space-y-4">
            {orders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                    <div>
                        <p className="font-medium text-gray-900">
                            {order.profiles?.full_name || order.profiles?.email || 'Usuário'}
                        </p>
                        <p className="text-xs text-gray-500">ID: {order.id.substring(0, 8)}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-green-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
                        </p>
                        <p className="text-xs text-gray-400">
                            {new Date(order.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
