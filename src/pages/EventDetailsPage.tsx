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

    const loadEvent = async (slug: string) => {
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
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Hero / Banner */}
            <div className="relative h-[40vh] bg-gray-900">
                <img
                    src={event.banner_url || 'https://via.placeholder.com/1920x600?text=Evento+Sem+Banner'}
                    alt={event.title}
                    loading="lazy"
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="max-w-7xl mx-auto">
                        <Link to="/" className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors">
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Voltar
                        </Link>
                        <h1 className="text-4xl font-bold font-display uppercase tracking-wider mb-4 leading-tight">
                            {event.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-6 text-gray-200">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-red-500" />
                                <span className="text-lg">{new Date(event.fight_date + 'T12:00:00').toLocaleDateString()}</span>
                            </div>
                            {event.location && (
                                <div className="flex items-center">
                                    <MapPin className="w-5 h-5 mr-2 text-blue-400" />
                                    <span className="text-lg">{event.location}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Fights List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                    Card de Lutas
                    <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                        {videos.length} Lutas
                    </span>
                </h2>

                {videos.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-gray-500 text-lg">Nenhuma luta cadastrada para este evento ainda.</p>
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
