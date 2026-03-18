import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { VideoService } from '../../services/video.service';
import { EventService } from '../../services/event.service';
import { type FightEvent, type Event } from '../../types';
import { Plus, Edit, Trash2, Loader2, ArrowLeft, Upload, FileText, CheckCircle } from 'lucide-react';
import { useOutletContext, Navigate } from 'react-router-dom';

export function AdminEventVideosPage() {
    const { isAdmin } = useOutletContext<{ isAdmin: boolean }>();

    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();

    const [videos, setVideos] = useState<FightEvent[]>([]);
    const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
    const [csvText, setCsvText] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);

    const [newVideo, setNewVideo] = useState<any>({
        title: '',
        category: 'Muay Thai',
        modality: 'Profissional',
        price_highlight: 29.90,
        price_full_bundle: 49.90,
        is_active: true,
        teaser_url: '',
        highlight_id: '',
        full_fight_id: ''
    });

    useEffect(() => {
        if (!eventId) {
            navigate('/admin/events');
            return;
        }
        loadData();
    }, [eventId, navigate]);

    const loadData = async () => {
        if (!eventId) return;
        setLoading(true);
        try {
            const [videosData, allEvents] = await Promise.all([
                VideoService.getByEventId(eventId, true), // Include inactive videos
                EventService.getAll()
            ]);

            const evt = allEvents.find(e => e.id === eventId);
            if (evt) setCurrentEvent(evt);

            // Sort videos by title or created_at if we had it. Keeping it simple.
            const sortedVideos = videosData.sort((a, b) => a.title.localeCompare(b.title));
            setVideos(sortedVideos);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveVideo = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!eventId || !currentEvent) {
                alert('Erro de contexto: Evento não encontrado.');
                return;
            }

            const slug = newVideo.title?.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

            const videoData = {
                title: newVideo.title,
                event_id: eventId,
                event_name: currentEvent.title,
                fight_date: currentEvent.fight_date || new Date().toISOString().split('T')[0],
                category: newVideo.category,
                modality: newVideo.modality,
                price_highlight: Number(newVideo.price_highlight),
                price_full_bundle: Number(newVideo.price_full_bundle),
                is_active: newVideo.is_active,
                teaser_url: newVideo.teaser_url,
                highlight_id: newVideo.highlight_id || null,
                full_fight_id: newVideo.full_fight_id || null,
                slug,
                tags: []
            };

            if (editingId) {
                const { error } = await supabase.from('videos').update(videoData).eq('id', editingId);
                if (error) throw error;
                alert('Vídeo atualizado com sucesso!');
            } else {
                const { error } = await supabase.from('videos').insert(videoData);
                if (error) throw error;
                alert('Vídeo criado com sucesso!');
            }

            closeModal();
            loadData();
        } catch (error) {
            console.error('Error saving video:', error);
            const errorMessage = (error as any).message || JSON.stringify(error);
            alert(`Erro ao salvar vídeo: ${errorMessage}`);
        }
    };

    const handleEditClick = (video: FightEvent) => {
        setNewVideo({
            title: video.title,
            category: video.category || 'Muay Thai',
            modality: video.modality || 'Profissional',
            price_highlight: video.price_highlight || 29.90,
            price_full_bundle: video.price_full_bundle || 49.90,
            is_active: video.is_active,
            teaser_url: video.teaser_url || '',
            highlight_id: (video as any).highlight_id || '',
            full_fight_id: (video as any).full_fight_id || ''
        });
        setEditingId(video.id);
        setIsModalOpen(true);
    };

    const handleDeleteVideo = async (id: string, title: string) => {
        if (!window.confirm(`Tem certeza que deseja deletar a luta "${title}"? Esta ação não pode ser desfeita.`)) return;

        try {
            const { error } = await supabase.from('videos').delete().eq('id', id);

            if (error) {
                if (error.code === '23503' || error.message.includes('foreign key constraint')) {
                    const deactivate = window.confirm(
                        `A luta "${title}" já possui pedidos vinculados (clientes já compraram) e não pode ser excluída definitivamente.\n\nPara não quebrar o histórico de compras, deseja apenas INATIVAR a luta? (Ela deixará de ser vendida)`
                    );

                    if (deactivate) {
                        const { error: updateError } = await supabase.from('videos').update({ is_active: false }).eq('id', id);
                        if (updateError) throw updateError;

                        alert('Luta inativada com sucesso!');
                        setVideos(videos.map(v => v.id === id ? { ...v, is_active: false } : v));
                    }
                    return;
                }
                throw error;
            }

            alert('Luta deletada com sucesso!');
            setVideos(videos.filter(v => v.id !== id));
        } catch (error: any) {
            console.error('Error deleting video:', error);
            alert(`Erro ao deletar luta: ${error.message}`);
        }
    };

    const handleActivateVideo = async (id: string, title: string) => {
        if (!window.confirm(`Tem certeza que deseja reativar a luta "${title}"? Ela voltará a ficar disponível para venda.`)) return;

        try {
            const { error } = await supabase.from('videos').update({ is_active: true }).eq('id', id);
            if (error) throw error;

            alert('Luta reativada com sucesso!');
            setVideos(videos.map(v => v.id === id ? { ...v, is_active: true } : v));
        } catch (error: any) {
            console.error('Error activating video:', error);
            alert(`Erro ao reativar luta: ${error.message}`);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setNewVideo({
            title: '',
            category: 'Muay Thai',
            modality: 'Profissional',
            price_highlight: 29.90,
            price_full_bundle: 49.90,
            is_active: true,
            teaser_url: '',
            highlight_id: '',
            full_fight_id: ''
        });
    };

    const processCSVData = async (text: string) => {
        if (!eventId || !currentEvent) return;
        setImporting(true);
        try {
            const rows = text.split('\n').map(row => row.trim()).filter(row => row.length > 0);
            if (rows.length < 2) {
                alert('O arquivo/texto CSV parece estar vazio ou sem dados válidos (falta cabecalho ou conteúdo).');
                setImporting(false);
                return;
            }

            const headers = rows[0].split(',').map(h => h.trim().toLowerCase());

            const titleIdx = headers.indexOf('title');
            if (titleIdx === -1) {
                alert('A coluna "title" é obrigatória no CSV.');
                setImporting(false);
                return;
            }

            const parsedVideos = rows.slice(1).map(row => {
                // Naive CSV split that works for basic string data (avoids comma-in-quotes complexity for now)
                const cols = row.split(',').map(c => c.trim());

                const title = cols[titleIdx];
                const category = headers.includes('category') && cols[headers.indexOf('category')] ? cols[headers.indexOf('category')] : 'Muay Thai';
                const price_highlight = headers.includes('price_highlight') && cols[headers.indexOf('price_highlight')] ? Number(cols[headers.indexOf('price_highlight')]) || 29.90 : 29.90;
                const price_full_bundle = headers.includes('price_full_bundle') && cols[headers.indexOf('price_full_bundle')] ? Number(cols[headers.indexOf('price_full_bundle')]) || 49.90 : 49.90;
                const teaser_url = headers.includes('teaser_url') ? cols[headers.indexOf('teaser_url')] : '';
                const highlight_id = headers.includes('highlight_id') ? cols[headers.indexOf('highlight_id')] : null;
                const full_fight_id = headers.includes('full_fight_id') ? cols[headers.indexOf('full_fight_id')] : null;

                const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

                return {
                    title,
                    event_id: eventId,
                    event_name: currentEvent.title,
                    fight_date: currentEvent.fight_date || new Date().toISOString().split('T')[0],
                    category: category,
                    modality: 'Profissional',
                    price_highlight,
                    price_full_bundle,
                    is_active: true,
                    teaser_url,
                    highlight_id,
                    full_fight_id,
                    slug,
                    tags: []
                };
            }).filter(v => !!v.title); // skip rows without a title

            if (parsedVideos.length === 0) {
                alert('Nenhuma luta válida encontrada no CSV.');
                setImporting(false);
                return;
            }

            const { error } = await supabase.from('videos').insert(parsedVideos);

            if (error) throw error;

            alert(`${parsedVideos.length} lutas importadas com sucesso!`);

            setIsPasteModalOpen(false);
            setCsvText('');
            loadData();
        } catch (error: any) {
            console.error('Error importing CSV:', error);
            alert(`Erro ao importar CSV: ${error.message}`);
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setImporting(false);
        }
    };

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        await processCSVData(text);
    };

    const handlePasteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await processCSVData(csvText);
    };

    if (!isAdmin) return <Navigate to="/admin/production" replace />;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/events')}
                        className="p-2.5 text-gray-400 bg-brand-dark hover:text-white border border-brand-red/20 hover:border-brand-orange rounded-xl transition-colors shadow-sm"
                        title="Voltar para Eventos"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black font-heading uppercase italic tracking-widest text-white">Card de <span className="text-brand-orange">Lutas</span></h1>
                        <p className="text-sm font-bold uppercase tracking-wider text-brand-red">{currentEvent ? currentEvent.title : 'Carregando...'}</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        onChange={handleImportCSV}
                        className="hidden"
                    />
                    <button
                        onClick={() => setIsPasteModalOpen(true)}
                        disabled={importing}
                        className="flex items-center px-5 py-2.5 bg-brand-dark border border-brand-red/20 text-gray-300 rounded-xl hover:text-white hover:border-brand-orange transition-colors disabled:opacity-50 font-bold uppercase tracking-wider text-xs"
                    >
                        {importing ? (
                            <Loader2 className="w-5 h-5 mr-3 animate-spin text-brand-orange" />
                        ) : (
                            <FileText className="w-5 h-5 mr-3 text-brand-orange" />
                        )}
                        Colar CSV
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importing}
                        className="flex items-center px-5 py-2.5 bg-brand-dark border border-brand-red/20 text-gray-300 rounded-xl hover:text-white hover:border-brand-orange transition-colors disabled:opacity-50 font-bold uppercase tracking-wider text-xs"
                    >
                        {importing ? (
                            <Loader2 className="w-5 h-5 mr-3 animate-spin text-brand-orange" />
                        ) : (
                            <Upload className="w-5 h-5 mr-3 text-brand-orange" />
                        )}
                        Importar CSV
                    </button>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setNewVideo({
                                title: '',
                                category: 'Muay Thai',
                                modality: 'Profissional',
                                price_highlight: 29.90,
                                price_full_bundle: 49.90,
                                is_active: true,
                                teaser_url: '',
                                highlight_id: '',
                                full_fight_id: ''
                            });
                            setIsModalOpen(true);
                        }}
                        className="flex items-center px-6 py-2.5 bg-gradient-to-r from-brand-red to-brand-orange text-white rounded-xl hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all font-black font-heading uppercase tracking-widest text-sm"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Nova Luta
                    </button>
                </div>
            </div>

            <div className="bg-black rounded-2xl shadow-[0_0_15px_rgba(220,38,38,0.1)] border border-brand-red/20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                        <tr className="bg-brand-dark border-b border-brand-red/20">
                            <th className="p-4 font-bold uppercase tracking-wider text-gray-400 text-xs">Luta</th>
                            <th className="p-4 font-bold uppercase tracking-wider text-gray-400 text-xs">Evento</th>
                            <th className="p-4 font-bold uppercase tracking-wider text-gray-400 text-xs">Modalidade</th>
                            <th className="p-4 font-bold uppercase tracking-wider text-gray-400 text-xs">Preço</th>
                            <th className="p-4 font-bold uppercase tracking-wider text-gray-400 text-xs">Status</th>
                            <th className="p-4 font-bold uppercase tracking-wider text-gray-400 text-xs text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest italic">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-orange" />
                                    Carregando vídeos...
                                </td>
                            </tr>
                        ) : videos.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest italic">Nenhum vídeo encontrado.</td>
                            </tr>
                        ) : (
                            videos.map(video => (
                                <tr key={video.id} className="border-b border-brand-red/10 hover:bg-brand-dark/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-black font-heading uppercase tracking-widest text-white">{video.title}</div>
                                        <div className="text-xs text-brand-orange font-mono mt-1 w-fit bg-brand-orange/10 px-2 py-0.5 rounded border border-brand-orange/20">ID: #{video.id.substring(0, 8)}</div>
                                    </td>
                                    <td className="p-4 text-gray-300 font-medium">{video.event_name}</td>
                                    <td className="p-4">
                                        <span className="px-3 py-1 bg-brand-dark border border-gray-700 text-gray-300 rounded-lg text-xs font-bold uppercase tracking-wider">
                                            {video.category}
                                        </span>
                                    </td>
                                    <td className="p-4 text-white font-black">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(video.price_highlight)}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${video.is_active ? 'bg-green-900/40 text-green-400 border-green-500/30' : 'bg-red-900/40 text-red-500 border-red-500/30'}`}>
                                            {video.is_active ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEditClick(video)}
                                                className="p-2 bg-black text-gray-400 hover:text-blue-400 hover:border-blue-500/50 border border-gray-700 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            {video.is_active ? (
                                                <button
                                                    onClick={() => handleDeleteVideo(video.id, video.title)}
                                                    className="p-2 bg-black text-gray-400 hover:text-red-500 hover:border-red-500/50 border border-gray-700 rounded-lg transition-colors"
                                                    title="Deletar/Inativar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleActivateVideo(video.id, video.title)}
                                                    className="p-2 bg-black text-gray-400 hover:text-green-400 hover:border-green-500/50 border border-gray-700 rounded-lg transition-colors"
                                                    title="Ativar"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-black border border-brand-red/20 shadow-[0_0_30px_rgba(220,38,38,0.2)] rounded-2xl p-8 w-full max-w-lg overflow-y-auto max-h-[90vh] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-orange/5 to-transparent rounded-bl-full pointer-events-none"></div>
                        
                        <h2 className="text-2xl font-black font-heading uppercase italic tracking-widest text-white mb-6 border-b border-brand-red/20 pb-4 relative z-10">
                            {editingId ? 'Editar Luta' : 'Adicionar Nova Luta'}
                        </h2>
                        
                        <form onSubmit={handleSaveVideo} className="space-y-5 relative z-10">
                            <div>
                                <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Título da Luta</label>
                                <input
                                    type="text"
                                    className="w-full p-3 bg-brand-dark border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                    placeholder="Ex: Fulano vs Ciclano"
                                    value={newVideo.title}
                                    onChange={e => setNewVideo({ ...newVideo, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Preço (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full p-3 bg-brand-dark border border-gray-700 rounded-xl text-white font-bold focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all"
                                        value={newVideo.price_highlight}
                                        onChange={e => setNewVideo({ ...newVideo, price_highlight: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Categoria/Modalidade</label>
                                    <select
                                        className="w-full p-3 bg-brand-dark border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all"
                                        value={newVideo.category}
                                        onChange={e => setNewVideo({ ...newVideo, category: e.target.value })}
                                    >
                                        <option value="Muay Thai">Muay Thai</option>
                                        <option value="Kickboxing">Kickboxing</option>
                                        <option value="Boxe">Boxe</option>
                                        <option value="MMA">MMA</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">URL da Imagem (Thumbnail)</label>
                                <input
                                    type="url"
                                    className="w-full p-3 bg-brand-dark border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                    placeholder="https://..."
                                    value={newVideo.teaser_url}
                                    onChange={e => setNewVideo({ ...newVideo, teaser_url: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">ID Drive (Highlight)</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 bg-brand-dark border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                        placeholder="Ex: 1s2f3g..."
                                        value={newVideo.highlight_id}
                                        onChange={e => setNewVideo({ ...newVideo, highlight_id: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">ID Drive (Luta Completa)</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 bg-brand-dark border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                        placeholder="Ex: 4h5j6k..."
                                        value={newVideo.full_fight_id}
                                        onChange={e => setNewVideo({ ...newVideo, full_fight_id: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-brand-red/20">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-6 py-2.5 bg-black text-gray-400 border border-gray-800 hover:text-white hover:border-gray-500 rounded-xl font-bold uppercase tracking-wider text-sm transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-gradient-to-r from-brand-red to-brand-orange text-white rounded-xl font-black font-heading uppercase tracking-widest text-sm hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all"
                                >
                                    Salvar Luta
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isPasteModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-black border border-brand-red/20 shadow-[0_0_30px_rgba(220,38,38,0.2)] rounded-2xl p-8 w-full max-w-2xl overflow-y-auto max-h-[90vh] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-orange/5 to-transparent rounded-bl-full pointer-events-none"></div>

                        <h2 className="text-2xl font-black font-heading uppercase italic tracking-widest text-white mb-2 relative z-10">Colar Dados CSV</h2>
                        <p className="text-sm font-medium text-gray-400 mb-6 italic border-b border-brand-red/20 pb-4 relative z-10">
                            * Cole o conteúdo do CSV (com cabeçalhos na primeira linha) na caixa de texto abaixo. Apenas a coluna <code className="bg-brand-orange/10 text-brand-orange px-1.5 py-0.5 rounded border border-brand-orange/20">title</code> é obrigatória.
                        </p>
                        
                        <form onSubmit={handlePasteSubmit} className="space-y-4 relative z-10">
                            <textarea
                                className="w-full h-64 p-4 bg-brand-dark border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all font-mono text-sm placeholder:text-gray-600"
                                placeholder="title, category, price_highlight&#10;Luta 1, Muay Thai, 29.90&#10;Luta 2, Boxe, 39.90"
                                value={csvText}
                                onChange={(e) => setCsvText(e.target.value)}
                                required
                            />

                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-brand-red/20">
                                <button
                                    type="button"
                                    onClick={() => setIsPasteModalOpen(false)}
                                    className="px-6 py-2.5 bg-black text-gray-400 border border-gray-800 hover:text-white hover:border-gray-500 rounded-xl font-bold uppercase tracking-wider text-sm transition-colors"
                                    disabled={importing}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-gradient-to-r from-brand-red to-brand-orange text-white rounded-xl font-black font-heading uppercase tracking-widest text-sm hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    disabled={importing}
                                >
                                    {importing && <Loader2 className="w-5 h-5 animate-spin" />}
                                    Importar Dados
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
