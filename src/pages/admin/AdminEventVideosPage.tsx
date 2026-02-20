import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { VideoService } from '../../services/video.service';
import { EventService } from '../../services/event.service';
import { type FightEvent, type Event } from '../../types';
import { Plus, Edit, Trash2, Loader2, ArrowLeft } from 'lucide-react';

export function AdminEventVideosPage() {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();

    const [videos, setVideos] = useState<FightEvent[]>([]);
    const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
                VideoService.getByEventId(eventId),
                EventService.getAll()
            ]);

            const evt = allEvents.find(e => e.id === eventId);
            if (evt) setCurrentEvent(evt);

            setVideos(videosData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateVideo = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!eventId || !currentEvent) {
                alert('Erro de contexto: Evento não encontrado.');
                return;
            }

            const slug = newVideo.title?.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

            const videoToInsert = {
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

            const { error } = await supabase.from('videos').insert(videoToInsert);

            if (error) throw error;

            alert('Vídeo criado com sucesso!');
            setIsModalOpen(false);
            loadData();

            setNewVideo({
                ...newVideo,
                title: '',
                teaser_url: '',
                highlight_id: '',
                full_fight_id: ''
            });
        } catch (error) {
            console.error('Error creating video:', error);
            const errorMessage = (error as any).message || JSON.stringify(error);
            alert(`Erro ao criar vídeo: ${errorMessage}`);
        }
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
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Nova Luta
                </button>
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
                                            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
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
                        <h2 className="text-xl font-bold mb-4">Adicionar Nova Luta</h2>
                        <form onSubmit={handleCreateVideo} className="space-y-4">
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
                                    onClick={() => setIsModalOpen(false)}
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
        </div>
    );
}
