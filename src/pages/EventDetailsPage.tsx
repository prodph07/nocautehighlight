import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { EventService } from '../services/event.service';
import { VideoService } from '../services/video.service';
import { type Event, type FightEvent } from '../types';
import { VideoCard } from '../components/VideoCard';
import { Calendar, MapPin, ArrowLeft, Loader2 } from 'lucide-react';

export function EventDetailsPage() {
    const { slug } = useParams<{ slug: string }>();
    const [event, setEvent] = useState<Event | null>(null);
    const [videos, setVideos] = useState<FightEvent[]>([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Evento não encontrado</h1>
                <Link to="/" className="text-blue-600 hover:text-blue-700 flex items-center">
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

                <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="max-w-7xl mx-auto">
                        <Link to="/" className="inline-flex items-center text-brand-orange hover:text-brand-red mb-6 transition-colors font-bold uppercase tracking-wider text-sm">
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Voltar
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-black font-heading uppercase italic tracking-wider mb-4 leading-tight text-white drop-shadow-md">
                            {event.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-6 text-gray-300 font-medium uppercase tracking-wider">
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

            {/* Fights List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                <h2 className="text-3xl font-black font-heading uppercase italic tracking-widest text-white mb-8 flex items-center">
                    Card de Lutas
                    <span className="ml-4 px-3 py-1 bg-brand-red/20 border border-brand-red/30 text-brand-orange text-sm font-bold font-sans tracking-widest rounded uppercase">
                        {videos.length} Lutas
                    </span>
                </h2>

                {videos.length === 0 ? (
                    <div className="text-center py-12 bg-black rounded-2xl border border-brand-red/20 shadow-lg">
                        <p className="text-gray-400 text-lg font-heading uppercase tracking-widest">Nenhuma luta cadastrada para este evento ainda.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {videos.map(video => (
                            <VideoCard key={video.id} video={video} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
