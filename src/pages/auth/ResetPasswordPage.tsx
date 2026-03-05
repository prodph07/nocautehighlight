import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

export function ResetPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (error) throw error;

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Erro ao enviar email de recuperação. Verifique o endereço informado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4 font-sans text-gray-100">
            <div className="bg-black border border-brand-red/30 rounded-2xl shadow-[0_0_40px_rgba(220,38,38,0.15)] w-full max-w-md overflow-hidden animate-fade-in relative">
                <Link to="/login" className="absolute top-4 left-4 text-brand-orange hover:text-brand-red transition-colors p-2 bg-brand-dark/50 rounded-full">
                    <ArrowLeft className="w-6 h-6" />
                </Link>

                <div className="p-8">
                    <div className="text-center mb-8 pt-4">
                        <h1 className="text-3xl font-black font-heading uppercase italic tracking-widest text-white">Recuperar Senha</h1>
                        <p className="text-gray-400 mt-2 font-medium">Digite seu e-mail para receber um link de redefinição de senha.</p>
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
                            <h2 className="text-xl font-bold text-white mb-2 font-heading uppercase tracking-wide">E-mail Enviado!</h2>
                            <p className="text-gray-400 mb-8">
                                Enviamos um link de recuperação para <strong className="text-white">{email}</strong>. Por favor, verifique sua caixa de entrada e pasta de spam.
                            </p>
                            <Link
                                to="/login"
                                className="w-full py-3.5 bg-brand-dark border border-gray-700 text-white hover:text-brand-orange rounded-lg font-bold transition-colors uppercase tracking-wider text-sm flex justify-center items-center"
                            >
                                Voltar para o Login
                            </Link>
                        </div>
                    ) : (
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
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !email}
                                className="w-full py-3.5 mt-4 bg-gradient-to-r from-brand-red to-brand-orange text-white rounded-lg font-black font-heading uppercase italic tracking-widest text-lg hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Link'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
