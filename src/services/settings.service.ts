import { supabase } from '../lib/supabase';

export interface AppSettings {
    full_fight_upsell_price: number;
    photo_only_price: number;
    photo_and_highlight_promo_price: number;
}

const DEFAULT_SETTINGS: AppSettings = {
    full_fight_upsell_price: 20,
    photo_only_price: 29.90,
    photo_and_highlight_promo_price: 49.90
};

export const SettingsService = {
    async getSettings(): Promise<AppSettings> {
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('value')
                .eq('id', 'global')
                .single();

            if (error) {
                console.error('Error fetching settings:', error);
                return DEFAULT_SETTINGS;
            }

            if (data && data.value) {
                return {
                    ...DEFAULT_SETTINGS,
                    ...data.value
                };
            }

            return DEFAULT_SETTINGS;
        } catch (error) {
            console.error('Failed to fetch settings, using defaults', error);
            return DEFAULT_SETTINGS;
        }
    },

    async updateSettings(settings: Partial<AppSettings>): Promise<{success: boolean, error?: string}> {
        try {
            // Fetch current to merge
            const current = await this.getSettings();
            const newSettings = { ...current, ...settings };

            const { error } = await supabase
                .from('settings')
                .upsert({ id: 'global', value: newSettings, updated_at: new Date().toISOString() });

            if (error) {
                console.error('Supabase Error updating settings:', error);
                return { success: false, error: error.message };
            }
            return { success: true };
        } catch (error: any) {
            console.error('Error updating settings:', error);
            return { success: false, error: error.message || 'Unknown error' };
        }
    }
};
