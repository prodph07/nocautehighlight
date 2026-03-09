import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Package, Calendar, Scissors, Settings, Menu, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useState } from 'react';

export function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between bg-slate-900 text-white p-4 sticky top-0 z-40">
                <div>
                    <h1 className="text-lg font-bold tracking-wider">ADMIN</h1>
                    <p className="text-[10px] text-slate-400">High Nocaute Manager</p>
                </div>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 focus:outline-none">
                    {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden" 
                    onClick={() => setIsSidebarOpen(false)} 
                />
            )}

            {/* Sidebar */}
            <aside className={`w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-slate-800 hidden md:block">
                    <h1 className="text-xl font-bold tracking-wider">ADMIN</h1>
                    <p className="text-xs text-slate-400">High Nocaute Manager</p>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <Link
                        to="/admin"
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        <span>Dashboard</span>
                    </Link>

                    {/* Removed videos global link */}

                    <Link
                        to="/admin/events"
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/events') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                        <Calendar className="w-5 h-5" />
                        <span>Eventos</span>
                    </Link>

                    <Link
                        to="/admin/orders"
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/orders') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                        <Package className="w-5 h-5" />
                        <span>Pedidos</span>
                    </Link>

                    <Link
                        to="/admin/production"
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/production') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                        <Scissors className="w-5 h-5" />
                        <span>Fila de Edição</span>
                    </Link>

                    <Link
                        to="/admin/settings"
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/settings') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                        <Settings className="w-5 h-5" />
                        <span>Configurações</span>
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
            <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <div className="mx-auto w-full max-w-7xl">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
