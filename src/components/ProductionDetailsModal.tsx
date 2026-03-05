import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { type ProductionFormData } from '../types';

interface ProductionDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: ProductionFormData) => Promise<void>;
    initialData?: ProductionFormData;
}

const emptyData: ProductionFormData = {
    fighterName: '',
    age: '',
    instagram: '',
    email: '',
    roundsCount: '',
    musicLink: '',
    contact1: '',
    contact2: '',
    cornerColor: '',
    team: '',
    opponentName: '',
    notes: ''
};

export function ProductionDetailsModal({ isOpen, onClose, onSubmit, initialData }: ProductionDetailsModalProps) {
    const [formData, setFormData] = useState<ProductionFormData>(emptyData);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        if (isOpen) {
            setFormData(initialData ? { ...emptyData, ...initialData } : emptyData);
        } else {
            setFormData(emptyData); // Clear when closing to avoid flickering old data
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Erro ao enviar dados. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in font-sans">
            <div className="bg-brand-dark border border-brand-red/30 rounded-2xl shadow-[0_0_40px_rgba(220,38,38,0.2)] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative">
                <div className="flex items-center justify-between p-6 border-b border-brand-red/20 bg-black/50">
                    <div>
                        <h2 className="text-2xl font-black font-heading uppercase italic tracking-widest text-white">Detalhes da Produção</h2>
                        <p className="text-sm text-gray-400 mt-1 font-medium">
                            Preencha as informações para a edição do seu Highlight.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-brand-red hover:bg-brand-red/10 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow form-scrollbar">
                    {error && (
                        <div className="mb-6 p-4 bg-brand-red/20 text-brand-orange border border-brand-orange/30 rounded-xl text-sm font-bold">
                            {error}
                        </div>
                    )}

                    <form id="production-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold font-heading uppercase tracking-wider text-gray-300 mb-2">
                                    Nome do Lutador(a) *
                                </label>
                                <input
                                    type="text"
                                    name="fighterName"
                                    required
                                    value={formData.fighterName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-black border border-brand-red/20 text-white rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                    placeholder="Nome completo ou apelido"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold font-heading uppercase tracking-wider text-gray-300 mb-2">
                                    Idade
                                </label>
                                <input
                                    type="text"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-black border border-brand-red/20 text-white rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                    placeholder="Ex: 25"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold font-heading uppercase tracking-wider text-gray-300 mb-2">
                                    Instagram
                                </label>
                                <input
                                    type="text"
                                    name="instagram"
                                    value={formData.instagram}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-black border border-brand-red/20 text-white rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                    placeholder="@seu_perfil"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold font-heading uppercase tracking-wider text-gray-300 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-black border border-brand-red/20 text-white rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold font-heading uppercase tracking-wider text-gray-300 mb-2">
                                    Número para Contato 1 (WhatsApp) *
                                </label>
                                <input
                                    type="text"
                                    name="contact1"
                                    required
                                    value={formData.contact1}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-black border border-brand-red/20 text-white rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold font-heading uppercase tracking-wider text-gray-300 mb-2">
                                    Número para Contato 2
                                </label>
                                <input
                                    type="text"
                                    name="contact2"
                                    value={formData.contact2}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-black border border-brand-red/20 text-white rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                    placeholder="(00) 00000-0000 (Opcional)"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold font-heading uppercase tracking-wider text-gray-300 mb-2">
                                    Quantos rounds tem/teve sua luta? *
                                </label>
                                <input
                                    type="text"
                                    name="roundsCount"
                                    required
                                    value={formData.roundsCount}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-black border border-brand-red/20 text-white rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                    placeholder="Ex: 3 rounds de 5 min"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold font-heading uppercase tracking-wider text-gray-300 mb-2">
                                    Cor do Corner (Canto) *
                                </label>
                                <select
                                    name="cornerColor"
                                    required
                                    value={formData.cornerColor}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-black border border-brand-red/20 text-white rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all"
                                >
                                    <option value="" className="bg-brand-dark">Selecione...</option>
                                    <option value="Vermelho" className="bg-brand-dark">Vermelho</option>
                                    <option value="Azul" className="bg-brand-dark">Azul</option>
                                    <option value="Não sei" className="bg-brand-dark">Não sei ao certo</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold font-heading uppercase tracking-wider text-gray-300 mb-2">
                                    Sua Equipe *
                                </label>
                                <input
                                    type="text"
                                    name="team"
                                    required
                                    value={formData.team}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-black border border-brand-red/20 text-white rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                    placeholder="Nome da sua equipe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold font-heading uppercase tracking-wider text-gray-300 mb-2">
                                    Nome do Adversário (Se souber)
                                </label>
                                <input
                                    type="text"
                                    name="opponentName"
                                    value={formData.opponentName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-black border border-brand-red/20 text-white rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                    placeholder="Nome do oponente"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold font-heading uppercase tracking-wider text-gray-300 mb-2">
                                Link da Música do YouTube para o Vídeo
                            </label>
                            <input
                                type="url"
                                name="musicLink"
                                value={formData.musicLink}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-black border border-brand-red/20 text-white rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                            <p className="text-xs text-brand-orange/80 mt-1 font-medium">Insira o link da música que deseja no fundo do seu Highlight.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold font-heading uppercase tracking-wider text-gray-300 mb-2">
                                Observações Finais
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-3 bg-black border border-brand-red/20 text-white rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600 resize-none"
                                placeholder="Algo importante para a edição? Momento de nocaute, detalhe que queira focar, etc."
                            />
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-brand-red/20 flex flex-col sm:flex-row justify-end gap-3 bg-black/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 border border-gray-700 text-gray-400 rounded-xl font-bold hover:bg-gray-900 transition-colors uppercase tracking-wider text-sm"
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="production-form"
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-gradient-to-r from-brand-red to-brand-orange text-white rounded-xl font-black font-heading uppercase tracking-widest text-sm hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-2 min-w-[180px] disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            'Enviar Informações'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
