import { Link } from 'react-router-dom';
import { Play, Clock } from 'lucide-react';
import { type FightEvent } from '../types';

interface VideoCardProps {
    video: FightEvent;
}

export function VideoCard({ video }: VideoCardProps) {
    return (
        <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full">
            <Link to={`/video/${video.slug}`} className="block relative aspect-video overflow-hidden">
                <img
                    src={video.teaser_url || 'https://via.placeholder.com/640x360?text=Sem+Imagem'}
                    alt={video.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 text-white fill-current ml-1" />
                    </div>
                </div>

                <div className="absolute top-4 left-4">
                    <span className="px-2 py-1 bg-black/60 backdrop-blur text-white text-xs font-bold rounded uppercase tracking-wider">
                        {video.category}
                    </span>
                </div>
            </Link>

            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        <Link to={`/video/${video.slug}`}>
                            {video.title}
                        </Link>
                    </h3>
                </div>

                <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Clock className="w-4 h-4 mr-1.5" />
                    <span>Luta Completa + Highlights</span>
                </div>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">A partir de</span>
                        <span className="text-lg font-bold text-blue-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(video.price_highlight)}
                        </span>
                    </div>
                    <Link
                        to={`/video/${video.slug}`}
                        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Assistir
                    </Link>
                </div>
            </div>
        </div>
    );
}
