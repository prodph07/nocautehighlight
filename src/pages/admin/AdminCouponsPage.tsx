import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Ticket, Plus, Search, Check, X, ShieldAlert, Loader2 } from 'lucide-react';

export function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form states
    const [code, setCode] = useState('');
    const [discountPercentage, setDiscountPercentage] = useState('');
    const [maxUses, setMaxUses] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCoupons(data || []);
        } catch (error: any) {
            console.error('Error fetching coupons:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            if (!code || !discountPercentage) {
                throw new Error('Código e porcentagem de desconto são obrigatórios.');
            }

            const parsedDiscount = parseFloat(discountPercentage);
            if (isNaN(parsedDiscount) || parsedDiscount < 0 || parsedDiscount > 100) {
                throw new Error('A porcentagem de desconto deve ser entre 0 e 100.');
            }

            let parsedMaxUses = null;
            if (maxUses) {
                parsedMaxUses = parseInt(maxUses);
                if (isNaN(parsedMaxUses) || parsedMaxUses <= 0) {
                    throw new Error('O limite de usos deve ser um número maior que zero.');
                }
            }

            const { error: insertError } = await supabase
                .from('coupons')
                .insert({
                    code: code.toUpperCase().trim(),
                    discount_percentage: parsedDiscount,
                    max_uses: parsedMaxUses
                });

            if (insertError) {
                if (insertError.code === '23505') { // Unique violation
                    throw new Error('Este código de cupom já existe.');
                }
                throw insertError;
            }

            // Reset form
            setCode('');
            setDiscountPercentage('');
            setMaxUses('');
            
            // Refresh list
            await fetchCoupons();
            
        } catch (err: any) {
            console.error('Error creating coupon:', err);
            setError(err.message || 'Erro ao criar cupom.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleCouponStatus = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('coupons')
                .update({ active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            
            setCoupons(coupons.map(c => 
                c.id === id ? { ...c, active: !currentStatus } : c
            ));
        } catch (error) {
            console.error('Error toggling coupon status:', error);
            alert('Erro ao alterar status do cupom.');
        }
    };

    const filteredCoupons = coupons.filter(c => 
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black font-heading uppercase italic tracking-widest text-white">
                        Gerenciar <span className="text-brand-orange">Cupons</span>
                    </h2>
                    <p className="text-gray-400 mt-1">Crie e gerencie códigos de desconto para seus clientes.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Column */}
                <div className="lg:col-span-1">
                    <div className="bg-black p-6 rounded-2xl shadow-lg border border-brand-red/20 sticky top-24">
                        <h3 className="text-xl font-black font-heading uppercase italic tracking-widest text-white mb-6 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-brand-orange" />
                            Novo Cupom
                        </h3>

                        {error && (
                            <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-start gap-3 text-red-400 text-sm">
                                <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleCreateCoupon} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">
                                    Código do Cupom
                                </label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    className="w-full bg-brand-dark border-gray-700 text-white rounded-xl focus:ring-brand-orange focus:border-brand-orange font-mono uppercase"
                                    placeholder="EX: 99FREE"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">
                                    Desconto (%)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={discountPercentage}
                                    onChange={(e) => setDiscountPercentage(e.target.value)}
                                    className="w-full bg-brand-dark border-gray-700 text-white rounded-xl focus:ring-brand-orange focus:border-brand-orange font-mono"
                                    placeholder="Ex: 50 ou 100"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">
                                    Limite de Usos (Opcional)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={maxUses}
                                    onChange={(e) => setMaxUses(e.target.value)}
                                    className="w-full bg-brand-dark border-gray-700 text-white rounded-xl focus:ring-brand-orange focus:border-brand-orange font-mono"
                                    placeholder="Deixe em branco para ilimitado"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-gradient-to-r from-brand-red to-brand-orange text-white rounded-xl font-black font-heading uppercase italic tracking-widest hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all mt-6"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Criando...
                                    </>
                                ) : (
                                    'Criar Cupom'
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* List Column */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-black p-4 rounded-xl border border-brand-red/20 shadow-lg flex items-center gap-3">
                        <Search className="w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar cupons pelo código..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none text-white focus:ring-0 w-full placeholder-gray-500 font-mono"
                        />
                    </div>

                    <div className="bg-black rounded-2xl shadow-lg border border-brand-red/20 overflow-hidden">
                        {loading ? (
                            <div className="flex justify-center items-center p-12">
                                <Loader2 className="animate-spin h-8 w-8 text-brand-orange" />
                            </div>
                        ) : filteredCoupons.length === 0 ? (
                            <div className="text-center p-12">
                                <Ticket className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                                <h3 className="text-lg font-bold text-gray-300 mb-2 font-heading uppercase italic">Nenhum cupom encontrado</h3>
                                <p className="text-gray-500">
                                    {searchTerm ? 'Nenhum resultado para a sua busca.' : 'Você ainda não criou nenhum cupom de desconto.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-brand-dark/50 text-gray-400 font-heading uppercase tracking-wider text-xs border-b border-brand-red/20">
                                        <tr>
                                            <th className="px-6 py-4">Código / Desconto</th>
                                            <th className="px-6 py-4">Usos</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-red/10">
                                        {filteredCoupons.map((coupon) => (
                                            <tr key={coupon.id} className="hover:bg-brand-dark/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-brand-dark rounded-lg border border-brand-red/20">
                                                            <Ticket className="w-4 h-4 text-brand-orange" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white font-mono uppercase text-base">{coupon.code}</p>
                                                            <p className="text-xs text-brand-orange font-bold uppercase tracking-wider mt-0.5">
                                                                {coupon.discount_percentage}% OFF
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-gray-300">{coupon.current_uses}</span>
                                                        <span className="text-gray-500">/</span>
                                                        <span className="font-mono text-gray-400">
                                                            {coupon.max_uses ? coupon.max_uses : '∞'}
                                                        </span>
                                                    </div>
                                                    {coupon.max_uses && coupon.current_uses >= coupon.max_uses && (
                                                        <span className="text-[10px] text-red-400 uppercase font-bold tracking-wider mt-1 block">
                                                            Esgotado
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                                                        coupon.active 
                                                            ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                    }`}>
                                                        {coupon.active ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => toggleCouponStatus(coupon.id, coupon.active)}
                                                        className={`p-2 rounded-lg transition-colors border ${
                                                            coupon.active
                                                                ? 'text-red-400 hover:bg-red-500/10 border-transparent hover:border-red-500/30'
                                                                : 'text-green-400 hover:bg-green-500/10 border-transparent hover:border-green-500/30'
                                                        }`}
                                                        title={coupon.active ? "Desativar cupom" : "Ativar cupom"}
                                                    >
                                                        {coupon.active ? <X className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
