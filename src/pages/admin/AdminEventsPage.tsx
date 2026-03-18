import { useEffect, useState } from 'react';
import { type Event } from '../../types';
import { EventService } from '../../services/event.service';
import { Plus, Trash2, Calendar, MapPin, Loader2, Edit, FolderOpen, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { compressImageToWebp } from '../../utils/imageUtils';
import { useOutletContext, Navigate } from 'react-router-dom';

export function AdminEventsPage() {
    const { isAdmin } = useOutletContext<{ isAdmin: boolean }>();

    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState<Partial<Event>>({
        title: '',
        location: '',
        fight_date: new Date().toISOString().split('T')[0],
        banner_url: '',
        drive_link: '',
        is_active: true
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        loadEvents();
    }, []);

    async function loadEvents() {
        setLoading(true);
        const data = await EventService.getAll();
        setEvents(data);
        setLoading(false);
    };

    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const slug = newEvent.title?.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
            const eventData = { ...newEvent, slug };

            if (selectedImageFile) {
                const webpFile = await compressImageToWebp(selectedImageFile);

                // Upload to Supabase Storage
                const fileName = `${Date.now()}_${slug || 'event'}.webp`;
                const { error: uploadError } = await supabase.storage
                    .from('banners')
                    .upload(fileName, webpFile, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    console.error('Error uploading image:', uploadError);
                    alert('Erro ao fazer upload da imagem. O evento não foi salvo.');
                    return;
                }

                // Get Public URL
                const { data: publicUrlData } = supabase.storage
                    .from('banners')
                    .getPublicUrl(fileName);

                eventData.banner_url = publicUrlData.publicUrl;
            }

            let success = false;
            if (editingId) {
                success = await EventService.update(editingId, eventData);
                if (success) alert('Evento atualizado com sucesso!');
            } else {
                success = await EventService.create(eventData);
                if (success) alert('Evento criado com sucesso!');
            }

            if (success) {
                closeModal();
                loadEvents();
            } else {
                alert('Erro ao salvar evento');
            }
        } catch (error) {
            console.error('Error saving event:', error);
            alert('Erro ao salvar evento');
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImageFile(file);
            const objectUrl = URL.createObjectURL(file);
            setImagePreview(objectUrl);
        }
    };

    const handleEditClick = (event: Event) => {
        setNewEvent({
            title: event.title,
            location: event.location || '',
            fight_date: event.fight_date,
            banner_url: event.banner_url || '',
            drive_link: event.drive_link || '',
            is_active: event.is_active
        });
        setEditingId(event.id);
        setSelectedImageFile(null);
        setImagePreview(event.banner_url || null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setNewEvent({
            title: '',
            location: '',
            fight_date: new Date().toISOString().split('T')[0],
            banner_url: '',
            drive_link: '',
            is_active: true
        });
        setSelectedImageFile(null);
        setImagePreview(null);
    };

    const handleDeleteEvent = async (id: string, title: string) => {
        if (!confirm(`Tem certeza que deseja excluir o evento "${title}"?`)) return;

        const { error } = await supabase.from('events').delete().eq('id', id);
        if (error) {
            alert('Erro ao excluir evento');
        } else {
            loadEvents();
        }
    };

    if (!isAdmin) return <Navigate to="/admin/production" replace />;

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h1 className="text-3xl font-black font-heading uppercase italic tracking-widest text-white">Gerenciar <span className="text-brand-orange">Eventos</span></h1>
                <button
                    onClick={() => {
                        closeModal();
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-dark border border-brand-red/20 rounded-xl text-gray-300 hover:text-white hover:border-brand-orange transition-colors font-bold uppercase tracking-wider text-sm"
                >
                    <Plus className="w-5 h-5" />
                    Novo Evento
                </button>
            </div>

            <div className="bg-black rounded-2xl shadow-[0_0_15px_rgba(220,38,38,0.1)] border border-brand-red/20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                        <tr className="bg-brand-dark border-b border-brand-red/20">
                            <th className="p-4 font-bold uppercase tracking-wider text-gray-400 text-xs">Evento</th>
                            <th className="p-4 font-bold uppercase tracking-wider text-gray-400 text-xs">Data</th>
                            <th className="p-4 font-bold uppercase tracking-wider text-gray-400 text-xs">Local</th>
                            <th className="p-4 font-bold uppercase tracking-wider text-gray-400 text-xs">Status</th>
                            <th className="p-4 font-bold uppercase tracking-wider text-gray-400 text-xs text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest italic">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-orange" />
                                    Carregando eventos...
                                </td>
                            </tr>
                        ) : events.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest italic">Nenhum evento encontrado.</td>
                            </tr>
                        ) : (
                            events.map(event => (
                                <tr key={event.id} className="border-b border-brand-red/10 hover:bg-brand-dark/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center">
                                            {event.banner_url && (
                                                <img src={event.banner_url} alt="" loading="lazy" className="w-12 h-12 rounded-lg object-cover mr-4 border border-brand-red/20" />
                                            )}
                                            <div>
                                                <div className="font-black font-heading uppercase tracking-widest text-white">{event.title}</div>
                                                <div className="text-xs text-brand-orange font-mono mt-1 w-fit bg-brand-orange/10 px-2 py-0.5 rounded border border-brand-orange/20">ID: #{event.id.substring(0, 8)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-300 font-medium">
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                                            {new Date(event.fight_date + 'T12:00:00').toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-300 font-medium">
                                        <div className="flex items-center">
                                            <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                                            {event.location || '-'}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${event.is_active ? 'bg-green-900/40 text-green-400 border-green-500/30' : 'bg-red-900/40 text-red-500 border-red-500/30'}`}>
                                            {event.is_active ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 items-center">
                                            {event.drive_link && (
                                                <a
                                                    href={event.drive_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 bg-black text-gray-400 hover:text-green-400 hover:border-green-500/50 border border-gray-700 rounded-lg transition-colors"
                                                    title="Acessar Pasta no Drive"
                                                >
                                                    <FolderOpen className="w-4 h-4" />
                                                </a>
                                            )}
                                            <a
                                                href={`/admin/events/${event.id}/videos`}
                                                className="px-4 py-2 text-xs bg-black text-gray-300 hover:text-white hover:border-brand-orange border border-gray-700 rounded-lg transition-colors font-bold uppercase tracking-wider flex items-center"
                                                title="Gerenciar Card de Lutas"
                                            >
                                                Card de Lutas
                                            </a>
                                            <button
                                                onClick={() => handleEditClick(event)}
                                                className="p-2 bg-black text-gray-400 hover:text-blue-400 hover:border-blue-500/50 border border-gray-700 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteEvent(event.id, event.title)}
                                                className="p-2 bg-black text-gray-400 hover:text-red-500 hover:border-red-500/50 border border-gray-700 rounded-lg transition-colors"
                                                title="Excluir"
                                            >
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
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-black border border-brand-red/20 shadow-[0_0_30px_rgba(220,38,38,0.2)] rounded-2xl p-8 w-full max-w-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-orange/5 to-transparent rounded-bl-full pointer-events-none"></div>
                        
                        <h2 className="text-2xl font-black font-heading uppercase italic tracking-widest text-white mb-6 border-b border-brand-red/20 pb-4 relative z-10">
                            {editingId ? 'Editar Evento' : 'Novo Evento'}
                        </h2>
                        
                        <form onSubmit={handleSaveEvent} className="space-y-5 relative z-10">
                            <div>
                                <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Título do Evento</label>
                                <input
                                    type="text"
                                    className="w-full p-3 bg-brand-dark border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                    placeholder="Ex: High Nocaute 5"
                                    value={newEvent.title}
                                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Data</label>
                                    <input
                                        type="date"
                                        className="w-full p-3 bg-brand-dark border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all"
                                        value={newEvent.fight_date}
                                        onChange={e => setNewEvent({ ...newEvent, fight_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Local</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 bg-brand-dark border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                        placeholder="Ex: Ginásio X"
                                        value={newEvent.location}
                                        onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Banner do Evento</label>

                                <div className="border border-brand-red/20 rounded-xl p-5 bg-brand-dark/50 flex flex-col items-center transition-colors hover:bg-brand-dark">
                                    {(imagePreview || newEvent.banner_url) && (
                                        <div className="mb-4 w-full">
                                            <img
                                                src={imagePreview || newEvent.banner_url}
                                                alt="Preview"
                                                className="w-full h-32 object-cover rounded-lg border border-gray-700 shadow-md"
                                            />
                                        </div>
                                    )}
                                    <label className="flex items-center justify-center w-full px-4 py-3 bg-black border border-gray-700 rounded-xl cursor-pointer hover:border-brand-orange hover:text-white text-gray-400 transition-colors font-bold uppercase tracking-wider text-xs">
                                        <ImageIcon className="w-5 h-5 mr-2 text-brand-orange" />
                                        <span>{imagePreview ? 'Trocar Imagem' : 'Selecionar Imagem do PC'}</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                    <p className="text-xs text-gray-500 font-medium mt-3 text-center italic">
                                        * A imagem será otimizada (WebP) magicamente antes do envio.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Link da Pasta no Drive (Opcional)</label>
                                <input
                                    type="url"
                                    className="w-full p-3 bg-brand-dark border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                    placeholder="https://drive.google.com/..."
                                    value={newEvent.drive_link}
                                    onChange={e => setNewEvent({ ...newEvent, drive_link: e.target.value })}
                                />
                                <p className="text-xs text-brand-red font-medium mt-2 italic">
                                    * Este link não será visto pelos clientes. É um atalho para facilitar o acesso da produção aos vídeos brutos.
                                </p>
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
                                    Salvar Evento
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
