import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';

export function LoginPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password
            });

            if (error) throw error;

            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Erro ao realizar login. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4 font-sans text-gray-100">
            <div className="bg-black border border-brand-red/30 rounded-2xl shadow-[0_0_40px_rgba(220,38,38,0.15)] w-full max-w-md overflow-hidden animate-fade-in relative">
                <Link to="/" className="absolute top-4 left-4 text-brand-orange hover:text-brand-red transition-colors p-2 bg-brand-dark/50 rounded-full">
                    <ArrowLeft className="w-6 h-6" />
                </Link>

                <div className="p-8">
                    <div className="text-center mb-8 pt-4">
                        <h1 className="text-3xl font-black font-heading uppercase italic tracking-widest text-white">Bem-vindo de volta!</h1>
                        <p className="text-gray-400 mt-2 font-medium">Acesse sua conta para ver seus vídeos.</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold font-heading uppercase tracking-wider text-gray-300 mb-1.5">E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-brand-dark border border-brand-red/20 text-white rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                    placeholder="seu@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold font-heading uppercase tracking-wider text-gray-300 mb-1.5">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-brand-dark border border-brand-red/20 text-white rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                    placeholder="******"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="text-right">
                            <Link to="/reset-password" className="text-sm text-brand-orange hover:text-brand-red font-medium transition-colors">
                                Esqueceu sua senha?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 mt-2 bg-gradient-to-r from-brand-red to-brand-orange text-white rounded-lg font-black font-heading uppercase italic tracking-widest text-lg hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-400">
                        Não tem uma conta?{' '}
                        <Link to="/signup" className="text-brand-orange font-bold hover:text-brand-red transition-colors">
                            Cadastre-se
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
