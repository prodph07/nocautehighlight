import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Video, ExternalLink, RefreshCw, Send, Plus, Search, X, ArrowUpDown, User } from 'lucide-react';

export function AdminProductionPage() {
    const [loading, setLoading] = useState(true);
    const [productions, setProductions] = useState<any[]>([]);
    const [eventsMap, setEventsMap] = useState<Record<string, string>>({});
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [deliveryUrls, setDeliveryUrls] = useState<{ [key: string]: string }>({});
    const [deliveryPhotoUrls, setDeliveryPhotoUrls] = useState<{ [key: string]: string }>({});
    const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
    const [editingDelivered, setEditingDelivered] = useState<Record<string, boolean>>({});

    // Manual Addition States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [allVideos, setAllVideos] = useState<any[]>([]);
    
    // Form fields for manual addition
    const [manualVideoId, setManualVideoId] = useState('');
    const [manualAccessLevel, setManualAccessLevel] = useState('full_access');
    const [manualQueuePosition, setManualQueuePosition] = useState('');
    const [isSubmittingManual, setIsSubmittingManual] = useState(false);
    
    // Auth State
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        loadCurrentUser();
        loadProductions();
    }, []);

    const loadCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
            setCurrentUser({ id: user.id, full_name: profile?.full_name || user.email });
        }
    };

    const loadProductions = async () => {
        setLoading(true);

        const [eventsRes, prodRes] = await Promise.all([
            supabase.from('events').select('id, title'),
            supabase
                .from('order_items')
                .select(`
                    *,
                    videos ( title, event_id, event_name ),
                    orders!inner ( 
                        id, 
                        created_at, 
                        status,
                        user_id,
                        profiles:user_id ( full_name, email, whatsapp )
                    )
                `)
                .eq('orders.status', 'paid')
                .order('id', { ascending: false })
        ]);

        if (eventsRes.data) {
            const map: Record<string, string> = {};
            eventsRes.data.forEach(e => map[e.id] = e.title);
            setEventsMap(map);
        }

        // Fetch videos for the dropdown
        const { data: videosData } = await supabase.from('videos').select('id, title, event_name').order('created_at', { ascending: false });
        if (videosData) setAllVideos(videosData);

        if (!prodRes.error && prodRes.data) {
            const sorted = prodRes.data.sort((a, b) => {
                const dateA = new Date(a.orders?.created_at || 0).getTime();
                const dateB = new Date(b.orders?.created_at || 0).getTime();
                return dateA - dateB; // ASC: Mais antigos primeiro
            });
            setProductions(sorted);

            // Pre-populate delivery URLs for items that are already delivered
            const initialUrls: Record<string, string> = {};
            const initialPhotoUrls: Record<string, string> = {};
            sorted.forEach(item => {
                if (item.delivered_video_url) {
                    initialUrls[item.id] = item.delivered_video_url;
                }
                if (item.delivered_photo_url) {
                    initialPhotoUrls[item.id] = item.delivered_photo_url;
                }
            });
            setDeliveryUrls(initialUrls);
            setDeliveryPhotoUrls(initialPhotoUrls);
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

    const handleDeliver = async (itemId: string, accessLevel: string) => {
        let url = deliveryUrls[itemId] || '';
        let photoUrl = deliveryPhotoUrls[itemId] || '';

        const needsVideo = accessLevel !== 'photo_only';
        const needsPhoto = accessLevel.includes('photo');

        if (needsVideo && !url.trim()) {
            alert('Por favor, insira o link do vídeo finalizado.');
            return;
        }

        if (needsPhoto && !photoUrl.trim()) {
            alert('Por favor, insira o link da pasta de fotos.');
            return;
        }

        if (needsVideo) {
            url = url.trim();
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = `https://${url}`;
            }
        } else {
            url = '';
        }

        if (needsPhoto) {
            photoUrl = photoUrl.trim();
            if (!photoUrl.startsWith('http://') && !photoUrl.startsWith('https://')) {
                photoUrl = `https://${photoUrl}`;
            }
        } else {
            photoUrl = '';
        }

        setUpdatingId(itemId);
        try {
            const updatePayload: any = { production_status: 'delivered' };
            if (needsVideo) updatePayload.delivered_video_url = url;
            if (needsPhoto) updatePayload.delivered_photo_url = photoUrl;

            const { error } = await supabase
                .from('order_items')
                .update(updatePayload)
                .eq('id', itemId);

            if (error) throw error;

            alert('Entregue com sucesso! O cliente já pode acessar.');
            await loadProductions(); // Reload list
        } catch (error: any) {
            console.error('Error delivering item:', error);
            alert('Erro ao entregar o pedido: ' + error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleUrlChange = (itemId: string, value: string) => {
        setDeliveryUrls(prev => ({ ...prev, [itemId]: value }));
    };

    const handlePhotoUrlChange = (itemId: string, value: string) => {
        setDeliveryPhotoUrls(prev => ({ ...prev, [itemId]: value }));
    };

    // Editor Assignment Logic
    const handleAssignEditor = async (itemId: string) => {
        if (!currentUser) return;
        setUpdatingId(itemId);
        try {
            const { error } = await supabase
                .from('order_items')
                .update({
                    editor_id: currentUser.id,
                    editor_name: currentUser.full_name
                })
                .eq('id', itemId);

            if (error) throw error;
            await loadProductions();
        } catch (error: any) {
            console.error('Erro ao assumir edição:', error);
            alert('Erro ao assumir edição: ' + error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleUnassignEditor = async (itemId: string) => {
        setUpdatingId(itemId);
        try {
            const { error } = await supabase
                .from('order_items')
                .update({
                    editor_id: null,
                    editor_name: null
                })
                .eq('id', itemId);

            if (error) throw error;
            await loadProductions();
        } catch (error: any) {
            console.error('Erro ao soltar edição:', error);
            alert('Erro ao soltar edição: ' + error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    // User Search Logic
    useEffect(() => {
        const searchUsers = async () => {
            if (!searchTerm.trim()) {
                setSearchResults([]);
                return;
            }

            setIsSearchingUsers(true);
            try {
                // Search in profiles table by email
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, email, full_name')
                    .ilike('email', `%${searchTerm.trim()}%`)
                    .limit(5);

                if (error) throw error;
                setSearchResults(data || []);
            } catch (err) {
                console.error("Erro ao buscar usuários", err);
            } finally {
                setIsSearchingUsers(false);
            }
        };

        const timeoutId = setTimeout(() => {
            if (searchTerm !== selectedUser?.email) {
                searchUsers();
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchTerm, selectedUser]);

    const handleSelectUser = (user: any) => {
        setSelectedUser(user);
        setSearchTerm(user.email);
        setSearchResults([]);
    };

    // Reorder Logic
    const handleReorder = async (originalItemId: string, orderIdToUpdate: string, currentPosition: number, totalPending: number, groupPending: any[]) => {
        const newPosStr = window.prompt(`Qual a nova posição desejada para este item? (Atual: ${currentPosition + 1} de ${totalPending})`);
        if (!newPosStr) return;
        
        const newPos = parseInt(newPosStr);
        if (isNaN(newPos) || newPos <= 0 || newPos > totalPending) {
            alert(`Posição inválida. Escolha um número entre 1 e ${totalPending}.`);
            return;
        }

        if (newPos === currentPosition + 1) return; // Same position

        try {
            setUpdatingId(originalItemId);

            let createdAtTarget = new Date().toISOString(); 
            // We are reordering WITHIN the current Event's pending queue for simplicity and predictable UI
            // The list is sorted by created_at ASC (oldest first).
            // Index 0 is the oldest (1st in queue).
            if (newPos === 1) {
                // To be first, we must be older than the current first
                const oldestDate = new Date(groupPending[0].orders.created_at);
                oldestDate.setSeconds(oldestDate.getSeconds() - 1);
                createdAtTarget = oldestDate.toISOString();
            } else if (newPos === totalPending) {
                // To be last, we just use the current date (now) or newer than the current last
                createdAtTarget = new Date().toISOString();
            } else {
                // Moving to the middle
                // Example: I want to be in position 3 (index 2).
                // I need my created_at to be between the item currently at position 2 (index 1) 
                // and the item currently at position 3 (index 2).
                const upperDate = new Date(groupPending[newPos - 2].orders.created_at);
                const lowerDate = new Date(groupPending[newPos - 1].orders.created_at);
                
                // Calculate the midpoint between the two dates
                const midTime = (upperDate.getTime() + lowerDate.getTime()) / 2;
                createdAtTarget = new Date(midTime).toISOString();
            }

            const { error: orderError } = await supabase
                .from('orders')
                .update({ created_at: createdAtTarget })
                .eq('id', orderIdToUpdate);

            if (orderError) throw orderError;

            alert('Posição atualizada com sucesso!');
            await loadProductions();
        } catch (error: any) {
            console.error('Erro ao reordenar:', error);
            alert('Erro ao mudar posição: ' + error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    // Manual Creation Logic
    const handleManualCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) {
            alert('Por favor, selecione um usuário.');
            return;
        }
        if (!manualVideoId) {
            alert('Por favor, selecione uma luta/vídeo.');
            return;
        }

        setIsSubmittingManual(true);
        try {
            // Determine the queue insertion date
            let createdAtTarget = new Date().toISOString(); 
            
            if (manualQueuePosition) {
                const pos = parseInt(manualQueuePosition);
                if (!isNaN(pos) && pos > 0) {
                    // Gather all pending across all events
                    const allPending = productions.filter(p => p.production_status !== 'delivered');
                    
                    if (pos === 1 && allPending.length > 0) {
                        // Place exactly 1 second before the oldest pending order
                        const oldestDate = new Date(allPending[0].orders.created_at);
                        oldestDate.setSeconds(oldestDate.getSeconds() - 1);
                        createdAtTarget = oldestDate.toISOString();
                    } else if (pos <= allPending.length) {
                        // Place between pos-1 and pos by taking the date of the item currently at the desired position
                        // and subtracting 1 second
                        const targetItemDate = new Date(allPending[pos - 1].orders.created_at);
                        targetItemDate.setSeconds(targetItemDate.getSeconds() - 1);
                        createdAtTarget = targetItemDate.toISOString();
                    }
                }
            }

            // Create Order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: selectedUser.id,
                    status: 'paid',
                    gateway_id: `manual_admin_${new Date().getTime()}`,
                    payment_method: 'pix', // arbitrary
                    total_amount: 0,
                    created_at: createdAtTarget
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // Create Order Item
            const { error: itemError } = await supabase
                .from('order_items')
                .insert({
                    order_id: orderData.id,
                    video_id: manualVideoId,
                    access_level: manualAccessLevel
                });

            if (itemError) {
                throw itemError;
            }

            alert('Adicionado à fila de edição manualmente!');
            setIsAddModalOpen(false);
            
            // Reset modal states
            setSelectedUser(null);
            setSearchTerm('');
            setManualVideoId('');
            setManualQueuePosition('');
            
            await loadProductions();
        } catch (error: any) {
            console.error('Erro ao adicionar manual:', error);
            alert('Erro ao criar pedido manual: ' + error.message);
        } finally {
            setIsSubmittingManual(true); // Keep modal button locked briefly
            setTimeout(() => setIsSubmittingManual(false), 500); 
        }
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

    const getAccessLevelBadge = (accessLevel: string) => {
        switch(accessLevel) {
            case 'highlight_only': return { label: 'Highlight', style: 'bg-blue-900/40 text-blue-400 border-blue-500/30' };
            case 'full_access': return { label: 'Highlight + Luta', style: 'bg-purple-900/40 text-purple-400 border-purple-500/30' };
            case 'photo_only': return { label: 'Apenas Fotos', style: 'bg-teal-900/40 text-teal-400 border-teal-500/30' };
            case 'photo_and_highlight': return { label: 'Highlight + Fotos', style: 'bg-indigo-900/40 text-indigo-400 border-indigo-500/30' };
            case 'photo_and_full_access': return { label: 'Pacote Completo', style: 'bg-pink-900/40 text-pink-400 border-pink-500/30' };
            default: return { label: 'Desconhecido', style: 'bg-gray-800 text-gray-300 border-gray-700' };
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black font-heading uppercase italic tracking-widest text-white">Fila de <span className="text-brand-orange">Produção</span></h1>
                    <p className="text-gray-400 mt-1 font-medium">Gerencie os pedidos de highlight separados por evento.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brand-red to-brand-orange text-white rounded-xl font-black font-heading uppercase tracking-widest text-sm hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all w-full sm:w-auto"
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar Manualmente
                    </button>
                    <button
                        onClick={loadProductions}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-dark border border-brand-red/20 rounded-xl text-gray-300 hover:text-white hover:border-brand-orange transition-colors font-bold uppercase tracking-wider text-sm w-full sm:w-auto"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Atualizar
                    </button>
                </div>
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
                                                <h3 className="text-lg font-black font-heading uppercase tracking-widest text-white border-l-4 border-brand-orange pl-3 mb-6">Aguardando <span className="text-brand-orange">Entrega</span></h3>
                                                <div className="space-y-6">
                                                    {group.pending.map((item, index) => {
                                                        const formData = item.production_form_data || {};
                                                        const buyerProfile = item.orders?.profiles || {};

                                                        return (
                                                            <div key={item.id} className="bg-brand-dark p-6 rounded-2xl shadow-lg border border-brand-red/20 relative overflow-hidden">
                                                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-orange/5 to-transparent rounded-bl-full pointer-events-none"></div>
                                                                
                                                                <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-3 relative z-10">
                                                                    <div className="flex-1">
                                                                        <div className="flex flex-wrap items-center gap-3">
                                                                            <span className="flex items-center justify-center bg-gradient-to-br from-brand-red to-brand-orange text-white font-black text-sm w-9 h-9 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.5)] shrink-0">
                                                                                {index + 1}º
                                                                            </span>
                                                                            <h4 className="text-lg md:text-xl font-black font-heading tracking-wider text-white uppercase break-words line-clamp-2 pr-4 flex flex-col md:flex-row md:items-center gap-2">
                                                                                <span>{formData.fighterName || 'Aguard. Form'}</span>
                                                                                <span className={`text-[10px] w-fit px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${getAccessLevelBadge(item.access_level).style}`}>
                                                                                    {getAccessLevelBadge(item.access_level).label}
                                                                                </span>
                                                                            </h4>
                                                                        </div>
                                                                        
                                                                        {/* Dados Iniciais do Comprador (Antes mesmo do formulário) */}
                                                                        <div className="mt-4 p-3 bg-black/50 border border-gray-800 rounded-lg inline-flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400">
                                                                            <p><strong className="text-gray-300">Comprador:</strong> {buyerProfile.full_name || 'Desconhecido'}</p>
                                                                            <p className="hidden md:block text-gray-700">|</p>
                                                                            <p><strong className="text-gray-300">Email:</strong> {buyerProfile.email || 'N/A'}</p>
                                                                            {buyerProfile.whatsapp && (
                                                                                <>
                                                                                    <p className="hidden md:block text-gray-700">|</p>
                                                                                    <p><strong className="text-gray-300">WhatsApp:</strong> {buyerProfile.whatsapp}</p>
                                                                                </>
                                                                            )}
                                                                        </div>

                                                                        <div className="flex flex-wrap items-center gap-2 mt-4 text-sm font-medium">
                                                                            {(!item.production_status || item.production_status === 'pending_form') ? (
                                                                                <span className="px-2.5 py-0.5 bg-brand-red/20 text-brand-orange border border-brand-orange/30 rounded-lg text-xs font-bold uppercase tracking-wider">
                                                                                    Faltam Dados
                                                                                </span>
                                                                            ) : (
                                                                                <span className="px-2.5 py-0.5 bg-blue-900/40 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold uppercase tracking-wider">
                                                                                    {item.access_level === 'photo_only' ? 'Aguardando Fotos' : 'Em Edição'}
                                                                                </span>
                                                                            )}
                                                                            {item.editor_name && (
                                                                                <span className="px-2.5 py-0.5 bg-purple-900/40 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                                                                    Editando: {item.editor_name}
                                                                                </span>
                                                                            )}
                                                                            <p className="text-gray-400 ml-2">
                                                                                Luta: <span className="text-white">{item.videos?.title}</span> <br className="sm:hidden" />
                                                                                <span className="hidden sm:inline">• </span>Pedido: <span className="text-white">#{item.order_id?.substring(0, 8).toUpperCase()}</span>
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
                                                                        <div className="text-left sm:text-right text-xs sm:text-sm text-gray-500 font-medium bg-black px-3 py-2 rounded-lg border border-gray-800 self-end w-full sm:w-auto">
                                                                            Data: <span className="text-gray-300 ml-1">
                                                                                {item.orders?.created_at ? new Date(item.orders.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                                            </span>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleReorder(item.id, item.orders.id, index, group.pending.length, group.pending)}
                                                                            disabled={updatingId === item.id}
                                                                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold uppercase tracking-wider rounded border border-gray-600 transition-colors w-full sm:w-auto"
                                                                            title="Mudar posição na fila deste evento"
                                                                        >
                                                                            {updatingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpDown className="w-3.5 h-3.5" />}
                                                                            Mudar Posição
                                                                        </button>
                                                                        {item.editor_id ? (
                                                                            item.editor_id === currentUser?.id ? (
                                                                                <button
                                                                                    onClick={() => handleUnassignEditor(item.id)}
                                                                                    disabled={updatingId === item.id}
                                                                                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 text-red-400 text-xs font-bold uppercase tracking-wider rounded border border-red-500/30 transition-colors w-full sm:w-auto"
                                                                                    title="Cancelar edição e devolver para a fila"
                                                                                >
                                                                                    {updatingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                                                                                    Soltar Luta
                                                                                </button>
                                                                            ) : null
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => handleAssignEditor(item.id)}
                                                                                disabled={updatingId === item.id || !currentUser}
                                                                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded border border-purple-500 transition-colors w-full sm:w-auto"
                                                                                title="Assumir a edição desta luta"
                                                                            >
                                                                                {updatingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <User className="w-3.5 h-3.5" />}
                                                                                Assumir Edição
                                                                            </button>
                                                                        )}
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
                                                                    {item.access_level !== 'photo_only' && (
                                                                        <div className="mb-4">
                                                                            <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
                                                                                Link do Vídeo Finalizado <span className="text-xs text-gray-500 normal-case font-normal italic">(Google Drive, Vimeo, YouTube)</span>
                                                                            </label>
                                                                            <input
                                                                                type="url"
                                                                                placeholder="https://..."
                                                                                value={deliveryUrls[item.id] || ''}
                                                                                onChange={(e) => handleUrlChange(item.id, e.target.value)}
                                                                                className="w-full px-4 py-3 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder:text-gray-600"
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    {item.access_level?.includes('photo') && (
                                                                        <div className="mb-4">
                                                                            <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
                                                                                Link da Pasta de Fotos <span className="text-xs text-gray-500 normal-case font-normal italic">(Google Drive)</span>
                                                                            </label>
                                                                            <input
                                                                                type="url"
                                                                                placeholder="https://drive.google.com/..."
                                                                                value={deliveryPhotoUrls[item.id] || ''}
                                                                                onChange={(e) => handlePhotoUrlChange(item.id, e.target.value)}
                                                                                className="w-full px-4 py-3 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-600"
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    <div className="flex justify-end">
                                                                        <button
                                                                            onClick={() => handleDeliver(item.id, item.access_level)}
                                                                            disabled={updatingId === item.id}
                                                                            className="w-full md:w-auto justify-center px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-black font-heading uppercase tracking-widest hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all flex items-center gap-3 disabled:opacity-50"
                                                                        >
                                                                            {updatingId === item.id ? (
                                                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                                            ) : (
                                                                                <Send className="w-5 h-5" />
                                                                            )}
                                                                            Entregar Pedido
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
                                                                        <h4 className="font-black font-heading tracking-widest uppercase text-white text-base flex flex-col sm:flex-row sm:items-center gap-2">
                                                                            <span>{formData.fighterName || 'Atleta'}</span>
                                                                            <span className={`text-[10px] w-fit px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${getAccessLevelBadge(item.access_level).style}`}>
                                                                                {getAccessLevelBadge(item.access_level).label}
                                                                            </span>
                                                                        </h4>
                                                                        <p className="text-sm text-gray-400 font-medium mt-1">{item.videos?.title}</p>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        <button
                                                                            onClick={() => setEditingDelivered(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                                                            className="px-4 py-2 bg-black text-gray-300 hover:text-white rounded-lg transition-colors font-bold uppercase tracking-wider text-xs border border-gray-700 hover:border-gray-500"
                                                                        >
                                                                            {isEditing ? 'Ocultar Detalhes' : 'Editar / Conferir'}
                                                                        </button>
                                                                        {item.delivered_video_url && (
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
                                                                        )}
                                                                        {item.delivered_photo_url && (
                                                                            <a
                                                                                href={item.delivered_photo_url}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="px-4 py-2 bg-blue-900/40 text-blue-400 hover:bg-blue-900/60 rounded-lg transition-colors font-bold uppercase tracking-wider text-xs flex items-center border border-blue-500/30"
                                                                                title="Ver Pasta de Fotos"
                                                                            >
                                                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                                                Fotos
                                                                            </a>
                                                                        )}
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
                                                                            {item.access_level !== 'photo_only' && (
                                                                                <div className="mb-4">
                                                                                    <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
                                                                                        Atualizar Link do Vídeo Finalizado
                                                                                    </label>
                                                                                    <input
                                                                                        type="url"
                                                                                        placeholder="https://..."
                                                                                        value={deliveryUrls[item.id] || ''}
                                                                                        onChange={(e) => handleUrlChange(item.id, e.target.value)}
                                                                                        className="w-full px-4 py-3 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-600"
                                                                                    />
                                                                                </div>
                                                                            )}

                                                                            {item.access_level?.includes('photo') && (
                                                                                <div className="mb-4">
                                                                                    <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
                                                                                        Atualizar Link da Pasta de Fotos
                                                                                    </label>
                                                                                    <input
                                                                                        type="url"
                                                                                        placeholder="https://drive.google.com/..."
                                                                                        value={deliveryPhotoUrls[item.id] || ''}
                                                                                        onChange={(e) => handlePhotoUrlChange(item.id, e.target.value)}
                                                                                        className="w-full px-4 py-3 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-600"
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                            
                                                                            <div className="flex justify-end">
                                                                                <button
                                                                                    onClick={() => handleDeliver(item.id, item.access_level)}
                                                                                    disabled={updatingId === item.id}
                                                                                    className="w-full md:w-auto justify-center px-8 py-3 bg-gradient-to-r from-blue-700 to-blue-600 text-white rounded-lg font-black font-heading uppercase tracking-widest hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all flex items-center gap-3 disabled:opacity-50"
                                                                                >
                                                                                    {updatingId === item.id ? (
                                                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                                                    ) : (
                                                                                        <Send className="w-5 h-5" />
                                                                                    )}
                                                                                    Atualizar Links
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

            {/* Modal de Inserção Manual */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#111] border border-brand-red/30 p-6 sm:p-8 rounded-2xl w-full max-w-lg relative shadow-[0_0_40px_rgba(220,38,38,0.15)] max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-3 mb-6 border-b border-brand-red/20 pb-4">
                            <Plus className="w-6 h-6 text-brand-orange" />
                            <h2 className="text-2xl font-black font-heading italic uppercase tracking-widest text-white">
                                Adicionar <span className="text-brand-orange">Edição</span>
                            </h2>
                        </div>

                        <form onSubmit={handleManualCreate} className="space-y-6">
                            {/* Buscar Usuário */}
                            <div className="relative">
                                <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">
                                    Pesquisar Cliente (Email) *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-gray-500" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            if (selectedUser && e.target.value !== selectedUser.email) {
                                                setSelectedUser(null);
                                            }
                                        }}
                                        className="pl-10 w-full bg-black border border-gray-700 text-white rounded-xl focus:ring-brand-orange focus:border-brand-orange"
                                        placeholder="Digite o email do cliente..."
                                        required
                                    />
                                    {isSearchingUsers && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <Loader2 className="h-4 w-4 text-brand-orange animate-spin" />
                                        </div>
                                    )}
                                </div>

                                {/* Resultados da Busca */}
                                {searchResults.length > 0 && !selectedUser && (
                                    <ul className="absolute z-10 mt-1 w-full bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                        {searchResults.map((user) => (
                                            <li
                                                key={user.id}
                                                className="px-4 py-3 hover:bg-brand-dark cursor-pointer border-b border-gray-800 last:border-0"
                                                onClick={() => handleSelectUser(user)}
                                            >
                                                <p className="text-white font-bold text-sm truncate">{user.full_name || 'Sem nome'}</p>
                                                <p className="text-brand-orange text-xs truncate">{user.email}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                
                                {selectedUser && (
                                    <p className="mt-2 text-xs text-green-400 font-bold uppercase flex items-center gap-1">
                                        Usuário Vinculado.
                                    </p>
                                )}
                            </div>

                            {/* Seleção de Luta */}
                            <div>
                                <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">
                                    Selecione o Vídeo / Luta *
                                </label>
                                <select
                                    value={manualVideoId}
                                    onChange={(e) => setManualVideoId(e.target.value)}
                                    className="w-full bg-black border border-gray-700 text-white rounded-xl focus:ring-brand-orange focus:border-brand-orange text-sm p-3"
                                    required
                                >
                                    <option value="" disabled>Selecione um evento...</option>
                                    {allVideos.map(video => (
                                        <option key={video.id} value={video.id}>
                                            {video.event_name} - {video.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Nível de Acesso */}
                                <div>
                                    <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">
                                        Acesso
                                    </label>
                                    <select
                                        value={manualAccessLevel}
                                        onChange={(e) => setManualAccessLevel(e.target.value)}
                                        className="w-full bg-black border border-gray-700 text-white rounded-xl focus:ring-brand-orange focus:border-brand-orange text-sm p-3"
                                    >
                                        <option value="highlight_only">Apenas Highlight</option>
                                        <option value="full_access">Highlight + Luta Íntegra</option>
                                    </select>
                                </div>

                                {/* Posicao na Fila */}
                                <div>
                                    <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">
                                        Posição Exata (Fila)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={manualQueuePosition}
                                        onChange={(e) => setManualQueuePosition(e.target.value)}
                                        className="w-full bg-black border border-gray-700 text-white rounded-xl focus:ring-brand-orange focus:border-brand-orange font-mono"
                                        placeholder="Padrão: Final da Fila"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1 uppercase">Deixe em branco para Fim. '1' força p/ Início.</p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmittingManual || !selectedUser || !manualVideoId}
                                className="w-full py-4 bg-gradient-to-r from-brand-red to-brand-orange text-white rounded-xl font-black font-heading uppercase italic tracking-widest hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all disabled:opacity-50 flex items-center justify-center mt-4"
                            >
                                {isSubmittingManual ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                                {isSubmittingManual ? 'Adicionando...' : 'Confirmar e Adicionar'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
