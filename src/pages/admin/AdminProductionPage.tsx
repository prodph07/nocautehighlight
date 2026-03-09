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
                    <h1 className="text-3xl font-black font-heading uppercase italic tracking-widest text-white">Fila de <span className="text-brand-orange">Produção</span></h1>
                    <p className="text-gray-400 mt-1 font-medium">Gerencie os pedidos de highlight separados por evento.</p>
                </div>
                <button
                    onClick={loadProductions}
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-dark border border-brand-red/20 rounded-xl text-gray-300 hover:text-white hover:border-brand-orange transition-colors font-bold uppercase tracking-wider text-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                    Atualizar Fila
                </button>
            </div>

            {groupedProductions.length === 0 ? (
                <div className="bg-black p-8 rounded-2xl border border-brand-red/20 text-center text-gray-500 font-bold uppercase tracking-widest italic flex items-center justify-center min-h-[200px] shadow-lg">
                    Nenhum vídeo na fila de edição ou entregue no momento.
                </div>
            ) : (
                <div className="space-y-6">
                    {groupedProductions.map(group => {
                        const isExpanded = expandedEvents[group.eventId];
                        const total = group.pending.length + group.delivered.length;

                        return (
                            <div key={group.eventId} className="bg-black rounded-2xl border border-brand-red/20 shadow-lg overflow-hidden transition-all group-hover:border-brand-orange/50">
                                {/* Accordion Header */}
                                <div
                                    className="p-4 sm:p-6 cursor-pointer hover:bg-brand-dark/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors"
                                    onClick={() => toggleEvent(group.eventId)}
                                >
                                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                                        <div className="p-3 bg-brand-dark border border-brand-red/20 text-brand-orange rounded-xl shrink-0">
                                            <Video className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="text-lg sm:text-xl font-black font-heading tracking-widest text-white uppercase truncate">{group.eventTitle}</h2>
                                            <p className="text-xs sm:text-sm text-gray-400 font-medium mt-1">Total de pedidos: <span className="text-white font-bold">{total}</span></p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                        {group.pending.length > 0 && (
                                            <span className="px-3 py-1 bg-yellow-900/40 border border-yellow-500/30 text-yellow-400 rounded-lg text-xs font-bold uppercase tracking-wider">
                                                {group.pending.length} Pendentes
                                            </span>
                                        )}
                                        {group.delivered.length > 0 && (
                                            <span className="px-3 py-1 bg-green-900/40 border border-green-500/30 text-green-400 rounded-lg text-xs font-bold uppercase tracking-wider">
                                                {group.delivered.length} Entregues
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Accordion Body */}
                                {isExpanded && (
                                    <div className="border-t border-brand-red/20 bg-brand-dark/30 p-6 space-y-8">
                                        {group.pending.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-black font-heading uppercase tracking-widest text-white border-l-4 border-brand-orange pl-3 mb-6">Aguardando <span className="text-brand-orange">Edição</span></h3>
                                                <div className="space-y-6">
                                                    {group.pending.map((item, index) => {
                                                        const formData = item.production_form_data || {};
                                                        return (
                                                            <div key={item.id} className="bg-brand-dark p-6 rounded-2xl shadow-lg border border-brand-red/20 relative overflow-hidden">
                                                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-orange/5 to-transparent rounded-bl-full pointer-events-none"></div>
                                                                
                                                                <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-3 relative z-10">
                                                                    <div>
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="flex items-center justify-center bg-gradient-to-br from-brand-red to-brand-orange text-white font-black text-sm w-8 h-8 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                                                                                {index + 1}º
                                                                            </span>
                                                                            <h4 className="text-lg font-black font-heading tracking-wider text-white uppercase">
                                                                                Highlight: <span className="text-brand-orange">{formData.fighterName || 'Aguardando Formulário'}</span>
                                                                            </h4>
                                                                        </div>
                                                                        <div className="flex flex-wrap items-center gap-2 mt-3">
                                                                            {(!item.production_status || item.production_status === 'pending_form') ? (
                                                                                <span className="px-2.5 py-0.5 bg-brand-red/20 text-brand-orange border border-brand-orange/30 rounded-lg text-xs font-bold uppercase tracking-wider">
                                                                                    Faltam Dados
                                                                                </span>
                                                                            ) : (
                                                                                <span className="px-2.5 py-0.5 bg-blue-900/40 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold uppercase tracking-wider">
                                                                                    Em Edição
                                                                                </span>
                                                                            )}
                                                                            <p className="text-sm text-gray-400 font-medium">
                                                                                Luta: <span className="text-white">{item.videos?.title}</span> <br className="sm:hidden" />
                                                                                <span className="hidden sm:inline">• </span>Pedido: <span className="text-white">#{item.order_id?.substring(0, 8).toUpperCase()}</span>
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-left sm:text-right text-sm text-gray-500 font-medium">
                                                                        Data do Pedido: <br className="hidden sm:inline" />
                                                                        <span className="text-gray-300 bg-black px-2 py-1 rounded-md border border-gray-800">
                                                                            {item.orders?.created_at ? new Date(item.orders.created_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="bg-black p-5 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm border border-brand-red/10 relative z-10">
                                                                    <div>
                                                                        <p className="text-gray-500 mb-1 font-bold uppercase tracking-wider text-xs">Contato</p>
                                                                        <p className="font-medium text-gray-200">{formData.email}</p>
                                                                        <p className="font-medium text-gray-200">{formData.contact1}</p>
                                                                        {formData.instagram && <p className="text-blue-400">{formData.instagram}</p>}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-gray-500 mb-1 font-bold uppercase tracking-wider text-xs">Dados da Luta</p>
                                                                        <p className="font-bold text-gray-200 uppercase tracking-widest font-heading">Rounds: <span className="text-brand-orange">{formData.roundsCount}</span></p>
                                                                        <p className="font-bold text-gray-200 uppercase tracking-widest font-heading">Corner: <span className="text-brand-orange">{formData.cornerColor}</span></p>
                                                                        <p className="font-bold text-gray-200 uppercase tracking-widest font-heading">Equipe: <span className="text-brand-orange">{formData.team}</span></p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-gray-500 mb-1 font-bold uppercase tracking-wider text-xs">Música</p>
                                                                        {formData.musicLink ? (
                                                                            <a href={formData.musicLink} target="_blank" rel="noopener noreferrer" className="text-brand-red hover:text-brand-orange flex items-center font-bold tracking-wide transition-colors">
                                                                                Abrir Link YouTube
                                                                            </a>
                                                                        ) : (
                                                                            <span className="text-gray-600 block italic">Não informada</span>
                                                                        )}
                                                                        {formData.notes && (
                                                                            <div className="mt-3">
                                                                                <p className="text-gray-500 mb-1 font-bold uppercase tracking-wider text-xs">Observações do Atleta:</p>
                                                                                <p className="text-yellow-400 bg-yellow-900/20 p-3 rounded-lg border border-yellow-500/20 italic">{formData.notes}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="border-t border-brand-red/20 pt-6 relative z-10">
                                                                    <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
                                                                        Link do Vídeo Finalizado <span className="text-xs text-gray-500 normal-case font-normal italic">(Google Drive, Vimeo, YouTube)</span>
                                                                    </label>
                                                                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                                                        <input
                                                                            type="url"
                                                                            placeholder="https://..."
                                                                            value={deliveryUrls[item.id] || ''}
                                                                            onChange={(e) => handleUrlChange(item.id, e.target.value)}
                                                                            className="flex-grow w-full px-4 py-3 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder:text-gray-600"
                                                                        />
                                                                        <button
                                                                            onClick={() => handleDeliver(item.id)}
                                                                            disabled={updatingId === item.id || !deliveryUrls[item.id]}
                                                                            className="w-full justify-center px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-black font-heading uppercase tracking-widest hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all flex items-center gap-3 disabled:opacity-50 shrink-0 md:w-auto"
                                                                        >
                                                                            {updatingId === item.id ? (
                                                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                                            ) : (
                                                                                <Send className="w-5 h-5" />
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
                                            <div className="pt-4">
                                                <h3 className="text-lg font-black font-heading uppercase tracking-widest text-white border-l-4 border-green-500 pl-3 mb-6 flex items-center">
                                                    Entregues <span className="text-green-500 ml-2">Recentes</span>
                                                </h3>
                                                <div className="space-y-4">
                                                    {group.delivered.map(item => {
                                                        const formData = item.production_form_data || {};
                                                        const isEditing = editingDelivered[item.id];

                                                        return (
                                                            <div key={item.id} className="bg-brand-dark p-5 rounded-2xl border border-green-500/20 shadow-sm transition-all text-sm">
                                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                                                    <div>
                                                                        <h4 className="font-black font-heading tracking-widest uppercase text-white text-base">{formData.fighterName || 'Atleta'}</h4>
                                                                        <p className="text-sm text-gray-400 font-medium">{item.videos?.title}</p>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        <button
                                                                            onClick={() => setEditingDelivered(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                                                            className="px-4 py-2 bg-black text-gray-300 hover:text-white rounded-lg transition-colors font-bold uppercase tracking-wider text-xs border border-gray-700 hover:border-gray-500"
                                                                        >
                                                                            {isEditing ? 'Ocultar Detalhes' : 'Editar / Conferir'}
                                                                        </button>
                                                                        <a
                                                                            href={item.delivered_video_url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="px-4 py-2 bg-green-900/40 text-green-400 hover:bg-green-900/60 rounded-lg transition-colors font-bold uppercase tracking-wider text-xs flex items-center border border-green-500/30"
                                                                            title="Ver Arquivo Final"
                                                                        >
                                                                            <ExternalLink className="w-4 h-4 mr-2" />
                                                                            Vídeo Final
                                                                        </a>
                                                                    </div>
                                                                </div>

                                                                {isEditing && (
                                                                    <div className="mt-6 pt-6 border-t border-brand-red/20">
                                                                        <div className="bg-black p-5 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm border border-brand-red/10">
                                                                            <div>
                                                                                <p className="text-gray-500 mb-1 font-bold uppercase tracking-wider text-xs">Contato</p>
                                                                                <p className="font-medium text-gray-200">{formData.email}</p>
                                                                                <p className="font-medium text-gray-200">{formData.contact1}</p>
                                                                                {formData.instagram && <p className="text-blue-400">{formData.instagram}</p>}
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-gray-500 mb-1 font-bold uppercase tracking-wider text-xs">Dados da Luta</p>
                                                                                <p className="font-bold text-gray-200 uppercase tracking-widest font-heading">Rounds: <span className="text-brand-orange">{formData.roundsCount}</span></p>
                                                                                <p className="font-bold text-gray-200 uppercase tracking-widest font-heading">Corner: <span className="text-brand-orange">{formData.cornerColor}</span></p>
                                                                                <p className="font-bold text-gray-200 uppercase tracking-widest font-heading">Equipe: <span className="text-brand-orange">{formData.team}</span></p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-gray-500 mb-1 font-bold uppercase tracking-wider text-xs">Música</p>
                                                                                {formData.musicLink ? (
                                                                                    <a href={formData.musicLink} target="_blank" rel="noopener noreferrer" className="text-brand-red hover:text-brand-orange flex items-center font-bold tracking-wide transition-colors">
                                                                                        Abrir Link YouTube
                                                                                    </a>
                                                                                ) : (
                                                                                    <span className="text-gray-600 block italic">Não informada</span>
                                                                                )}
                                                                                {formData.notes && (
                                                                                    <div className="mt-3">
                                                                                        <p className="text-gray-500 mb-1 font-bold uppercase tracking-wider text-xs">Observações do Atleta:</p>
                                                                                        <p className="text-yellow-400 bg-yellow-900/20 p-3 rounded-lg border border-yellow-500/20 italic">{formData.notes}</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div className="pt-2">
                                                                            <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
                                                                                Atualizar Link do Vídeo Finalizado
                                                                            </label>
                                                                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                                                                <input
                                                                                    type="url"
                                                                                    placeholder="https://..."
                                                                                    value={deliveryUrls[item.id] || ''}
                                                                                    onChange={(e) => handleUrlChange(item.id, e.target.value)}
                                                                                    className="flex-grow w-full px-4 py-3 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-600"
                                                                                />
                                                                                <button
                                                                                    onClick={() => handleDeliver(item.id)}
                                                                                    disabled={updatingId === item.id || !deliveryUrls[item.id]}
                                                                                    className="w-full justify-center px-8 py-3 bg-gradient-to-r from-blue-700 to-blue-600 text-white rounded-lg font-black font-heading uppercase tracking-widest hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all flex items-center gap-3 disabled:opacity-50 shrink-0 md:w-auto"
                                                                                >
                                                                                    {updatingId === item.id ? (
                                                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                                                    ) : (
                                                                                        <Send className="w-5 h-5" />
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
