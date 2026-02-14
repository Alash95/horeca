import { FC } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface MetricCardProps {
    title: string;
    primaryValue: string;
    comparisonValue?: number;
    comparisonLabel?: string;
    subtitle?: string;
    className?: string;
}

const MetricCard: FC<MetricCardProps> = ({ title, primaryValue, comparisonValue, comparisonLabel, subtitle, className = '' }) => {
    const { t } = useLanguage();
    const primaryNumeric = parseFloat(primaryValue.replace(/[^0-9.-]+/g, ''));
    let change: number | null = null;
    if (comparisonValue !== undefined && comparisonValue !== null && comparisonValue !== 0) {
        change = ((primaryNumeric - comparisonValue) / comparisonValue) * 100;
    }

    const ChangeIndicator = () => {
        if (change === null || isNaN(change) || !isFinite(change)) return null;

        const isPositive = change > 0;
        const color = isPositive ? 'text-green-400' : 'text-red-400';
        const arrow = isPositive ? '▲' : '▼';

        return (
            <div className={`mt-2 text-xs flex items-center font-medium ${color}`}>
                <span>{arrow} {Math.abs(change).toFixed(1)}%</span>
                <span className="text-gray-400 ml-1">{t('vs')} {comparisonLabel}</span>
            </div>
        );
    };

    return (
        <div className={`bg-gray-800 p-4 rounded-lg shadow-lg ${className}`}>
            <h3 className="text-sm font-medium text-gray-400 truncate">{title}</h3>
            <p className="mt-1 text-3xl font-semibold text-white">{primaryValue}</p>
            {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
            <ChangeIndicator />
        </div>
    );
};

export default MetricCard;
