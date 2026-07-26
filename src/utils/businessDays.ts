/**
 * Utility for calculating Brazilian Business Days (Dias Úteis) and Order Deadline status.
 * Excludes weekends (Saturdays and Sundays) and official Brazilian National Holidays.
 */

// Helper to compute Easter Sunday for any year
function getEasterSunday(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const L = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * L) / 451);
    const month = Math.floor((h + L - 7 * m + 114) / 31); // 3 = March, 4 = April
    const day = ((h + L - 7 * m + 114) % 31) + 1;

    return new Date(year, month - 1, day);
}

// Get all Brazilian national holiday date strings (YYYY-MM-DD) for a given year
export function getBrazilianHolidays(year: number): Set<string> {
    const holidays = new Set<string>();

    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatDate = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

    // Fixed National Holidays
    holidays.add(formatDate(year, 1, 1));   // Confraternização Universal
    holidays.add(formatDate(year, 4, 21));  // Tiradentes
    holidays.add(formatDate(year, 5, 1));   // Dia do Trabalho
    holidays.add(formatDate(year, 9, 7));   // Independência do Brasil
    holidays.add(formatDate(year, 10, 12)); // Nossa Senhora Aparecida
    holidays.add(formatDate(year, 11, 2));  // Finados
    holidays.add(formatDate(year, 11, 15)); // Proclamação da República
    holidays.add(formatDate(year, 11, 20)); // Dia da Consciência Negra
    holidays.add(formatDate(year, 12, 25)); // Natal

    // Dynamic Easter-based Holidays
    const easter = getEasterSunday(year);

    const addDays = (base: Date, days: number) => {
        const d = new Date(base);
        d.setDate(d.getDate() + days);
        return formatDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
    };

    holidays.add(addDays(easter, -48)); // Carnaval (Segunda)
    holidays.add(addDays(easter, -47)); // Carnaval (Terça)
    holidays.add(addDays(easter, -2));  // Sexta-feira Santa
    holidays.add(addDays(easter, 60));  // Corpus Christi

    return holidays;
}

export function isBusinessDay(date: Date): boolean {
    const dayOfWeek = date.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return false;
    }

    const year = date.getFullYear();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${year}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

    const holidays = getBrazilianHolidays(year);
    return !holidays.has(dateStr);
}

/**
 * Calculates deadline Date after N business days from start Date.
 */
export function addBusinessDays(startDate: Date, businessDaysToAdd: number): Date {
    const current = new Date(startDate);
    let added = 0;

    while (added < businessDaysToAdd) {
        current.setDate(current.getDate() + 1);
        if (isBusinessDay(current)) {
            added++;
        }
    }

    return current;
}

/**
 * Calculates remaining business days between two dates.
 */
export function countBusinessDaysBetween(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Normalize to midnight
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (start.getTime() === end.getTime()) return 0;

    const isForward = end > start;
    let count = 0;
    const current = new Date(start);

    while (isForward ? current < end : current > end) {
        current.setDate(current.getDate() + (isForward ? 1 : -1));
        if (isBusinessDay(current)) {
            count++;
        }
    }

    return isForward ? count : -count;
}

export interface DeadlineStatus {
    remainingDays: number;
    deadlineDate: Date;
    status: 'ok' | 'warning' | 'urgent' | 'today' | 'overdue';
    label: string;
    badgeStyle: string;
}

/**
 * Calculates delivery deadline status for a given order creation date (7 business days limit).
 */
export function calculateDeliveryDeadline(createdDateStr: string, limitBusinessDays: number = 7): DeadlineStatus {
    const createdDate = new Date(createdDateStr);
    const deadlineDate = addBusinessDays(createdDate, limitBusinessDays);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineMidnight = new Date(deadlineDate);
    deadlineMidnight.setHours(0, 0, 0, 0);

    const remainingDays = countBusinessDaysBetween(today, deadlineMidnight);

    if (remainingDays > 3) {
        return {
            remainingDays,
            deadlineDate,
            status: 'ok',
            label: `${remainingDays} dias úteis restantes`,
            badgeStyle: 'bg-blue-900/40 text-blue-400 border-blue-500/30'
        };
    } else if (remainingDays === 3 || remainingDays === 2) {
        return {
            remainingDays,
            deadlineDate,
            status: 'warning',
            label: `${remainingDays} dias úteis restantes`,
            badgeStyle: 'bg-yellow-900/40 text-yellow-400 border-yellow-500/30'
        };
    } else if (remainingDays === 1) {
        return {
            remainingDays,
            deadlineDate,
            status: 'urgent',
            label: `Apenas 1 dia útil!`,
            badgeStyle: 'bg-orange-900/40 text-orange-400 border-orange-500/30 animate-pulse'
        };
    } else if (remainingDays === 0) {
        return {
            remainingDays: 0,
            deadlineDate,
            status: 'today',
            label: `Vence Hoje! (Último Dia)`,
            badgeStyle: 'bg-brand-red text-white border-brand-orange animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.6)]'
        };
    } else {
        const overdueDays = Math.abs(remainingDays);
        return {
            remainingDays,
            deadlineDate,
            status: 'overdue',
            label: `Atrasado ${overdueDays} ${overdueDays === 1 ? 'dia útil' : 'dias úteis'}!`,
            badgeStyle: 'bg-red-950 text-red-400 border-red-500/80 font-black shadow-[0_0_15px_rgba(239,68,68,0.4)]'
        };
    }
}
