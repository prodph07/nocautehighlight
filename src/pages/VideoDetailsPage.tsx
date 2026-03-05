import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Play, Check, ShieldCheck } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { supabase } from '../lib/supabase';
import { VideoService } from '../services/video.service';
import { LeadCaptureModal } from '../components/auth/LeadCaptureModal';
import { type FightEvent } from '../types';

export function VideoDetailsPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [video, setVideo] = useState<FightEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    useEffect(() => {
        if (slug) {
            loadVideo(slug);
        }
    }, [slug]);

    async function loadVideo(videoSlug: string) {
        setLoading(true);
        const data = await VideoService.getBySlug(videoSlug);
        setVideo(data);
        setLoading(false);
    };

    const handleBuyClick = async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            navigate('/checkout', { state: { eventSlug: video?.slug } });
        } else {
            setIsAuthModalOpen(true);
        }
    };

    const handleAuthSuccess = () => {
        setIsAuthModalOpen(false);
        if (video) {
            navigate('/checkout', { state: { eventSlug: video.slug } });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
            </div>
        );
    }

    if (!video) {
        return (
            <div className="min-h-screen bg-brand-dark flex flex-col text-white">
                <Navbar />
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-3xl font-black font-heading uppercase tracking-widest text-white mb-4">Evento não encontrado</h2>
                        <button
                            onClick={() => navigate('/')}
                            className="text-brand-orange hover:text-brand-red font-bold uppercase tracking-wider transition-colors"
                        >
                            Voltar para Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-dark flex flex-col font-sans text-gray-100">
            <Navbar />

            {/* Hero / Teaser Section */}
            <div className="bg-black relative h-[50vh] min-h-[400px] border-b border-brand-red/30">
                <div className="absolute inset-0">
                    <img
                        src={video.teaser_url}
                        alt={video.title}
                        loading="lazy"
                        className="w-full h-full object-cover opacity-50 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/50 to-transparent"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-16">
                    <div className="flex flex-wrap gap-3 mb-6">
                        <span className="px-4 py-1.5 bg-gradient-to-r from-brand-red to-brand-orange text-white text-sm font-black font-heading rounded-full uppercase tracking-widest shadow-lg shadow-brand-red/20">
                            {video.modality}
                        </span>
                        <span className="px-4 py-1.5 bg-black/60 border border-brand-red/30 backdrop-blur text-gray-200 text-sm font-bold font-heading rounded-full uppercase tracking-widest">
                            {video.category}
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black font-heading uppercase italic tracking-wider text-white mb-2 drop-shadow-md">{video.title}</h1>
                    <p className="text-xl text-brand-orange font-bold uppercase tracking-widest mb-8">{video.event_name}</p>

                    <div className="flex flex-wrap items-center gap-6 text-gray-300 font-medium uppercase tracking-wider text-sm">
                        <div className="flex items-center">
                            <Calendar className="w-5 h-5 mr-2 text-brand-red" />
                            <span>{new Date(video.fight_date + 'T12:00:00').toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-brand-orange">
                            <ShieldCheck className="w-5 h-5 mr-2" />
                            <span>Garantia de Qualidade</span>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-grow w-full">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-black/60 border border-brand-red/20 rounded-2xl p-8 shadow-xl backdrop-blur-sm">
                            <h2 className="text-3xl font-black font-heading uppercase italic tracking-wider text-white mb-6 flex items-center">
                                <span className="w-2 h-8 bg-brand-orange mr-3 rounded-full"></span>
                                Sobre a Luta
                            </h2>
                            <p className="text-gray-300 leading-relaxed text-lg">
                                {video.description || "Descrição detalhada do evento e dos lutadores principais. Acompanhe cada detalhe desta disputa emocionante."}
                            </p>

                            <div className="mt-10">
                                <h3 className="text-xl font-bold text-white mb-4 font-heading uppercase tracking-widest">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {video.tags?.map(tag => (
                                        <span key={tag} className="px-3 py-1.5 bg-brand-red/10 border border-brand-red/30 text-brand-orange font-bold uppercase text-xs tracking-wider rounded-lg">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Checkout CTA */}
                    <div className="lg:col-span-1">
                        <div className="bg-black/80 rounded-2xl p-8 shadow-2xl shadow-brand-red/10 border border-brand-red/30 sticky top-24 backdrop-blur-md">
                            <div className="text-center mb-8 pb-6 border-b border-gray-800">
                                <span className="text-brand-orange text-sm uppercase tracking-widest font-black font-heading">Highlight do Evento</span>
                                <div className="flex justify-center items-baseline gap-1 mt-3">
                                    <span className="text-5xl font-black font-heading italic text-white drop-shadow-lg">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(video.price_highlight)}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleBuyClick}
                                className="w-full py-4 bg-gradient-to-r from-brand-red to-brand-orange text-white rounded-xl font-black font-heading uppercase italic tracking-widest text-xl hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all transform hover:-translate-y-1"
                            >
                                Quero Comprar Agora
                            </button>

                            <div className="mt-8 flex items-start gap-4 p-4 bg-brand-red/10 rounded-xl border border-brand-red/20">
                                <Play className="w-6 h-6 text-brand-orange flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    Ao comprar, você recebe acesso <strong className="text-white font-bold">imediato</strong> ao arquivo digital em alta definição.
                                </p>
                            </div>

                            <ul className="mt-8 space-y-4">
                                <li className="flex items-center text-gray-400 text-sm font-medium">
                                    <Check className="w-5 h-5 mr-3 text-brand-orange" />
                                    Acesso vitalício
                                </li>
                                <li className="flex items-center text-gray-400 text-sm font-medium">
                                    <Check className="w-5 h-5 mr-3 text-brand-orange" />
                                    Download liberado
                                </li>
                                <li className="flex items-center text-gray-400 text-sm font-medium">
                                    <Check className="w-5 h-5 mr-3 text-brand-orange" />
                                    Formato compatível com celular
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>

            <LeadCaptureModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onSuccess={handleAuthSuccess}
            />
        </div>
    );
}
