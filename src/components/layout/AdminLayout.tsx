import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Package, Calendar, Scissors, Settings, Menu, X, Ticket } from 'lucide-react';
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
        <div className="min-h-screen bg-brand-dark flex flex-col md:flex-row font-sans text-gray-100">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between bg-black border-b border-brand-red/30 p-4 sticky top-0 z-40">
                <div>
                    <h1 className="text-lg font-black font-heading tracking-widest text-white uppercase italic">ADMIN</h1>
                    <p className="text-[10px] text-brand-orange uppercase font-bold tracking-wider">High Nocaute Manager</p>
                </div>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-white hover:text-brand-orange transition-colors focus:outline-none">
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
            <aside className={`w-64 bg-black border-r border-brand-red/20 flex flex-col fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-brand-red/20 hidden md:block">
                    <h1 className="text-2xl font-black font-heading tracking-widest text-white uppercase italic">ADMIN</h1>
                    <p className="text-xs text-brand-orange uppercase font-bold tracking-wider mt-1">High Nocaute Manager</p>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <Link
                        to="/admin"
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-bold uppercase tracking-wide text-sm ${isActive('/admin') ? 'bg-brand-red/20 text-brand-orange border border-brand-orange/30' : 'text-gray-400 hover:text-white hover:bg-brand-dark'}`}
                    >
                        <LayoutDashboard className={`w-5 h-5 ${isActive('/admin') ? 'text-brand-orange' : ''}`} />
                        <span>Dashboard</span>
                    </Link>

                    {/* Removed videos global link */}

                    <Link
                        to="/admin/events"
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-bold uppercase tracking-wide text-sm ${isActive('/admin/events') ? 'bg-brand-red/20 text-brand-orange border border-brand-orange/30' : 'text-gray-400 hover:text-white hover:bg-brand-dark'}`}
                    >
                        <Calendar className={`w-5 h-5 ${isActive('/admin/events') ? 'text-brand-orange' : ''}`} />
                        <span>Eventos</span>
                    </Link>

                    <Link
                        to="/admin/orders"
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-bold uppercase tracking-wide text-sm ${isActive('/admin/orders') ? 'bg-brand-red/20 text-brand-orange border border-brand-orange/30' : 'text-gray-400 hover:text-white hover:bg-brand-dark'}`}
                    >
                        <Package className={`w-5 h-5 ${isActive('/admin/orders') ? 'text-brand-orange' : ''}`} />
                        <span>Pedidos</span>
                    </Link>

                    <Link
                        to="/admin/production"
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-bold uppercase tracking-wide text-sm ${isActive('/admin/production') ? 'bg-brand-red/20 text-brand-orange border border-brand-orange/30' : 'text-gray-400 hover:text-white hover:bg-brand-dark'}`}
                    >
                        <Scissors className={`w-5 h-5 ${isActive('/admin/production') ? 'text-brand-orange' : ''}`} />
                        <span>Fila de Edição</span>
                    </Link>

                    <Link
                        to="/admin/coupons"
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-bold uppercase tracking-wide text-sm ${isActive('/admin/coupons') ? 'bg-brand-red/20 text-brand-orange border border-brand-orange/30' : 'text-gray-400 hover:text-white hover:bg-brand-dark'}`}
                    >
                        <Ticket className={`w-5 h-5 ${isActive('/admin/coupons') ? 'text-brand-orange' : ''}`} />
                        <span>Cupons</span>
                    </Link>

                    <Link
                        to="/admin/settings"
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-bold uppercase tracking-wide text-sm ${isActive('/admin/settings') ? 'bg-brand-red/20 text-brand-orange border border-brand-orange/30' : 'text-gray-400 hover:text-white hover:bg-brand-dark'}`}
                    >
                        <Settings className={`w-5 h-5 ${isActive('/admin/settings') ? 'text-brand-orange' : ''}`} />
                        <span>Configurações</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-brand-red/20">
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center space-x-3 px-4 py-3 w-full bg-brand-dark text-gray-300 hover:text-brand-red font-black font-heading uppercase italic tracking-widest border border-brand-red/20 hover:border-brand-red rounded-xl transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-1" />
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
