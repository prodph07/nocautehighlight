import { Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { type Event } from '../types';

interface EventCardProps {
    event: Event;
}

export function EventCard({ event }: EventCardProps) {
    return (
        <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
            <Link to={`/event/${event.slug}`} className="block relative aspect-video overflow-hidden">
                <img
                    src={event.banner_url || 'https://via.placeholder.com/640x360?text=Evento+Sem+Banner'}
                    alt={event.title}
                    loading="lazy"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                <div className="absolute bottom-4 left-4 right-4">
                    <span className="inline-block px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded mb-2 uppercase tracking-wider">
                        Evento
                    </span>
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                        {event.title}
                    </h3>
                </div>
            </Link>

            <div className="p-4">
                <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-red-500" />
                        <span>{new Date(event.fight_date + 'T12:00:00').toLocaleDateString()}</span>
                    </div>
                    {event.location && (
                        <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1.5 text-blue-600" />
                            <span className="truncate max-w-[150px]">{event.location}</span>
                        </div>
                    )}
                </div>

                <Link
                    to={`/event/${event.slug}`}
                    className="flex items-center justify-center w-full py-2.5 bg-gray-50 text-gray-900 font-medium rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all"
                >
                    Ver Lutas
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
