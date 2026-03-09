import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Video, CheckCircle, ExternalLink, RefreshCw, Send } from 'lucide-react';

export function AdminProductionPage() {
    const [loading, setLoading] = useState(true);
    const [productions, setProductions] = useState<any[]>([]);
    const [eventsMap, setEventsMap] = useState<Record<string, string>>({});
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [deliveryUrls, setDeliveryUrls] = useState<{ [key: string]: string }>({});
    const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
    const [editingDelivered, setEditingDelivered] = useState<Record<string, boolean>>({});

    useEffect(() => {
        loadProductions();
    }, []);

    const loadProductions = async () => {
        setLoading(true);

        const [eventsRes, prodRes] = await Promise.all([
            supabase.from('events').select('id, title'),
            supabase
                .from('order_items')
                .select(`
                    *,
                    videos ( title, event_id, event_name ),
                    orders!inner ( id, created_at, status )
                `)
                .eq('orders.status', 'paid')
                .order('id', { ascending: false })
        ]);

        if (eventsRes.data) {
            const map: Record<string, string> = {};
            eventsRes.data.forEach(e => map[e.id] = e.title);
            setEventsMap(map);
        }

        if (!prodRes.error && prodRes.data) {
            const sorted = prodRes.data.sort((a, b) => {
                const dateA = new Date(a.orders?.created_at || 0).getTime();
                const dateB = new Date(b.orders?.created_at || 0).getTime();
                return dateA - dateB; // ASC: Mais antigos primeiro
            });
            setProductions(sorted);

            // Pre-populate delivery URLs for items that are already delivered
            const initialUrls: Record<string, string> = {};
            sorted.forEach(item => {
                if (item.delivered_video_url) {
                    initialUrls[item.id] = item.delivered_video_url;
                }
            });
            setDeliveryUrls(initialUrls);
        } else {
            console.error("Error fetching productions:", prodRes.error);
        }
        setLoading(false);
    };

    const toggleEvent = (eventId: string) => {
        setExpandedEvents(prev => ({
            ...prev,
            [eventId]: !prev[eventId]
        }));
    };

    const handleDeliver = async (itemId: string) => {
        let url = deliveryUrls[itemId];
        if (!url || !url.trim()) {
            alert('Por favor, insira o link do vídeo finalizado.');
            return;
        }

        url = url.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = `https://${url}`;
        }

        setUpdatingId(itemId);
        try {
            const { error } = await supabase
                .from('order_items')
                .update({
                    production_status: 'delivered',
                    delivered_video_url: url
                })
                .eq('id', itemId);

            if (error) throw error;

            alert('Vídeo entregue com sucesso! O cliente já pode acessar.');
            await loadProductions(); // Reload list
        } catch (error: any) {
            console.error('Error delivering video:', error);
            alert('Erro ao entregar o vídeo: ' + error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleUrlChange = (itemId: string, value: string) => {
        setDeliveryUrls(prev => ({ ...prev, [itemId]: value }));
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    interface GroupedEvent {
        eventId: string;
        eventTitle: string;
        pending: any[];
        delivered: any[];
    }

    const groupedProductions: GroupedEvent[] = Object.values(
        productions.reduce((acc, item) => {
            const eventId = item.videos?.event_id || 'unknown';
            const eventTitle = eventsMap[eventId] || item.videos?.event_name || 'Evento Desconhecido';

            if (!acc[eventId]) {
                acc[eventId] = { eventId, eventTitle, pending: [], delivered: [] };
            }

            if (item.production_status === 'delivered') acc[eventId].delivered.push(item);
            else acc[eventId].pending.push(item);

            return acc;
        }, {} as Record<string, GroupedEvent>)
    );

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Fila de Produção</h1>
                    <p className="text-gray-500 mt-1">Gerencie os pedidos de highlight separados por evento.</p>
                </div>
                <button
                    onClick={loadProductions}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Atualizar Fila
                </button>
            </div>

            {groupedProductions.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-500">
                    Nenhum vídeo na fila de edição ou entregue no momento.
                </div>
            ) : (
                <div className="space-y-6">
                    {groupedProductions.map(group => {
                        const isExpanded = expandedEvents[group.eventId];
                        const total = group.pending.length + group.delivered.length;

                        return (
                            <div key={group.eventId} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all">
                                {/* Accordion Header */}
                                <div
                                    className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                                    onClick={() => toggleEvent(group.eventId)}
                                >
                                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                                            <Video className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{group.eventTitle}</h2>
                                            <p className="text-xs sm:text-sm text-gray-500">Total de pedidos: {total}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                        {group.pending.length > 0 && (
                                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                                                {group.pending.length} Pendentes
                                            </span>
                                        )}
                                        {group.delivered.length > 0 && (
                                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                                {group.delivered.length} Entregues
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Accordion Body */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 bg-gray-50 p-6 space-y-8">
                                        {group.pending.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800 mb-4">Aguardando Edição</h3>
                                                <div className="space-y-6">
                                                    {group.pending.map((item, index) => {
                                                        const formData = item.production_form_data || {};
                                                        return (
                                                            <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                                                <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-3">
                                                                    <div>
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="flex items-center justify-center bg-brand-orange text-white font-black text-sm w-8 h-8 rounded-full shadow-md">
                                                                                {index + 1}º
                                                                            </span>
                                                                            <h4 className="text-lg font-bold text-gray-900">
                                                                                Highlight: {formData.fighterName || 'Aguardando Formulário'}
                                                                            </h4>
                                                                        </div>
                                                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                                                            {(!item.production_status || item.production_status === 'pending_form') ? (
                                                                                <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full text-xs font-bold uppercase tracking-wider">
                                                                                    Faltam Dados
                                                                                </span>
                                                                            ) : (
                                                                                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 rounded-full text-xs font-bold uppercase tracking-wider">
                                                                                    Em Edição
                                                                                </span>
                                                                            )}
                                                                            <p className="text-sm text-gray-500">
                                                                                Luta: {item.videos?.title} <br className="sm:hidden" />
                                                                                <span className="hidden sm:inline">• </span>Pedido: {item.order_id?.substring(0, 8).toUpperCase()}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-left sm:text-right text-sm text-gray-500">
                                                                        Data do Pedido: <br className="hidden sm:inline" />
                                                                        {item.orders?.created_at ? new Date(item.orders.created_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                                    </div>
                                                                </div>

                                                                <div className="bg-gray-50 p-4 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm border border-gray-100">
                                                                    <div>
                                                                        <p className="text-gray-500 mb-1">Contato</p>
                                                                        <p className="font-medium text-gray-900">{formData.email}</p>
                                                                        <p className="font-medium text-gray-900">{formData.contact1}</p>
                                                                        {formData.instagram && <p className="text-blue-600">{formData.instagram}</p>}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-gray-500 mb-1">Dados da Luta</p>
                                                                        <p className="font-medium text-gray-900">Rounds: {formData.roundsCount}</p>
                                                                        <p className="font-medium text-gray-900">Corner: {formData.cornerColor}</p>
                                                                        <p className="font-medium text-gray-900">Equipe: {formData.team}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-gray-500 mb-1">Música</p>
                                                                        {formData.musicLink ? (
                                                                            <a href={formData.musicLink} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline flex items-center font-medium">
                                                                                Abrir Link YouTube
                                                                            </a>
                                                                        ) : (
                                                                            <span className="text-gray-400">Não informada</span>
                                                                        )}
                                                                        {formData.notes && (
                                                                            <div className="mt-2">
                                                                                <p className="text-gray-500 mb-1">Obs:</p>
                                                                                <p className="text-gray-700 bg-yellow-50 p-2 rounded border border-yellow-200">{formData.notes}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="border-t border-gray-100 pt-6">
                                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                        Link do Vídeo Finalizado (Google Drive, Vimeo, YouTube)
                                                                    </label>
                                                                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                                                        <input
                                                                            type="url"
                                                                            placeholder="https://..."
                                                                            value={deliveryUrls[item.id] || ''}
                                                                            onChange={(e) => handleUrlChange(item.id, e.target.value)}
                                                                            className="flex-grow w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                                                                        />
                                                                        <button
                                                                            onClick={() => handleDeliver(item.id)}
                                                                            disabled={updatingId === item.id || !deliveryUrls[item.id]}
                                                                            className="w-full sm:w-auto justify-center px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 shrink-0"
                                                                        >
                                                                            {updatingId === item.id ? (
                                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                            ) : (
                                                                                <Send className="w-4 h-4" />
                                                                            )}
                                                                            Entregar Edição
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {group.delivered.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                                                    Entregues Recentes ({group.eventTitle})
                                                </h3>
                                                <div className="space-y-4">
                                                    {group.delivered.map(item => {
                                                        const formData = item.production_form_data || {};
                                                        const isEditing = editingDelivered[item.id];

                                                        return (
                                                            <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm transition-all text-sm">
                                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                                                    <div>
                                                                        <h4 className="font-bold text-gray-900 text-base">{formData.fighterName || 'Atleta'}</h4>
                                                                        <p className="text-sm text-gray-500">{item.videos?.title}</p>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        <button
                                                                            onClick={() => setEditingDelivered(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                                                            className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium border border-transparent hover:border-blue-100"
                                                                        >
                                                                            {isEditing ? 'Ocultar Detalhes' : 'Editar / Conferir'}
                                                                        </button>
                                                                        <a
                                                                            href={item.delivered_video_url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors font-medium flex items-center border border-green-200"
                                                                            title="Ver Arquivo Final"
                                                                        >
                                                                            <ExternalLink className="w-4 h-4 mr-1.5" />
                                                                            Vídeo Final
                                                                        </a>
                                                                    </div>
                                                                </div>

                                                                {isEditing && (
                                                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                                                        <div className="bg-gray-50 p-4 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm border border-gray-100">
                                                                            <div>
                                                                                <p className="text-gray-500 mb-1">Contato</p>
                                                                                <p className="font-medium text-gray-900">{formData.email}</p>
                                                                                <p className="font-medium text-gray-900">{formData.contact1}</p>
                                                                                {formData.instagram && <p className="text-blue-600">{formData.instagram}</p>}
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-gray-500 mb-1">Dados da Luta</p>
                                                                                <p className="font-medium text-gray-900">Rounds: {formData.roundsCount}</p>
                                                                                <p className="font-medium text-gray-900">Corner: {formData.cornerColor}</p>
                                                                                <p className="font-medium text-gray-900">Equipe: {formData.team}</p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-gray-500 mb-1">Música</p>
                                                                                {formData.musicLink ? (
                                                                                    <a href={formData.musicLink} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline flex items-center font-medium">
                                                                                        Abrir Link YouTube
                                                                                    </a>
                                                                                ) : (
                                                                                    <span className="text-gray-400">Não informada</span>
                                                                                )}
                                                                                {formData.notes && (
                                                                                    <div className="mt-2">
                                                                                        <p className="text-gray-500 mb-1">Obs:</p>
                                                                                        <p className="text-gray-700 bg-yellow-50 p-2 rounded border border-yellow-200">{formData.notes}</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div className="pt-2">
                                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                                Atualizar Link do Vídeo Finalizado
                                                                            </label>
                                                                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                                                                <input
                                                                                    type="url"
                                                                                    placeholder="https://..."
                                                                                    value={deliveryUrls[item.id] || ''}
                                                                                    onChange={(e) => handleUrlChange(item.id, e.target.value)}
                                                                                    className="flex-grow w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-blue-50/30"
                                                                                />
                                                                                <button
                                                                                    onClick={() => handleDeliver(item.id)}
                                                                                    disabled={updatingId === item.id || !deliveryUrls[item.id]}
                                                                                    className="w-full justify-center sm:w-auto sm:justify-start px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 shrink-0"
                                                                                >
                                                                                    {updatingId === item.id ? (
                                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                                    ) : (
                                                                                        <Send className="w-4 h-4" />
                                                                                    )}
                                                                                    Atualizar Link
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
