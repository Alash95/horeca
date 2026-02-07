/**
 * Formats a number with comma separators for thousands.
 * Wraps values to ensure they match database-like precision when needed,
 * but primarily adds commas for readability (e.g., 1,234.56).
 */
export const formatNumber = (val: number | string | undefined | null, decimals: number = 2): string => {
    if (val === undefined || val === null || val === '') return '0';

    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '0';

    // Use Intl.NumberFormat for locale-aware comma separation
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    }).format(num);
};
