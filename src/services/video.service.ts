import { supabase } from '../lib/supabase';
import { type FightEvent, type Video } from '../types';

export const VideoService = {
    async getAll(): Promise<FightEvent[]> {
        try {
            const { data, error } = await supabase
                .from('videos')
                .select('*')
                .eq('is_active', true)
                .order('fight_date', { ascending: false });

            if (error) {
                console.error('Error fetching videos:', error);
                return [];
            }

            if (!data || data.length === 0) {
                return [];
            }

            return data.map(mapDatabaseVideoToFightEvent);
        } catch (error) {
            console.error('Unexpected error in getAll:', error);
            return [];
        }
    },

    async search(query: string, filters?: VideoFilters): Promise<FightEvent[]> {
        try {
            let queryBuilder = supabase
                .from('videos')
                .select('*')
                .eq('is_active', true);

            if (query) {
                queryBuilder = queryBuilder.ilike('title', `%${query}%`);
            }

            if (filters?.category) {
                queryBuilder = queryBuilder.eq('category', filters.category);
            }

            if (filters?.modality) {
                queryBuilder = queryBuilder.eq('modality', filters.modality);
            }

            const { data, error } = await queryBuilder.order('fight_date', { ascending: false });

            if (error) {
                console.error('Error searching videos:', error);
                return [];
            }

            return data?.map(mapDatabaseVideoToFightEvent) || [];
        } catch (error) {
            console.error('Error in search:', error);
            return [];
        }
    },

    async getBySlug(slug: string): Promise<FightEvent | null> {
        try {
            const { data, error } = await supabase
                .from('videos')
                .select('*')
                .eq('slug', slug)
                .eq('is_active', true)
                .single();

            if (error) {
                console.error('Error fetching video by slug:', error);
                return null;
            }

            return data ? mapDatabaseVideoToFightEvent(data) : null;
        } catch (error) {
            console.error('Error in getBySlug:', error);
            return null;
        }
    },

    async getMyVideos(userId: string): Promise<FightEvent[]> {
        try {
            const { data, error } = await supabase
                .from('order_items')
                .select(`
                    *,
                    videos (*),
                    orders!inner (status, user_id)
                `)
                .eq('orders.user_id', userId)
                .in('orders.status', ['paid', 'pending']);

            if (error) throw error;

            const paidItems = data?.filter(item => item.orders.status === 'paid') || [];

            return paidItems.map(item => mapDatabaseVideoToFightEvent(item.videos as Video));
        } catch (error) {
            console.error('Error fetching my videos:', error);
            return [];
        }
    },

    async getMyOrders(userId: string): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id,
                    created_at,
                    status,
                    total_amount,
                    payment_method,
                    order_items (
                        id,
                        order_id,
                        production_status,
                        production_form_data,
                        delivered_video_url,
                        videos ( title )
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching orders:', error);
                return [];
            }
            return data || [];
        } catch (error) {
            console.error('Error in getMyOrders:', error);
            return [];
        }
    },

    async getVideoSource(videoId: string): Promise<{ highlight_id: string | null, full_fight_id: string | null }> {
        try {
            const { data, error } = await supabase.rpc('get_my_video_access', { p_video_id: videoId });

            if (error) throw error;

            if (data && data.length > 0) {
                return data[0];
            }
            return { highlight_id: null, full_fight_id: null };
        } catch (error) {
            console.error('Error getting video source:', error);
            return { highlight_id: null, full_fight_id: null };
        }
    },

    async getByEventId(eventId: string): Promise<FightEvent[]> {
        try {
            const { data, error } = await supabase
                .from('videos')
                .select('*')
                .eq('event_id', eventId)
                .eq('is_active', true)
                .order('price_highlight', { ascending: false }); // Show main fights (usually more expensive or just order by title/schedule) possibly

            if (error) {
                console.error('Error fetching videos by event:', error);
                return [];
            }
            return data?.map(mapDatabaseVideoToFightEvent) || [];
        } catch (error) {
            console.error('Error in getByEventId:', error);
            return [];
        }
    },
};

export interface VideoFilters {
    category?: string;
    modality?: string;
}

function mapDatabaseVideoToFightEvent(video: Video): FightEvent {
    return {
        ...video,
        thumbnailUrl: video.teaser_url || 'https://via.placeholder.com/640x360?text=No+Image',
        description: `Evento: ${video.event_name} - ${video.modality}`
    };
}
