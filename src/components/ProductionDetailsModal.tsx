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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Detalhes da Produção</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Preencha as informações para a edição do seu Highlight.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">
                            {error}
                        </div>
                    )}

                    <form id="production-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nome do Lutador(a) *
                                </label>
                                <input
                                    type="text"
                                    name="fighterName"
                                    required
                                    value={formData.fighterName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                                    placeholder="Nome completo ou apelido"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Idade
                                </label>
                                <input
                                    type="text"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                                    placeholder="Ex: 25"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Instagram
                                </label>
                                <input
                                    type="text"
                                    name="instagram"
                                    value={formData.instagram}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                                    placeholder="@seu_perfil"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Número para Contato 1 (WhatsApp) *
                                </label>
                                <input
                                    type="text"
                                    name="contact1"
                                    required
                                    value={formData.contact1}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Número para Contato 2
                                </label>
                                <input
                                    type="text"
                                    name="contact2"
                                    value={formData.contact2}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                                    placeholder="(00) 00000-0000 (Opcional)"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quantos rounds tem/teve sua luta? *
                                </label>
                                <input
                                    type="text"
                                    name="roundsCount"
                                    required
                                    value={formData.roundsCount}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                                    placeholder="Ex: 3 rounds de 5 min"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cor do Corner (Canto) *
                                </label>
                                <select
                                    name="cornerColor"
                                    required
                                    value={formData.cornerColor}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white"
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Vermelho">Vermelho</option>
                                    <option value="Azul">Azul</option>
                                    <option value="Não sei">Não sei ao certo</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sua Equipe *
                                </label>
                                <input
                                    type="text"
                                    name="team"
                                    required
                                    value={formData.team}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                                    placeholder="Nome da sua equipe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nome do Adversário (Se souber)
                                </label>
                                <input
                                    type="text"
                                    name="opponentName"
                                    value={formData.opponentName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                                    placeholder="Nome do oponente"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Link da Música do YouTube para o Vídeo
                            </label>
                            <input
                                type="url"
                                name="musicLink"
                                value={formData.musicLink}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Insira o link da música que deseja no fundo do seu Highlight.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Observações Finais
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 resize-none"
                                placeholder="Algo importante para a edição? Momento de nocaute, detalhe que queira focar, etc."
                            />
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="production-form"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 min-w-[140px]"
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
