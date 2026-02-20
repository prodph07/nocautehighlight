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

    const loadVideo = async (videoSlug: string) => {
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
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!video) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Evento não encontrado</h2>
                        <button
                            onClick={() => navigate('/')}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Voltar para Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            {/* Hero / Teaser Section */}
            <div className="bg-black relative h-[50vh] min-h-[400px]">
                <div className="absolute inset-0">
                    <img
                        src={video.teaser_url}
                        alt={video.title}
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-16">
                    <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded-full uppercase tracking-wide">
                            {video.modality}
                        </span>
                        <span className="px-3 py-1 bg-gray-700 text-gray-200 text-sm font-medium rounded-full">
                            {video.category}
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{video.title}</h1>
                    <p className="text-xl text-gray-300 mb-6">{video.event_name}</p>

                    <div className="flex flex-wrap items-center gap-6 text-gray-300">
                        <div className="flex items-center">
                            <Calendar className="w-5 h-5 mr-2" />
                            <span>{new Date(video.fight_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                            <ShieldCheck className="w-5 h-5 mr-2" />
                            <span>Garantia de Qualidade</span>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sobre a Luta</h2>
                            <p className="text-gray-600 leading-relaxed text-lg">
                                {video.description || "Descrição detalhada do evento e dos lutadores principais. Acompanhe cada detalhe desta disputa emocionante."}
                            </p>

                            <div className="mt-8">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {video.tags?.map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Checkout CTA */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 sticky top-24">
                            <div className="text-center mb-6">
                                <span className="text-gray-500 text-sm uppercase tracking-wide font-semibold">Highlight do Evento</span>
                                <div className="flex justify-center items-baseline gap-1 mt-2">
                                    <span className="text-4xl font-extrabold text-gray-900">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(video.price_highlight)}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleBuyClick}
                                className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                Quero Assistir Agora
                            </button>

                            <div className="mt-6 flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <Play className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-blue-800">
                                    Ao comprar, você recebe acesso <strong>imediato</strong> ao arquivo digital em alta definição.
                                </p>
                            </div>

                            <ul className="mt-6 space-y-3">
                                <li className="flex items-center text-gray-600 text-sm">
                                    <Check className="w-4 h-4 mr-3 text-green-500" />
                                    Acesso vitalício
                                </li>
                                <li className="flex items-center text-gray-600 text-sm">
                                    <Check className="w-4 h-4 mr-3 text-green-500" />
                                    Download liberado
                                </li>
                                <li className="flex items-center text-gray-600 text-sm">
                                    <Check className="w-4 h-4 mr-3 text-green-500" />
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
