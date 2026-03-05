import { Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { type Event } from '../types';

interface EventCardProps {
    event: Event;
}

export function EventCard({ event }: EventCardProps) {
    return (
        <div className="group bg-black rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all duration-300 border border-brand-red/20 hover:border-brand-red/50">
            <Link to={`/event/${event.slug}`} className="block relative aspect-video overflow-hidden">
                <img
                    src={event.banner_url || 'https://via.placeholder.com/640x360?text=Evento+Sem+Banner'}
                    alt={event.title}
                    loading="lazy"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                <div className="absolute bottom-4 left-4 right-4">
                    <span className="inline-block px-3 py-1 bg-gradient-to-r from-brand-red to-brand-orange text-white text-xs font-bold rounded mb-2 uppercase tracking-widest font-heading shadow-lg">
                        Evento
                    </span>
                    <h3 className="text-2xl font-black font-heading uppercase italic text-white mb-1 group-hover:text-brand-orange transition-colors drop-shadow-md">
                        {event.title}
                    </h3>
                </div>
            </Link>

            <div className="p-5">
                <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-6 uppercase tracking-wider font-medium">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-brand-red" />
                        <span>{new Date(event.fight_date + 'T12:00:00').toLocaleDateString()}</span>
                    </div>
                    {event.location && (
                        <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1.5 text-brand-orange" />
                            <span className="truncate max-w-[150px]">{event.location}</span>
                        </div>
                    )}
                </div>

                <Link
                    to={`/event/${event.slug}`}
                    className="flex items-center justify-center w-full py-3 bg-brand-red/10 border border-brand-red/30 text-white font-heading uppercase tracking-widest font-bold rounded-lg group-hover:bg-brand-red group-hover:border-brand-red transition-all"
                >
                    Ver Lutas
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
