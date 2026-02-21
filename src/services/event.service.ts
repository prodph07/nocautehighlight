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

    async create(event: Partial<Event>): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('events')
                .insert(event);

            if (error) {
                console.error('Error creating event:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Unexpected error in create event:', error);
            return false;
        }
    },

    async update(id: string, updates: Partial<Event>): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('events')
                .update(updates)
                .eq('id', id);

            if (error) {
                console.error('Error updating event:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Unexpected error in update event:', error);
            return false;
        }
    }
};
