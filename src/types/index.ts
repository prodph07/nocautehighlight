export interface Profile {
    id: string;
    email: string;
    full_name?: string;
    whatsapp?: string;
    cpf?: string;
    created_at: string;
}

export interface Event {
    id: string;
    title: string;
    slug: string;
    fight_date: string;
    location?: string;
    banner_url?: string;
    drive_link?: string;
    is_active: boolean;
    created_at?: string;
}

export interface Video {
    id: string;
    event_id?: string; // Optional for now to support legacy/transition
    title: string;
    slug: string;
    event_name: string; // Deprecated but kept for compatibility
    fight_date: string;
    category: string;
    modality: string;
    tags: string[];
    teaser_url: string;
    price_highlight: number;
    price_full_bundle: number;
    // Drive IDs são omitidos aqui pois não vêm na query pública padrão
    is_active: boolean;
}

export type PaymentMethod = 'pix';
export type OrderStatus = 'pending' | 'paid' | 'canceled' | 'failed';

export type ProductionStatus = 'pending_form' | 'in_production' | 'delivered';

export interface ProductionFormData {
    fighterName: string;
    age: string;
    instagram: string;
    email: string;
    roundsCount: string;
    musicLink: string;
    contact1: string;
    contact2: string;
    cornerColor: string;
    team: string;
    opponentName: string;
    notes: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    video_id: string;
    access_level: string;
    production_status: ProductionStatus;
    production_form_data?: ProductionFormData;
    delivered_video_url?: string;
    videos?: Video;
}

export interface Order {
    id: string;
    user_id: string;
    status: OrderStatus;
    gateway_id?: string;
    payment_method: PaymentMethod;
    total_amount: number;
    created_at: string;
    pix_qr_code?: string;
    pix_qr_code_url?: string;
    order_items?: OrderItem[];
}

// Interface auxiliar para uso nos componentes (compatibilidade com EventCard atual)
// Vamos estender a interface Video para ter propriedades visuais que usamos no frontend
export interface FightEvent extends Video {
    thumbnailUrl: string; // Mapeado de teaser_url
    description?: string; // Pode ser derivado de tags ou adicionado ao banco
}
