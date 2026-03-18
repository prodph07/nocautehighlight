import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, ShieldAlert } from 'lucide-react';

export function AdminRoute() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isEditor, setIsEditor] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        checkAdminStatus();
    }, []);

    const checkAdminStatus = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('is_admin, is_editor')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error("Error fetching profile for admin check:", error);
            }

            if (profile) {
                if (profile.is_admin === true) {
                    setIsAdmin(true);
                }
                if (profile.is_editor === true) {
                    setIsEditor(true);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!isAdmin && !isEditor) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border-t-4 border-red-500">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
                    <p className="text-gray-600 mb-8">
                        Você não tem privilégios de administrador ou editor para acessar esta página.
                        Este incidente foi registrado.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                    >
                        Voltar para a Página Inicial
                    </button>
                </div>
            </div>
        );
    }

    // If is admin or editor, render the child routes (AdminLayout)
    return <Outlet context={{ isAdmin, isEditor }} />;
}
