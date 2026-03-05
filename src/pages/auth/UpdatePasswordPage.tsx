import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, CheckCircle } from 'lucide-react';

export function UpdatePasswordPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Check if user has an active session indicating they came from a password reset link
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
            }
        };

        // Supabase uses the hash fragment to pass tokens. getSession() usually handles this for us on load.
        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                // User is ready to reset password
                // This event fires when clicking the recovery link if hash contains access_token & type=recovery
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                navigate('/minha-conta');
            }, 3000);

        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar a senha. O link pode ter expirado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4 font-sans text-gray-100">
            <div className="bg-black border border-brand-red/30 rounded-2xl shadow-[0_0_40px_rgba(220,38,38,0.15)] w-full max-w-md overflow-hidden animate-fade-in relative">
                <div className="p-8">
                    <div className="text-center mb-8 pt-4">
                        <h1 className="text-3xl font-black font-heading uppercase italic tracking-widest text-white">Nova Senha</h1>
                        <p className="text-gray-400 mt-2 font-medium">Crie uma nova senha de acesso forte e segura.</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-brand-red text-sm rounded-lg border border-red-100 font-medium">
                            {error}
                        </div>
                    )}

                    {success ? (
                        <div className="text-center">
                            <div className="mb-6 flex justify-center">
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2 font-heading uppercase tracking-wide">Senha Atualizada!</h2>
                            <p className="text-gray-400 mb-8">
                                Sua senha foi alterada com sucesso. Redirecionando para sua conta...
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold font-heading uppercase tracking-wider text-gray-300 mb-1.5">Nova Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 bg-brand-dark border border-brand-red/20 text-white rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                        placeholder="******"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold font-heading uppercase tracking-wider text-gray-300 mb-1.5">Confirmar Nova Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 bg-brand-dark border border-brand-red/20 text-white rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                        placeholder="******"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !password || !confirmPassword}
                                className="w-full py-3.5 mt-4 bg-gradient-to-r from-brand-red to-brand-orange text-white rounded-lg font-black font-heading uppercase italic tracking-widest text-lg hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Atualizar Senha'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
