
import { Calendar, MapPin, Play } from 'lucide-react';
import { type FightEvent } from '../../types';

interface EventCardProps {
    event: FightEvent;
    onBuy: (event: FightEvent) => void;
}

export function EventCard({ event, onBuy }: EventCardProps) {
    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-xl">
            <div className="relative aspect-video group cursor-pointer">
                <img
                    src={event.thumbnailUrl}
                    alt={event.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-12 h-12 text-white fill-white" />
                </div>
            </div>

            <div className="p-5">
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{event.title}</h3>

                <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-600 text-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{new Date(event.fight_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-gray-600 text-sm">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{event.event_name}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                    <span className="text-2xl font-bold text-blue-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(event.price_highlight)}
                    </span>
                    <button
                        onClick={() => onBuy(event)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Assistir Agora
                    </button>
                </div>
            </div>
        </div>
    );
}
