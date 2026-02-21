import { useEffect, useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { EventService } from '../services/event.service';
import { type Event } from '../types';
import { EventCard } from '../components/EventCard';
import { Loader2, Search, Zap } from 'lucide-react';

export function HomePage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        setLoading(true);
        const data = await EventService.getAll();
        setEvents(data);
        setLoading(false);
    };

    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            {/* Hero Section */}
            <div className="relative bg-slate-900 border-b border-gray-800">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/10"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                            HIGH NOCAUTE
                        </span>
                        <br />
                        <span className="text-gray-100">ON DEMAND</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 font-light">
                        Adquira os melhores highlights de eventos de luta do Brasil. Muay Thai, Kickboxing e Boxe em alta qualidade.
                    </p>

                    <div className="max-w-xl mx-auto relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar evento..."
                                className="w-full pl-12 pr-4 py-4 bg-white/95 backdrop-blur rounded-xl shadow-lg border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 text-lg transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Events List */}
            <main className="flex-grow container mx-auto px-4 py-12 max-w-7xl">
                <div className="flex items-center mb-8">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <Zap className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Eventos Disponíveis</h2>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                        <p className="text-gray-500">Carregando eventos...</p>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-lg">Nenhum evento encontrado.</p>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="mt-4 text-blue-600 hover:underline"
                            >
                                Limpar busca
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredEvents.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                )}
            </main>

            <footer className="bg-white border-t border-gray-100 py-12 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-500">
                    <p className="font-medium text-gray-900 mb-2">High Nocaute</p>
                    <p className="text-sm">© {new Date().getFullYear()} Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
}
