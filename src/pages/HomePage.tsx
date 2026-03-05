import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

    async function loadEvents() {
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
        <div className="min-h-screen bg-brand-dark flex flex-col font-sans text-gray-100">
            <Navbar />

            {/* Hero Section */}
            <div className="relative bg-black border-b border-brand-red/20 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/50 via-brand-dark/80 to-brand-dark"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
                    <h1 className="text-5xl md:text-7xl font-black font-heading italic tracking-tighter text-white mb-6 uppercase">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-brand-orange drop-shadow-lg">
                            HIGH NOCAUTE
                        </span>
                        <br />
                        <span className="text-gray-100 drop-shadow-md">ON DEMAND</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 font-light">
                        Adquira os melhores highlights de eventos de luta do Brasil. Muay Thai, Kickboxing e Boxe em alta qualidade.
                    </p>

                    <div className="max-w-xl mx-auto relative group mt-12">
                        <div className="absolute -inset-1 bg-gradient-to-r from-brand-red to-brand-orange rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="BUSCAR EVENTO..."
                                className="w-full pl-12 pr-4 py-4 bg-black/60 backdrop-blur-md rounded-xl shadow-lg border border-brand-red/30 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/50 text-white placeholder-gray-400 text-lg transition-all font-heading uppercase tracking-wider"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-orange w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Events List */}
            <main className="flex-grow container mx-auto px-4 py-16 max-w-7xl">
                <div className="flex items-center mb-10">
                    <div className="p-3 bg-brand-red/10 border border-brand-red/30 rounded-xl mr-4 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                        <Zap className="w-6 h-6 text-brand-orange" />
                    </div>
                    <h2 className="text-3xl font-black font-heading uppercase tracking-wide text-white">Eventos Disponíveis</h2>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 animate-spin text-brand-orange mb-4" />
                        <p className="text-gray-400 font-heading tracking-widest uppercase">Carregando eventos...</p>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="text-center py-20 bg-brand-dark/50 rounded-2xl border border-brand-red/20 shadow-lg shadow-black/50">
                        <p className="text-gray-400 text-lg font-heading uppercase tracking-wider">Nenhum evento encontrado.</p>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="mt-6 text-brand-orange hover:text-brand-red font-bold transition-colors uppercase tracking-wider text-sm"
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

            <footer className="bg-black border-t border-brand-red/20 py-12 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-500">
                    <p className="font-black font-heading italic text-xl text-white mb-2 tracking-wider">HIGH NOCAUTE</p>
                    <p className="text-sm mb-4">© {new Date().getFullYear()} Todos os direitos reservados.</p>
                    <Link to="/termos" className="text-sm text-brand-red hover:text-brand-orange transition-colors">Termos de Serviço e Política de Reembolso</Link>
                </div>
            </footer>
        </div>
    );
}
