import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Package, ExternalLink, Edit3, CheckCircle, Clock, Settings, Save, Loader2 } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { VideoService } from '../services/video.service';
import { supabase } from '../lib/supabase';
import { ProductionDetailsModal } from '../components/ProductionDetailsModal';
import { PixPaymentModal } from '../components/PixPaymentModal';
import { type Order, type OrderItem, type ProductionFormData } from '../types';

export function MyAccountPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [myOrders, setMyOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrderItem, setSelectedOrderItem] = useState<OrderItem | null>(null);

    // Pix Modal state
    const [isPixModalOpen, setIsPixModalOpen] = useState(false);
    const [selectedPixOrder, setSelectedPixOrder] = useState<Order | null>(null);

    // Tab State
    const [activeTab, setActiveTab] = useState<'orders' | 'settings'>('orders');

    const [profile, setProfile] = useState({
        full_name: '',
        whatsapp: '',
        cpf: ''
    });
    const [savingProfile, setSavingProfile] = useState(false);
    const [email, setEmail] = useState('');
    const [savingEmail, setSavingEmail] = useState(false);

    // Password Update State
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/');
            return;
        }
        setUser(user);
        loadData(user.id);
    };

    const loadData = async (userId: string) => {
        setLoading(true);
        try {
            const [ordersData, profileRes] = await Promise.all([
                VideoService.getMyOrders(userId),
                supabase.from('profiles').select('*').eq('id', userId).single()
            ]);

            setMyOrders(ordersData);

            if (profileRes.data) {
                setProfile({
                    full_name: profileRes.data.full_name || '',
                    whatsapp: profileRes.data.whatsapp || '',
                    cpf: profileRes.data.cpf || ''
                });
                setEmail(user.email || ''); // get email from user object
            }
        } catch (error) {
            console.error("Error loading account data:", error);
        }
        setLoading(false);
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSavingProfile(true);

        try {
            const { error } = await supabase.from('profiles').update({
                full_name: profile.full_name,
                whatsapp: profile.whatsapp,
                cpf: profile.cpf
            }).eq('id', user.id);

            if (error) throw error;

            // Also update auth metadata to keep it consistent
            await supabase.auth.updateUser({
                data: {
                    full_name: profile.full_name,
                    whatsapp: profile.whatsapp,
                    cpf: profile.cpf
                }
            });

            alert('Perfil atualizado com sucesso!');
        } catch (error: any) {
            console.error('Error saving profile:', error);
            alert('Erro ao salvar perfil: ' + error.message);
        } finally {
            setSavingProfile(false);
        }
    };

    const handleSaveEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSavingEmail(true);

        try {
            const { error: authError } = await supabase.auth.updateUser({
                email: email
            });

            if (authError) {
                if (authError.message.includes('already registered')) {
                    throw new Error('Este email já está sendo usado por outra conta.');
                }
                throw authError;
            }

            alert('Email de login atualizado com sucesso! (Verifique sua caixa de entrada no novo email para confirmar).');
        } catch (error: any) {
            console.error('Error saving email:', error);
            alert('Erro ao salvar email: ' + error.message);
        } finally {
            setSavingEmail(false);
        }
    };

    const handleSavePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (password !== confirmPassword) {
            alert('As senhas não coincidem.');
            return;
        }

        if (password.length < 6) {
            alert('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setSavingPassword(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            alert('Senha atualizada com sucesso!');
            setPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Error saving password:', error);
            alert('Erro ao atualizar senha: ' + error.message);
        } finally {
            setSavingPassword(false);
        }
    };

    const handleOpenModal = (item: OrderItem) => {
        setSelectedOrderItem(item);
        setIsModalOpen(true);
    };

    const handleSubmitForm = async (formData: ProductionFormData) => {
        if (!selectedOrderItem) return;

        // If the item was pending_form, move it to in_production.
        // Otherwise, it might be an edit for an item already in_production or delivered, so we keep the existing status.
        const newStatus = (!selectedOrderItem.production_status || selectedOrderItem.production_status === 'pending_form')
            ? 'in_production'
            : selectedOrderItem.production_status;

        const { error } = await supabase
            .from('order_items')
            .update({
                production_status: newStatus,
                production_form_data: formData
            })
            .eq('id', selectedOrderItem.id);

        if (error) throw error;

        // Reload data to reflect status change
        if (user) loadData(user.id);
    };

    const handleWatchDelivered = (url: string) => {
        let finalUrl = url;
        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
            finalUrl = `https://${url}`;
        }
        window.open(finalUrl, '_blank', 'noopener,noreferrer');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const handleOpenPixModal = (order: Order) => {
        setSelectedPixOrder(order);
        setIsPixModalOpen(true);
    };

    const paidOrderItems = myOrders
        .filter(o => o.status === 'paid')
        .flatMap(o => o.order_items || [])
        .map(item => {
            // Find the parent order to pass dates if needed
            const parentOrder = myOrders.find(o => o.id === item.order_id);
            return { ...item, order_date: parentOrder?.created_at };
        });

    if (loading && !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-dark flex flex-col font-sans text-gray-100">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
                <div className="flex justify-between items-center mb-8 border-b border-brand-red/30 pb-6">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-heading uppercase italic tracking-wider text-white">Minha Conta</h1>
                    <button
                        onClick={handleLogout}
                        className="flex items-center text-gray-400 hover:text-brand-red transition-colors font-bold uppercase tracking-wide"
                    >
                        <LogOut className="w-5 h-5 mr-2" />
                        Sair
                    </button>
                </div>

                <div className="flex space-x-4 mb-8">
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`pb-4 px-2 font-black font-heading uppercase italic tracking-widest text-lg flex items-center transition-all border-b-2 ${activeTab === 'orders' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        <Package className="w-5 h-5 mr-2" />
                        Meus Pedidos
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`pb-4 px-2 font-black font-heading uppercase italic tracking-widest text-lg flex items-center transition-all border-b-2 ${activeTab === 'settings' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        <Settings className="w-5 h-5 mr-2" />
                        Configurações
                    </button>
                </div>

                {activeTab === 'orders' ? (
                    <>
                        <h2 className="text-xl font-black font-heading uppercase tracking-widest text-white mb-6 flex items-center bg-black/40 p-4 rounded-xl border border-brand-red/10 w-fit inline-flex">
                            <Edit3 className="w-6 h-6 mr-3 text-brand-orange" />
                            Minhas Edições e Highlights
                        </h2>

                        {paidOrderItems.length === 0 ? (
                            <div className="text-center py-20 bg-black rounded-2xl border border-brand-red/20 shadow-sm mb-12">
                                <p className="text-gray-400 mb-6 font-medium">Você ainda não possui pacotes de edição pagos.</p>
                                <button
                                    onClick={() => navigate('/')}
                                    className="px-6 py-3 bg-gradient-to-r from-brand-red to-brand-orange text-white rounded-lg font-black font-heading uppercase italic tracking-widest hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all"
                                >
                                    Ver Catálogo de Eventos
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                                {paidOrderItems.map(item => (
                                    <div key={item.id} className="bg-black rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-brand-red/20 p-6 flex flex-col hover:border-brand-orange transition-colors">
                                        <div className="mb-4 flex-grow">
                                            <h3 className="font-bold font-heading uppercase tracking-wide text-white mb-1 line-clamp-2">
                                                {item.videos?.title || 'Pacote de Highlight'}
                                            </h3>

                                            {/* Status Badge */}
                                            <div className="mt-3">
                                                {(!item.production_status || item.production_status === 'pending_form') && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-brand-red/20 text-brand-orange border border-brand-orange/30">
                                                        Ação Necessária
                                                    </span>
                                                )}
                                                {item.production_status === 'in_production' && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-900/40 text-blue-400 border border-blue-500/30">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        Em Produção
                                                    </span>
                                                )}
                                                {item.production_status === 'delivered' && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-900/40 text-green-400 border border-green-500/30">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Entregue
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-brand-red/20 mt-auto flex flex-col gap-2">
                                            {(!item.production_status || item.production_status === 'pending_form') && (
                                                <button
                                                    onClick={() => handleOpenModal(item)}
                                                    className="w-full py-2.5 bg-gradient-to-r from-brand-red to-brand-orange text-white rounded-lg font-black font-heading uppercase tracking-widest hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                    Preencher Dados da Luta
                                                </button>
                                            )}
                                            {item.production_status === 'in_production' && (
                                                <>
                                                    <div className="w-full py-2.5 bg-brand-dark border border-brand-red/10 text-brand-orange rounded-lg font-bold text-center text-sm cursor-not-allowed uppercase font-heading">
                                                        Aguarde... Equipando luvas!
                                                    </div>
                                                    <button
                                                        onClick={() => handleOpenModal(item)}
                                                        className="w-full py-2 text-sm text-gray-400 hover:text-white font-bold flex items-center justify-center gap-2 transition-colors uppercase font-heading tracking-wider"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                        Alterar Informações
                                                    </button>
                                                </>
                                            )}
                                            {item.production_status === 'delivered' && (
                                                <>
                                                    <button
                                                        onClick={() => handleWatchDelivered(item.delivered_video_url || '#')}
                                                        className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-black font-heading uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                        Acessar / Baixar
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(item)}
                                                        className="w-full py-2 text-sm text-gray-400 hover:text-white font-bold flex items-center justify-center gap-2 transition-colors uppercase font-heading"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                        Revisar Informações
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <h2 className="text-xl font-black font-heading uppercase tracking-widest text-white mb-6 flex items-center bg-black/40 p-4 rounded-xl border border-brand-red/10 w-fit inline-flex">
                            <Package className="w-6 h-6 mr-3 text-brand-orange" />
                            Histórico de Pedidos
                        </h2>

                        <div className="bg-black rounded-2xl shadow-lg border border-brand-red/20 overflow-hidden">
                            {myOrders.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 font-medium font-heading uppercase tracking-wider">
                                    Nenhum pedido encontrado.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-brand-dark border-b border-brand-red/30">
                                                <th className="p-4 font-black font-heading uppercase tracking-widest text-white text-xs">Pedido</th>
                                                <th className="p-4 font-black font-heading uppercase tracking-widest text-white text-xs">Data</th>
                                                <th className="p-4 font-black font-heading uppercase tracking-widest text-white text-xs">Itens</th>
                                                <th className="p-4 font-black font-heading uppercase tracking-widest text-white text-xs">Status</th>
                                                <th className="p-4 font-black font-heading uppercase tracking-widest text-white text-xs text-right">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myOrders.map(order => (
                                                <tr key={order.id} className="border-b border-brand-red/10 hover:bg-brand-dark/50 transition-colors">
                                                    <td className="p-4 text-sm font-mono text-brand-orange uppercase">
                                                        #{order.id.substring(0, 8)}
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-400 font-medium">
                                                        {new Date(order.created_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-200 font-bold uppercase font-heading tracking-wide">
                                                        {order.order_items?.map((item: any, idx: number) => (
                                                            <div key={idx} className="line-clamp-1">
                                                                {item.videos?.title || 'Ingresso / Vídeo'}
                                                            </div>
                                                        ))}
                                                    </td>
                                                    <td className="p-4">
                                                        {order.status === 'paid' && (
                                                            <span className="px-3 py-1 bg-green-900/40 border border-green-500/30 text-green-400 rounded-lg text-xs font-bold uppercase tracking-wider">Aprovado</span>
                                                        )}
                                                        {order.status === 'pending' && (
                                                            <div className="flex flex-col gap-2 items-start">
                                                                <span className="px-3 py-1 bg-yellow-900/40 border border-yellow-500/30 text-yellow-400 rounded-lg text-xs font-bold uppercase tracking-wider">Aguardando</span>
                                                                {order.payment_method === 'pix' && order.pix_qr_code && (
                                                                    <button
                                                                        onClick={() => handleOpenPixModal(order)}
                                                                        className="text-xs px-3 py-1.5 bg-brand-orange text-white rounded font-bold hover:bg-brand-red transition-colors mt-1 uppercase tracking-wider shadow-sm"
                                                                    >
                                                                        Pagar Agora
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                        {(order.status === 'canceled' || order.status === 'failed') && (
                                                            <span className="px-3 py-1 bg-brand-red/20 text-brand-orange border border-brand-orange/30 rounded-lg text-xs font-bold uppercase tracking-wider">Cancelado</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-right font-black text-white tracking-widest">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="max-w-3xl space-y-8">
                        {/* Acesso Form */}
                        <div className="bg-black rounded-2xl shadow-lg border border-brand-red/20 p-5 sm:p-8">
                            <h2 className="text-xl sm:text-2xl font-black font-heading uppercase italic tracking-widest text-white mb-6">Acesso e Segurança</h2>
                            <form onSubmit={handleSaveEmail} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold font-heading uppercase tracking-wider text-gray-300 mb-2">Email de Login</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 bg-brand-dark border border-brand-red/20 text-white rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                    <p className="text-xs text-brand-orange/80 mt-2 font-medium">Nós enviaremos uma confirmação para seu novo email se ele for alterado antes de efetivar a mudança.</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={savingEmail}
                                    className="px-6 py-3 bg-gradient-to-r from-brand-red to-brand-orange text-white rounded-xl font-black font-heading uppercase tracking-widest text-sm hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed w-fit"
                                >
                                    {savingEmail ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Atualizando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Atualizar Email
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Senha Form */}
                        <div className="bg-black rounded-2xl shadow-lg border border-brand-red/20 p-5 sm:p-8">
                            <h2 className="text-xl sm:text-2xl font-black font-heading uppercase italic tracking-widest text-white mb-6">Alterar Senha</h2>
                            <form onSubmit={handleSavePassword} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold font-heading uppercase tracking-wider text-gray-300 mb-2">Nova Senha</label>
                                    <input
                                        type="password"
                                        className="w-full px-4 py-3 bg-brand-dark border border-brand-red/20 text-white rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Min. 6 caracteres"
                                        minLength={6}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold font-heading uppercase tracking-wider text-gray-300 mb-2">Confirmar Nova Senha</label>
                                    <input
                                        type="password"
                                        className="w-full px-4 py-3 bg-brand-dark border border-brand-red/20 text-white rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="Confirme a nova senha"
                                        minLength={6}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={savingPassword || !password || !confirmPassword || password !== confirmPassword}
                                    className="px-6 py-3 bg-gradient-to-r from-brand-red to-brand-orange text-white rounded-xl font-black font-heading uppercase tracking-widest text-sm hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed w-fit"
                                >
                                    {savingPassword ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Atualizando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Atualizar Senha
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Dados Pessoais Form */}
                        <div className="bg-black rounded-2xl shadow-lg border border-brand-red/20 p-5 sm:p-8">
                            <h2 className="text-xl sm:text-2xl font-black font-heading uppercase italic tracking-widest text-white mb-6">Dados Pessoais</h2>
                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold font-heading uppercase tracking-wider text-gray-300 mb-2">Nome Completo</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-brand-dark border border-brand-red/20 text-white rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                        value={profile.full_name}
                                        onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold font-heading uppercase tracking-wider text-gray-300 mb-2">WhatsApp</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-brand-dark border border-brand-red/20 text-white rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                        value={profile.whatsapp}
                                        placeholder="(11) 99999-9999"
                                        onChange={e => setProfile({ ...profile, whatsapp: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold font-heading uppercase tracking-wider text-gray-300 mb-2">CPF</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-brand-dark border border-brand-red/20 text-white rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all placeholder:text-gray-600"
                                        value={profile.cpf}
                                        placeholder="000.000.000-00"
                                        onChange={e => setProfile({ ...profile, cpf: e.target.value })}
                                    />
                                    <p className="text-xs text-brand-orange/80 mt-2 font-medium">O CPF é necessário para emissão de comprovantes pelos gateways de pagamento.</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={savingProfile}
                                    className="px-8 py-3.5 bg-gradient-to-r from-brand-red to-brand-orange text-white rounded-xl font-black font-heading uppercase tracking-widest hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
                                >
                                    {savingProfile ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            Salvar Dados Pessoais
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </main>

            {selectedOrderItem && (
                <ProductionDetailsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleSubmitForm}
                    initialData={selectedOrderItem.production_form_data || undefined}
                />
            )}

            {selectedPixOrder && selectedPixOrder.pix_qr_code && (
                <PixPaymentModal
                    isOpen={isPixModalOpen}
                    onClose={() => setIsPixModalOpen(false)}
                    qrCode={selectedPixOrder.pix_qr_code}
                    qrCodeUrl={selectedPixOrder.pix_qr_code_url || null}
                />
            )}
        </div>
    );
}
