import { useState, useEffect } from 'react';
import { SettingsService } from '../../services/settings.service';
import type { AppSettings } from '../../services/settings.service';
import { Save, Loader2, DollarSign } from 'lucide-react';

export function AdminSettingsPage() {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
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
        const success = await SettingsService.updateSettings({
            full_fight_upsell_price: Number(settings.full_fight_upsell_price)
        });

        if (success) {
            setMessage('Configurações salvas com sucesso!');
        } else {
            setMessage('Erro ao salvar as configurações.');
        }
        setSaving(false);
    };

    if (loading || !settings) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Configurações Globais</h1>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center ${message.includes('sucesso') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Vendas & Checkout</h2>

                    <div className="mb-6 max-w-md">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Preço Adicional da Luta na Íntegra (Upsell)
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                            Este é o valor extra cobrado no checkout quando o cliente opta por adicionar o vídeo completo da luta à sua compra de Highlight.
                        </p>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <DollarSign className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                className="pl-10 w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                value={settings.full_fight_upsell_price}
                                onChange={(e) => setSettings({ ...settings, full_fight_upsell_price: Number(e.target.value) })}
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5 mr-2" />
                            )}
                            Salvar Configurações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
