import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { EventService } from '../services/event.service';
import { VideoService } from '../services/video.service';
import { type Event, type FightEvent } from '../types';
import { VideoCard } from '../components/VideoCard';
import { Calendar, MapPin, ArrowLeft, Loader2, Search, X, LayoutGrid, List } from 'lucide-react';

export function EventDetailsPage() {
    const { slug } = useParams<{ slug: string }>();
    const [event, setEvent] = useState<Event | null>(null);
    const [videos, setVideos] = useState<FightEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        if (slug) {
            loadEvent(slug);
        }
    }, [slug]);

    async function loadEvent(slug: string) {
        setLoading(true);
        const eventData = await EventService.getBySlug(slug);
        setEvent(eventData);

        if (eventData) {
            const videosData = await VideoService.getByEventId(eventData.id);
            setVideos(videosData);
        }
        setLoading(false);
    };

    const filteredVideos = videos.filter(video => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return true;
        return (
            video.title.toLowerCase().includes(term) ||
            (video.category && video.category.toLowerCase().includes(term)) ||
            (video.modality && video.modality.toLowerCase().includes(term)) ||
            (video.event_name && video.event_name.toLowerCase().includes(term)) ||
            (video.tags && video.tags.some(t => t.toLowerCase().includes(term)))
        );
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold text-white mb-4 uppercase font-heading">Evento não encontrado</h1>
                <Link to="/" className="text-brand-orange hover:text-brand-red flex items-center font-bold uppercase tracking-wider text-sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar para Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-dark pb-12 font-sans text-gray-100">
            {/* Hero / Banner */}
            <div className="relative h-[40vh] bg-black border-b border-brand-red/30">
                <img
                    src={event.banner_url || 'https://via.placeholder.com/1920x600?text=Evento+Sem+Banner'}
                    alt={event.title}
                    loading="lazy"
                    className="w-full h-full object-cover opacity-50 mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/50 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Link to="/" className="inline-flex items-center text-brand-orange hover:text-brand-red mb-6 transition-colors font-bold uppercase tracking-wider text-sm">
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Voltar
                        </Link>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-heading uppercase italic tracking-wider mb-4 leading-tight text-white drop-shadow-md">
                            {event.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-gray-300 font-medium uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-brand-red" />
                                <span className="text-lg">{new Date(event.fight_date + 'T12:00:00').toLocaleDateString()}</span>
                            </div>
                            {event.location && (
                                <div className="flex items-center">
                                    <MapPin className="w-5 h-5 mr-2 text-brand-orange" />
                                    <span className="text-lg">{event.location}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Fights List Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                {/* Header & Controls Toolbar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <h2 className="text-2xl sm:text-3xl font-black font-heading uppercase italic tracking-widest text-white flex items-center gap-3">
                        Card de Lutas
                        <span className="px-3 py-1 bg-brand-red/20 border border-brand-red/30 text-brand-orange text-xs font-bold font-sans tracking-widest rounded-lg uppercase">
                            {filteredVideos.length} {filteredVideos.length === 1 ? 'Luta' : 'Lutas'}
                        </span>
                    </h2>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {/* Search Input Bar */}
                        <div className="relative flex-1 sm:w-72">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-orange" />
                            <input
                                type="text"
                                placeholder="BUSCAR ATLETA, EQUIPE..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-9 py-2.5 bg-black border border-brand-red/30 rounded-xl text-white placeholder-gray-500 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* View Mode Toggle Buttons (Grid / List) */}
                        <div className="flex items-center bg-black p-1 rounded-xl border border-brand-red/20 shrink-0 self-end sm:self-auto">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-brand-orange text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                                title="Visualização em Grade"
                            >
                                <LayoutGrid className="w-4 h-4" />
                                <span className="hidden sm:inline">Grade</span>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                    viewMode === 'list'
                                        ? 'bg-brand-orange text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                                title="Visualização em Lista"
                            >
                                <List className="w-4 h-4" />
                                <span className="hidden sm:inline">Lista</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Video Cards Grid / List Container */}
                {videos.length === 0 ? (
                    <div className="text-center py-12 bg-black rounded-2xl border border-brand-red/20 shadow-lg">
                        <p className="text-gray-400 text-lg font-heading uppercase tracking-widest">Nenhuma luta cadastrada para este evento ainda.</p>
                    </div>
                ) : filteredVideos.length === 0 ? (
                    <div className="text-center py-12 bg-black rounded-2xl border border-brand-red/20 shadow-lg">
                        <p className="text-gray-400 text-lg font-heading uppercase tracking-widest">Nenhuma luta encontrada com o termo "{searchTerm}".</p>
                        <button
                            onClick={() => setSearchTerm('')}
                            className="mt-4 text-brand-orange hover:underline text-xs font-bold uppercase tracking-wider"
                        >
                            Limpar Busca
                        </button>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8' : 'space-y-4'}>
                        {filteredVideos.map(video => (
                            <VideoCard key={video.id} video={video} layout={viewMode} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

