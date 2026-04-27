import { useState, useEffect } from 'react';
import { SettingsService } from '../../services/settings.service';
import type { AppSettings } from '../../services/settings.service';
import { Save, Loader2, DollarSign } from 'lucide-react';
import { useOutletContext, Navigate } from 'react-router-dom';

export function AdminSettingsPage() {
    const { isAdmin } = useOutletContext<{ isAdmin: boolean }>();
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        setLoading(true);
        const data = await SettingsService.getSettings();
        setSettings(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        if (!settings) return;

        setSaving(true);
        const result = await SettingsService.updateSettings({
            full_fight_upsell_price: Number(settings.full_fight_upsell_price),
            photo_only_price: Number(settings.photo_only_price),
            photo_and_highlight_promo_price: Number(settings.photo_and_highlight_promo_price)
        });

        if (result.success) {
            setMessage('Configurações salvas com sucesso!');
        } else {
            setMessage(`Erro ao salvar as configurações: ${result.error}`);
        }
        setSaving(false);
    };

    if (!isAdmin) return <Navigate to="/admin/production" replace />;

    if (loading || !settings) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black font-heading uppercase italic tracking-widest text-white">Configurações <span className="text-brand-orange">Globais</span></h1>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center font-bold tracking-wide uppercase text-sm border shadow-lg ${message.includes('sucesso') ? 'bg-green-900/40 text-green-400 border-green-500/30' : 'bg-red-900/40 text-red-400 border-red-500/30'}`}>
                    {message}
                </div>
            )}

            <div className="bg-black rounded-2xl shadow-[0_0_15px_rgba(220,38,38,0.1)] border border-brand-red/20 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-lg font-black font-heading tracking-widest uppercase text-white mb-6 border-b border-brand-red/20 pb-4">
                        Vendas & <span className="text-brand-orange">Checkout</span>
                    </h2>

                    <div className="mb-8 max-w-md">
                        <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">
                            Preço Adicional da Luta na Íntegra (Upsell)
                        </label>
                        <p className="text-xs text-brand-red font-medium mb-4 italic">
                            * Este é o valor extra cobrado no checkout quando o cliente opta por adicionar o vídeo completo da luta à sua compra de Highlight.
                        </p>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <DollarSign className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                className="pl-12 w-full p-3.5 bg-brand-dark border border-gray-700 text-white font-bold rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600 shadow-inner"
                                value={settings.full_fight_upsell_price}
                                onChange={(e) => setSettings({ ...settings, full_fight_upsell_price: Number(e.target.value) })}
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-8 max-w-md">
                        <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">
                            Preço Somente da Foto
                        </label>
                        <p className="text-xs text-brand-red font-medium mb-4 italic">
                            * Preço base para quem deseja comprar apenas o álbum de fotos do evento.
                        </p>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <DollarSign className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                className="pl-12 w-full p-3.5 bg-brand-dark border border-gray-700 text-white font-bold rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600 shadow-inner"
                                value={settings.photo_only_price || 0}
                                onChange={(e) => setSettings({ ...settings, photo_only_price: Number(e.target.value) })}
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-8 max-w-md">
                        <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">
                            Preço Promocional (Foto + Highlight)
                        </label>
                        <p className="text-xs text-brand-red font-medium mb-4 italic">
                            * Preço especial para quem compra o Highlight da Luta + Fotos do evento (não inclui Íntegra).
                        </p>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <DollarSign className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                className="pl-12 w-full p-3.5 bg-brand-dark border border-gray-700 text-white font-bold rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600 shadow-inner"
                                value={settings.photo_and_highlight_promo_price || 0}
                                onChange={(e) => setSettings({ ...settings, photo_and_highlight_promo_price: Number(e.target.value) })}
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-brand-red/20 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full sm:w-auto flex items-center justify-center px-8 py-3 bg-gradient-to-r from-brand-red to-brand-orange text-white font-black font-heading uppercase tracking-widest rounded-xl hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5 mr-3" />
                            )}
                            Salvar Configurações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
