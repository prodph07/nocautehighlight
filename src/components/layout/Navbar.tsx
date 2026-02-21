
import { useState, useEffect } from 'react';
import { Video, User, LogOut } from 'lucide-react';
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
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <Video className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">FightVideos</span>
                    </Link>

                    <div className="flex items-center space-x-4">
                        {user ? (
                            <div className="flex items-center space-x-4">


                                <Link
                                    to="/minha-conta"
                                    className="flex items-center text-gray-700 hover:text-blue-600 font-medium transition-colors"
                                >
                                    <User className="w-5 h-5 mr-2" />
                                    Minha Conta
                                </Link>

                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Sair"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm sm:text-base">
                                    Login
                                </Link>
                                <Link to="/signup" className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm sm:text-base">
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
