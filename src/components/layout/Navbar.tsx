
import { useState, useEffect } from 'react';
import { Video, User, LogOut, HelpCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export function Navbar() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [hasPendingForm, setHasPendingForm] = useState(false);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                checkPendingForms(currentUser.id);
            }
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                checkPendingForms(currentUser.id);
            } else {
                setHasPendingForm(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkPendingForms = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('order_items')
                .select(`id`)
                .eq('production_status', 'pending_form')
                .eq('orders.user_id', userId)
                // Filter inner join using PostgREST syntax
                .select('id, orders!inner(user_id, status)')
                .eq('orders.status', 'paid');
                
            if (error) {
                console.error("Error checking pending forms:", error);
                return;
            }

            // data will contain records if there are any paid orders with pending forms
            if (data && data.length > 0) {
                // double check if it matches the current user just to be sure
                const userForms = data.filter((item: any) => item.orders?.user_id === userId);
                setHasPendingForm(userForms.length > 0);
            } else {
                setHasPendingForm(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        <nav className="bg-brand-dark border-b border-brand-red/20 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="p-2 bg-gradient-to-br from-brand-red to-brand-orange rounded-lg shadow-lg shadow-brand-red/20">
                            <Video className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-black font-heading tracking-wider uppercase italic text-white">FightVideos</span>
                    </Link>

                    <div className="flex items-center space-x-4">
                        {user ? (
                            <div className="flex items-center space-x-4">


                                <Link
                                    to="/ajuda"
                                    className="flex items-center text-gray-300 hover:text-brand-orange font-medium transition-colors"
                                    title="Ajuda"
                                >
                                    <HelpCircle className="w-5 h-5 sm:mr-2" />
                                    <span className="hidden sm:inline">Ajuda</span>
                                </Link>

                                <Link
                                    to="/minha-conta"
                                    className="relative flex items-center text-gray-300 hover:text-brand-orange font-medium transition-colors"
                                    title="Minha Conta"
                                >
                                    <div className="relative">
                                        <User className={`w-5 h-5 sm:mr-2 ${hasPendingForm ? 'text-brand-orange animate-pulse' : ''}`} />
                                        {hasPendingForm && (
                                            <span className="absolute -top-1 -right-1 sm:right-1 flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-red"></span>
                                            </span>
                                        )}
                                    </div>
                                    <span className={`hidden sm:inline ${hasPendingForm ? 'text-brand-orange' : ''}`}>Minha Conta</span>
                                    
                                    {hasPendingForm && (
                                        <div className="absolute top-10 right-0 sm:left-1/2 sm:-translate-x-1/2 w-48 bg-gradient-to-r from-brand-red to-brand-orange text-white text-xs font-bold px-3 py-2 rounded shadow-xl animate-bounce before:content-[''] before:absolute before:-top-1 before:right-6 sm:before:left-1/2 sm:before:-translate-x-1/2 before:border-4 before:border-transparent before:border-b-brand-orange">
                                            Tem um formulário para ser preenchido!
                                        </div>
                                    )}
                                </Link>

                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-brand-red hover:bg-brand-red/10 rounded-lg transition-colors"
                                    title="Sair"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <Link to="/ajuda" className="text-gray-300 hover:text-white font-medium text-sm sm:text-base hidden sm:block transition-colors">
                                    Ajuda
                                </Link>
                                <Link to="/login" className="text-gray-300 hover:text-white font-medium text-sm sm:text-base transition-colors">
                                    Login
                                </Link>
                                <Link to="/signup" className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-brand-red to-brand-orange text-white rounded-lg font-bold uppercase tracking-wider text-xs sm:text-sm hover:shadow-lg hover:shadow-brand-red/30 transition-all font-heading text-center">
                                    Cadastrar
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
