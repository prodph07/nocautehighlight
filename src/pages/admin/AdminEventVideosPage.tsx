import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { VideoService } from '../../services/video.service';
import { EventService } from '../../services/event.service';
import { type FightEvent, type Event } from '../../types';
import { Plus, Edit, Trash2, Loader2, ArrowLeft, Upload, FileText, CheckCircle } from 'lucide-react';

export function AdminEventVideosPage() {
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

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/events')}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Voltar para Eventos"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Card de Lutas</h1>
                        <p className="text-sm text-gray-500">{currentEvent ? currentEvent.title : 'Carregando...'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
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
                        className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
                    >
                        {importing ? (
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                            <FileText className="w-5 h-5 mr-2" />
                        )}
                        Colar CSV
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importing}
                        className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
                    >
                        {importing ? (
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                            <Upload className="w-5 h-5 mr-2" />
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
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Nova Luta
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="p-4 font-semibold text-gray-600 text-sm">Luta</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Evento</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Modalidade</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Preço</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                    Carregando vídeos...
                                </td>
                            </tr>
                        ) : videos.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500">Nenhum vídeo encontrado.</td>
                            </tr>
                        ) : (
                            videos.map(video => (
                                <tr key={video.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900">{video.title}</div>
                                        <div className="text-xs text-gray-400">ID: {video.id.substring(0, 8)}...</div>
                                    </td>
                                    <td className="p-4 text-gray-600">{video.event_name}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs px-2">
                                            {video.category}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-900 font-medium">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(video.price_highlight)}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${video.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {video.is_active ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEditClick(video)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            {video.is_active ? (
                                                <button
                                                    onClick={() => handleDeleteVideo(video.id, video.title)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Deletar/Inativar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleActivateVideo(video.id, video.title)}
                                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
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

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg overflow-y-auto max-h-[90vh]">
                        <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar Luta' : 'Adicionar Nova Luta'}</h2>
                        <form onSubmit={handleSaveVideo} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Título da Luta</label>
                                <input
                                    type="text"
                                    className="w-full mt-1 p-2 border rounded-lg"
                                    placeholder="Ex: Fulano vs Ciclano"
                                    value={newVideo.title}
                                    onChange={e => setNewVideo({ ...newVideo, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Preço (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full mt-1 p-2 border rounded-lg"
                                        value={newVideo.price_highlight}
                                        onChange={e => setNewVideo({ ...newVideo, price_highlight: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Categoria/Modalidade</label>
                                    <select
                                        className="w-full mt-1 p-2 border rounded-lg"
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
                                <label className="block text-sm font-medium text-gray-700">URL da Imagem (Thumbnail)</label>
                                <input
                                    type="url"
                                    className="w-full mt-1 p-2 border rounded-lg"
                                    placeholder="https://..."
                                    value={newVideo.teaser_url}
                                    onChange={e => setNewVideo({ ...newVideo, teaser_url: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">ID Drive (Highlight)</label>
                                    <input
                                        type="text"
                                        className="w-full mt-1 p-2 border rounded-lg"
                                        placeholder="Ex: 1s2f3g..."
                                        value={newVideo.highlight_id}
                                        onChange={e => setNewVideo({ ...newVideo, highlight_id: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">ID Drive (Luta Completa)</label>
                                    <input
                                        type="text"
                                        className="w-full mt-1 p-2 border rounded-lg"
                                        placeholder="Ex: 4h5j6k..."
                                        value={newVideo.full_fight_id}
                                        onChange={e => setNewVideo({ ...newVideo, full_fight_id: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Salvar Vídeo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isPasteModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl overflow-y-auto max-h-[90vh]">
                        <h2 className="text-xl font-bold mb-4">Colar Dados CSV</h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Cole o conteúdo do CSV (com cabeçalhos na primeira linha) na caixa de texto abaixo. Apenas a coluna <code className="bg-gray-100 rounded px-1">title</code> é obrigatória.
                        </p>
                        <form onSubmit={handlePasteSubmit} className="space-y-4">
                            <textarea
                                className="w-full h-64 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none font-mono text-sm"
                                placeholder="title, category, price_highlight&#10;Luta 1, Muay Thai, 29.90&#10;Luta 2, Boxe, 39.90"
                                value={csvText}
                                onChange={(e) => setCsvText(e.target.value)}
                                required
                            />

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsPasteModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    disabled={importing}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-75 flex items-center justify-center gap-2"
                                    disabled={importing}
                                >
                                    {importing && <Loader2 className="w-4 h-4 animate-spin" />}
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
