import type { MenuItem, TimeSelection } from '../types';

export const getAvailableYears = (data: MenuItem[]): number[] => {
    const years = new Set(data.map(item => new Date(item.data).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
};

export const getDateRangeForPeriod = (period: { year: number; quarter?: number }): { start: Date, end: Date } => {
    const { year, quarter } = period;

    if (quarter) {
        const startMonth = (quarter - 1) * 3;
        const startDate = new Date(year, startMonth, 1);
        const endDate = new Date(year, startMonth + 3, 0); // Day 0 of next month is the last day of current
        return { start: startDate, end: endDate };
    }

    // Full year
    return {
        start: new Date(year, 0, 1),
        end: new Date(year, 11, 31)
    };
};

export const formatPeriod = (period: { year: number; quarter?: number }, mode: TimeSelection['mode']): string => {
    if (mode === 'QoQ' && period.quarter) {
        return `Q${period.quarter} ${period.year}`;
    }
    return period.year.toString();
};
