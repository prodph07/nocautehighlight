import { useEffect, useState } from 'react';
import { type Event } from '../../types';
import { EventService } from '../../services/event.service';
import { Plus, Trash2, Calendar, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function AdminEventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState<Partial<Event>>({
        title: '',
        location: '',
        fight_date: new Date().toISOString().split('T')[0],
        banner_url: '',
        is_active: true
    });

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        setLoading(true);
        const data = await EventService.getAll();
        setEvents(data);
        setLoading(false);
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const slug = newEvent.title?.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
            const eventToCreate = { ...newEvent, slug };

            const created = await EventService.create(eventToCreate);

            if (created) {
                alert('Evento criado com sucesso!');
                setIsModalOpen(false);
                loadEvents();
                setNewEvent({
                    title: '',
                    location: '',
                    fight_date: new Date().toISOString().split('T')[0],
                    banner_url: '',
                    is_active: true
                });
            } else {
                alert('Erro ao criar evento');
            }
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Erro ao criar evento');
        }
    };

    const handleDeleteEvent = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este evento?')) return;

        const { error } = await supabase.from('events').delete().eq('id', id);
        if (error) {
            alert('Erro ao excluir evento');
        } else {
            loadEvents();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Eventos</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Novo Evento
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="p-4 font-semibold text-gray-600 text-sm">Evento</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Data</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Local</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                    Carregando eventos...
                                </td>
                            </tr>
                        ) : events.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">Nenhum evento encontrado.</td>
                            </tr>
                        ) : (
                            events.map(event => (
                                <tr key={event.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                    <td className="p-4">
                                        <div className="flex items-center">
                                            {event.banner_url && (
                                                <img src={event.banner_url} alt="" className="w-10 h-10 rounded object-cover mr-3" />
                                            )}
                                            <div>
                                                <div className="font-medium text-gray-900">{event.title}</div>
                                                <div className="text-xs text-gray-400">ID: {event.id.substring(0, 8)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                            {new Date(event.fight_date).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        <div className="flex items-center">
                                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                            {event.location || '-'}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${event.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {event.is_active ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <a
                                                href={`/admin/events/${event.id}/videos`}
                                                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors font-medium flex items-center"
                                                title="Gerenciar Card de Lutas"
                                            >
                                                Card de Lutas
                                            </a>
                                            <button
                                                onClick={() => handleDeleteEvent(event.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-4">Novo Evento</h2>
                        <form onSubmit={handleCreateEvent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Título do Evento</label>
                                <input
                                    type="text"
                                    className="w-full mt-1 p-2 border rounded-lg"
                                    placeholder="Ex: High Nocaute 5"
                                    value={newEvent.title}
                                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Data</label>
                                    <input
                                        type="date"
                                        className="w-full mt-1 p-2 border rounded-lg"
                                        value={newEvent.fight_date}
                                        onChange={e => setNewEvent({ ...newEvent, fight_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Local</label>
                                    <input
                                        type="text"
                                        className="w-full mt-1 p-2 border rounded-lg"
                                        placeholder="Ex: Ginásio X"
                                        value={newEvent.location}
                                        onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Banner URL</label>
                                <input
                                    type="url"
                                    className="w-full mt-1 p-2 border rounded-lg"
                                    placeholder="https://..."
                                    value={newEvent.banner_url}
                                    onChange={e => setNewEvent({ ...newEvent, banner_url: e.target.value })}
                                />
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
                                    Criar Evento
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
