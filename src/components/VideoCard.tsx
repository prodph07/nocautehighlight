import { Link } from 'react-router-dom';
import { Play, Clock } from 'lucide-react';
import { type FightEvent } from '../types';

interface VideoCardProps {
    video: FightEvent;
    layout?: 'grid' | 'list';
}

export function VideoCard({ video, layout = 'grid' }: VideoCardProps) {
    if (layout === 'list') {
        return (
            <div className="group bg-black rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_0_25px_rgba(220,38,38,0.25)] transition-all duration-300 border border-brand-red/20 hover:border-brand-red/50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Thumbnail */}
                <Link to={`/video/${video.slug}`} className="block relative w-full sm:w-56 aspect-video rounded-xl overflow-hidden shrink-0">
                    <img
                        src={video.teaser_url || 'https://via.placeholder.com/640x360?text=Sem+Imagem'}
                        alt={video.title}
                        loading="lazy"
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-black/80 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="w-10 h-10 bg-brand-red/90 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.6)]">
                            <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                        </div>
                    </div>
                    {video.category && (
                        <div className="absolute top-2 left-2">
                            <span className="px-2 py-0.5 bg-black/80 border border-gray-700 text-white text-[10px] font-bold rounded uppercase tracking-widest font-heading">
                                {video.category}
                            </span>
                        </div>
                    )}
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg md:text-xl font-black font-heading uppercase italic text-white group-hover:text-brand-orange transition-colors truncate">
                        <Link to={`/video/${video.slug}`}>
                            {video.title}
                        </Link>
                    </h3>
                    <div className="flex items-center text-xs text-gray-400 mt-1 uppercase tracking-wider font-medium">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-brand-red shrink-0" />
                        <span>Luta Completa + Highlights</span>
                    </div>
                    {video.modality && (
                        <span className="inline-block mt-2 text-[10px] bg-brand-dark px-2.5 py-1 rounded border border-gray-800 text-gray-300 font-bold uppercase tracking-wider">
                            {video.modality}
                        </span>
                    )}
                </div>

                {/* Action & Price */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-brand-red/20 shrink-0 gap-3">
                    <div className="text-left sm:text-right">
                        <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-heading">A partir de</span>
                        <span className="text-xl font-black font-heading italic text-brand-orange">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(video.price_highlight)}
                        </span>
                    </div>
                    <Link
                        to={`/video/${video.slug}`}
                        className="px-5 py-2.5 bg-gradient-to-r from-brand-red to-brand-orange text-white text-xs font-black font-heading uppercase italic tracking-wider rounded-lg hover:shadow-lg hover:shadow-brand-red/30 transition-all shrink-0"
                    >
                        Comprar
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="group bg-black rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(220,38,38,0.2)] transition-all duration-300 border border-brand-red/20 hover:border-brand-red/50 flex flex-col h-full relative">
            <Link to={`/video/${video.slug}`} className="block relative aspect-video overflow-hidden">
                <img
                    src={video.teaser_url || 'https://via.placeholder.com/640x360?text=Sem+Imagem'}
                    alt={video.title}
                    loading="lazy"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-black/80 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="w-14 h-14 bg-brand-red/90 rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-all shadow-[0_0_20px_rgba(220,38,38,0.6)]">
                        <Play className="w-7 h-7 text-white fill-current ml-1" />
                    </div>
                </div>

                <div className="absolute top-4 left-4">
                    <span className="px-2 py-1 bg-black/80 border border-gray-700 backdrop-blur text-white text-xs font-bold rounded uppercase tracking-widest font-heading shadow-md">
                        {video.category}
                    </span>
                </div>
            </Link>

            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-black font-heading uppercase italic text-white group-hover:text-brand-orange transition-colors line-clamp-2">
                        <Link to={`/video/${video.slug}`}>
                            {video.title}
                        </Link>
                    </h3>
                </div>

                <div className="flex items-center text-sm text-gray-400 mb-6 uppercase tracking-wider font-medium">
                    <Clock className="w-4 h-4 mr-1.5 text-brand-red" />
                    <span>Luta Completa + Highlights</span>
                </div>

                <div className="mt-auto flex items-center justify-between pt-5 border-t border-brand-red/20">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase tracking-widest font-heading mb-0.5">A partir de</span>
                        <span className="text-2xl font-black font-heading italic text-brand-orange drop-shadow-sm">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(video.price_highlight)}
                        </span>
                    </div>
                    <Link
                        to={`/video/${video.slug}`}
                        className="px-5 py-2.5 bg-gradient-to-r from-brand-red to-brand-orange text-white text-sm font-black font-heading uppercase italic tracking-wider rounded-lg hover:shadow-lg hover:shadow-brand-red/30 transition-all"
                    >
                        Comprar
                    </Link>
                </div>
            </div>
        </div>
    );
}

