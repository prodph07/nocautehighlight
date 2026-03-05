
import { useState, useEffect } from 'react';
import { Video, User, LogOut, HelpCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export function Navbar() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

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
                                    className="flex items-center text-gray-300 hover:text-brand-orange font-medium transition-colors"
                                    title="Minha Conta"
                                >
                                    <User className="w-5 h-5 sm:mr-2" />
                                    <span className="hidden sm:inline">Minha Conta</span>
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
