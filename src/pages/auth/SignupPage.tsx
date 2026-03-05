import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, Loader2, ArrowLeft, IdCard } from 'lucide-react';
import { formatCPF, isValidCPF } from '../../utils/validators';

export function SignupPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        whatsapp: '',
        cpf: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!isValidCPF(formData.cpf)) {
            setError('CPF inválido. Por favor, verifique os números digitados.');
            setLoading(false);
            return;
        }

        try {
            // 1. Sign Up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        whatsapp: formData.whatsapp,
                        cpf: formData.cpf
                    }
                }
            });

            if (authError) throw authError;

            // 2. Insert Profile
            if (authData.user) {
                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: authData.user.id,
                    email: formData.email,
                    full_name: formData.fullName,
                    whatsapp: formData.whatsapp,
                    cpf: formData.cpf
                });

                if (profileError) {
                    console.error("Profile Error Detailed:", profileError);
                    throw new Error(`Erro no banco de dados (profiles): ${profileError.message || JSON.stringify(profileError)}`);
                }
            }

            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Erro ao criar conta.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4 font-sans text-gray-100 py-12">
            <div className="bg-black border border-brand-red/30 rounded-2xl shadow-[0_0_40px_rgba(220,38,38,0.15)] w-full max-w-md overflow-hidden animate-fade-in relative mt-8">
                <Link to="/" className="absolute top-4 left-4 text-brand-orange hover:text-brand-red transition-colors p-2 bg-brand-dark/50 rounded-full">
                    <ArrowLeft className="w-6 h-6" />
                </Link>

                <div className="p-6 sm:p-8">
                    <div className="text-center mb-8 pt-4">
                        <h1 className="text-2xl sm:text-3xl font-black font-heading uppercase italic tracking-widest text-white">Crie sua conta</h1>
                        <p className="text-gray-400 mt-2 font-medium">Rápido e fácil. Acesse o melhor da luta.</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold font-heading uppercase tracking-wider text-gray-300 mb-1.5">Nome Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-brand-dark border border-brand-red/20 text-white rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                    placeholder="Seu nome"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold font-heading uppercase tracking-wider text-gray-300 mb-1.5">WhatsApp</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                <input
                                    type="tel"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-brand-dark border border-brand-red/20 text-white rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                    placeholder="(11) 99999-9999"
                                    value={formData.whatsapp}
                                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold font-heading uppercase tracking-wider text-gray-300 mb-1.5">CPF</label>
                            <div className="relative">
                                <IdCard className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-brand-dark border border-brand-red/20 text-white rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                    placeholder="000.000.000-00"
                                    value={formData.cpf}
                                    maxLength={14}
                                    onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                                />
                            </div>
                        </div>

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
                                    minLength={6}
                                    className="w-full pl-10 pr-4 py-2.5 bg-brand-dark border border-brand-red/20 text-white rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                    placeholder="Mínimo 6 caracteres"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 mt-4 bg-gradient-to-r from-brand-red to-brand-orange text-white rounded-lg font-black font-heading uppercase italic tracking-widest text-lg hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar Conta'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-400">
                        Já tem uma conta?{' '}
                        <Link to="/login" className="text-brand-orange font-bold hover:text-brand-red transition-colors">
                            Entrar
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
