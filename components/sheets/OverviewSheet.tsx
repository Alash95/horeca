import { useMemo, FC } from 'react';
import type { MenuItem, Filters, TimeSelection } from '../../types';
import { formatNumber } from '../../utils/formatters';
import { formatPeriod } from '../../utils/timeUtils';
import MetricCard from '../MetricCard';
import BrandPerformanceChart from '../charts/BrandPerformanceChart';
import BrandOwnerPerformanceChart from '../charts/BrandOwnerPerformanceChart';
import CocktailPopularity from '../CocktailPopularity';
import BrandOwnerShareChart from '../charts/BrandOwnerShareChart';
import ChannelDistribution from '../ChannelDistribution';
import { useLanguage } from '../../context/LanguageContext';

interface OverviewSheetProps {
    primaryPeriodData: MenuItem[];
    comparisonPeriodData: MenuItem[];
    allData: MenuItem[];
    allInComparisonPeriod: MenuItem[];
    filters: Filters;
    timeSelection: TimeSelection;
    handleFilterChange: (filterName: keyof Filters, value: any) => void;
    averagePrice: number;
}

const OverviewSheet: FC<OverviewSheetProps> = ({ primaryPeriodData, comparisonPeriodData, allData, allInComparisonPeriod, filters, timeSelection, handleFilterChange }) => {
    const { language, t } = useLanguage();

    const metrics = useMemo(() => {
        const calcMetrics = (data: MenuItem[]) => {
            if (data.length === 0) {
                return { totalListings: 0, uniqueBrands: 0, uniqueVenues: 0, totalBrandOwners: 0, totalCocktails: 0 };
            }
            // 🎯 FIX: Use venueId (mapped from NomeLocale) for unique venues.
            const allVenues = new Set(data.map(d => d.venueId).filter(Boolean));

            // 🎯 UNIQUE BRANDS: From ingredients_brand
            const uniqueBrands = new Set(data.map(d => d.brand).filter(v => v && v !== 'Unknown Brand' && v !== 'Generic')).size;

            // 🎯 COCKTAILS: Use name identifiers
            const uniqueCocktails = new Set(
                data.filter(d =>
                    (d.macroCategoria === 'SPIRITS' && d.categoriaProdotto === 'COCKTAILS') ||
                    (d.nomeCocktail && d.nomeCocktail !== 'N/A' && d.nomeCocktail !== 'General Item')
                ).map(d => d.nomeCocktail)
            );

            return {
                uniqueVenues: allVenues.size,
                uniqueBrands: uniqueBrands,
                totalListings: data.length,
                totalBrandOwners: new Set(data.map(d => d.brandOwner).filter(v => v && v !== 'Unknown Owner' && v !== 'Unknown')).size,
                totalCocktails: uniqueCocktails.size
            };
        };
        return {
            primary: calcMetrics(primaryPeriodData),
            comparison: calcMetrics(comparisonPeriodData),
        };
    }, [primaryPeriodData, comparisonPeriodData]);

    const comparisonLabel = timeSelection.mode !== 'none' ? formatPeriod(timeSelection.periodB, timeSelection.mode, language) : undefined;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <MetricCard
                    title={t('uniqueVenues')}
                    primaryValue={formatNumber(metrics.primary.uniqueVenues, 0)}
                    comparisonValue={metrics.comparison.uniqueVenues}
                    comparisonLabel={comparisonLabel}
                />
                <MetricCard
                    title={t('uniqueBrands')}
                    primaryValue={formatNumber(metrics.primary.uniqueBrands, 0)}
                    comparisonValue={metrics.comparison.uniqueBrands}
                    comparisonLabel={comparisonLabel}
                />
                <MetricCard
                    title={t('totalBrandOwners')}
                    primaryValue={formatNumber(metrics.primary.totalBrandOwners, 0)}
                    comparisonValue={metrics.comparison.totalBrandOwners}
                    comparisonLabel={comparisonLabel}
                />
                <MetricCard
                    title={t('totalBrandsListings')}
                    primaryValue={formatNumber(metrics.primary.totalListings, 0)}
                    comparisonValue={metrics.comparison.totalListings}
                    comparisonLabel={comparisonLabel}
                />
                <MetricCard
                    title={t('totalCocktails')}
                    primaryValue={formatNumber(metrics.primary.totalCocktails, 0)}
                    comparisonValue={metrics.comparison.totalCocktails}
                    comparisonLabel={comparisonLabel}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <BrandOwnerPerformanceChart
                    primaryData={primaryPeriodData}
                    comparisonData={comparisonPeriodData}
                    allInPrimaryPeriod={allData}
                    allInComparisonPeriod={allInComparisonPeriod}
                    filters={filters}
                    timeSelection={timeSelection}
                    onFilter={value => handleFilterChange('brandOwner', value)}
                />
                <BrandPerformanceChart
                    allData={allData}
                    allInComparisonPeriod={allInComparisonPeriod}
                    primaryData={primaryPeriodData}
                    comparisonData={comparisonPeriodData}
                    filters={filters}
                    timeSelection={timeSelection}
                    onFilter={value => handleFilterChange('brand', value)}
                />
                <BrandOwnerShareChart
                    data={primaryPeriodData}
                    timeSelection={timeSelection}
                    onFilter={value => handleFilterChange('brandOwner', value)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CocktailPopularity data={primaryPeriodData} />
                <ChannelDistribution data={primaryPeriodData} />
            </div>
        </div>
    );
};

export default OverviewSheet;