import { supabase } from '../lib/supabase';
import { type Event } from '../types';

export const EventService = {
    async getAll(): Promise<Event[]> {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('is_active', true)
            .order('fight_date', { ascending: false });

        if (error) {
            console.error('Error fetching events:', error);
            return [];
        }
        return data || [];
    },

    async getBySlug(slug: string): Promise<Event | null> {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) {
            console.error('Error fetching event by slug:', error);
            return null;
        }
        return data;
    },

    async create(event: Partial<Event>): Promise<Event | null> {
        const { data, error } = await supabase
            .from('events')
            .insert(event)
            .select()
            .single();

        if (error) {
            console.error('Error creating event:', error);
            return null;
        }
        return data;
    }
};
