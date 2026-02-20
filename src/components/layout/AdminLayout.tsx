import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Package, Calendar, Scissors } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold tracking-wider">ADMIN</h1>
                    <p className="text-xs text-slate-400">High Nocaute Manager</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        to="/admin"
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        <span>Dashboard</span>
                    </Link>

                    {/* Removed videos global link */}

                    <Link
                        to="/admin/events"
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/events') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                        <Calendar className="w-5 h-5" />
                        <span>Eventos</span>
                    </Link>

                    <Link
                        to="/admin/orders"
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/orders') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                        <Package className="w-5 h-5" />
                        <span>Pedidos</span>
                    </Link>

                    <Link
                        to="/admin/production"
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/production') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                        <Scissors className="w-5 h-5" />
                        <span>Fila de Edição</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-3 w-full text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Sair</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}
