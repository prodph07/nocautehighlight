import { supabase } from '../lib/supabase';

export interface AppSettings {
    full_fight_upsell_price: number;
}

const DEFAULT_SETTINGS: AppSettings = {
    full_fight_upsell_price: 20
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

    async updateSettings(settings: Partial<AppSettings>): Promise<boolean> {
        try {
            // Fetch current to merge
            const current = await this.getSettings();
            const newSettings = { ...current, ...settings };

            const { error } = await supabase
                .from('settings')
                .update({ value: newSettings, updated_at: new Date().toISOString() })
                .eq('id', 'global');

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating settings:', error);
            return false;
        }
    }
};
