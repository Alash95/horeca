import React, { useMemo } from 'react';
import type { MenuItem, Filters, TimeSelection } from '../../types';
import { formatPeriod } from '../../utils/timeUtils';
import RegionDistributionChart from '../charts/RegionDistributionChart';
import CategoryPerformanceChart from '../charts/CategoryPerformanceChart';
import BrandOwnerPerformanceChart from '../charts/BrandOwnerPerformanceChart';
import PortfolioAnalysis from '../PortfolioAnalysis';
import ChannelPenetrationMetrics from '../ChannelPenetrationMetrics';
import ChannelPenetrationChart from '../charts/ChannelPenetrationChart';
import BrandOwnerVenueTable from '../BrandOwnerVenueTable';
import CompetitorHeatmap from '../CompetitorHeatmap';
import ErrorBoundary from '../ErrorBoundary';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataProvider';

interface BrandOwnerSheetProps {
    primaryPeriodData: MenuItem[];
    comparisonPeriodData: MenuItem[];
    allData: MenuItem[];
    filters: Filters;
    timeSelection: TimeSelection;
    handleFilterChange: (filterName: keyof Filters, value: any) => void;
}

const BrandOwnerSheet: React.FC<BrandOwnerSheetProps> = ({ primaryPeriodData, comparisonPeriodData, allData, filters, timeSelection, handleFilterChange }) => {
    const { language, t } = useLanguage();
    const { enrichedData: nationalUniverse, fullUniverse, marketBenchmarks } = useData();

    const dataForBrandOwnerChart = useMemo(() => {
        return (timeSelection.mode === 'none' ? allData : primaryPeriodData)
            .filter(i => filters.macroCategoria.length === 0 || (i.macroCategoria && filters.macroCategoria.includes(i.macroCategoria)));
    }, [allData, primaryPeriodData, timeSelection.mode, filters.macroCategoria]);

    // 2. Calculate Context Universe (Filtered by Region, Client Type, etc., but NOT Brand/Owner)
    // 🎯 CRITICAL: Use fullUniverse (unfiltered by permissions) to ensure market context for competitors
    const contextUniverse = useMemo(() => {
        return fullUniverse.filter(item => {
            return (
                (filters.regione.length === 0 || (item.regione && filters.regione.includes(item.regione))) &&
                (filters.citta.length === 0 || (item.citta && filters.citta.includes(item.citta))) &&
                (filters.tipologiaCliente.length === 0 || (item.tipologiaCliente && filters.tipologiaCliente.includes(item.tipologiaCliente))) &&
                (filters.macroCategoria.length === 0 || (item.macroCategoria && filters.macroCategoria.includes(item.macroCategoria))) &&
                (filters.categoriaProdotto.length === 0 || (item.categoriaProdotto && filters.categoriaProdotto.includes(item.categoriaProdotto)))
            );
        });
    }, [fullUniverse, filters]);

    // For "selectedBrandOwner", if multi-select just take the summary or handle plurality
    const selectedBrandOwners = filters.brandOwner;
    const isMultiSelect = selectedBrandOwners.length > 1;
    const firstOwner = selectedBrandOwners[0];

    if (selectedBrandOwners.length === 0) {
        return (
            <div className="space-y-6">
                <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center border-2 border-dashed border-gray-700">
                    <h2 className="text-xl font-semibold text-white">{t('selectBrandOwner')}</h2>
                    <p className="mt-2 text-gray-400">{t('selectBrandOwnerDesc')}</p>
                </div>
                <BrandOwnerPerformanceChart
                    primaryData={dataForBrandOwnerChart}
                    comparisonData={comparisonPeriodData.filter(i => filters.macroCategoria.length === 0 || (i.macroCategoria && filters.macroCategoria.includes(i.macroCategoria)))}
                    allInPrimaryPeriod={nationalUniverse}
                    allInComparisonPeriod={comparisonPeriodData}
                    filters={filters}
                    timeSelection={timeSelection}
                    onFilter={value => handleFilterChange('brandOwner', value)}
                />
            </div>
        );
    }

    const comparisonDataForOwner = comparisonPeriodData.filter(item => selectedBrandOwners.includes(item.brandOwner || ''));

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-teal-400">
                {t('deepDive')}: {isMultiSelect ? `${selectedBrandOwners.length} ${t('brandOwners')}` : firstOwner}
                {isMultiSelect && <span className="text-sm font-normal text-gray-400 ml-4">({selectedBrandOwners.join(', ')})</span>}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <RegionDistributionChart
                        allData={nationalUniverse}
                        selectedBrandOwner={selectedBrandOwners}
                        filters={filters}
                        onRegionSelect={value => handleFilterChange('regione', value)}
                    />
                </div>
                <div className="lg:col-span-1">
                    <CategoryPerformanceChart
                        data={primaryPeriodData}
                        onFilter={value => handleFilterChange('categoriaProdotto', value)}
                        timeSelection={timeSelection}
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
                <PortfolioAnalysis
                    ownerData={primaryPeriodData}
                    comparisonOwnerData={comparisonDataForOwner}
                    allDataInPeriod={contextUniverse}
                    ownerName={isMultiSelect ? `${selectedBrandOwners.length} Owners` : firstOwner}
                    subtitle={timeSelection.mode !== 'none' ? `${t('dataFor')} ${formatPeriod(timeSelection.periodA, timeSelection.mode, language)}` : undefined}
                    marketBenchmarks={marketBenchmarks}
                    filters={filters}
                />
            </div>
            <div className="grid grid-cols-1 gap-6">
                <ChannelPenetrationMetrics
                    allData={contextUniverse}
                    ownerData={primaryPeriodData.filter(i => selectedBrandOwners.includes(i.brandOwner || ''))}
                    ownerName={isMultiSelect ? 'Selected Group' : (firstOwner || '')}
                    filters={filters}
                    onBrandOwnerClick={(brandOwner) => handleFilterChange('brandOwner', [brandOwner])}
                />
                <ChannelPenetrationChart
                    allData={contextUniverse}
                    ownerData={primaryPeriodData.filter(i => selectedBrandOwners.includes(i.brandOwner || ''))}
                    ownerName={isMultiSelect ? 'Selected Group' : (firstOwner || '')}
                    timeSelection={timeSelection}
                    filters={filters}
                />
            </div>

            {filters.regione.length > 0 && (
                <div className="grid grid-cols-1 gap-6">
                    <ErrorBoundary>
                        <CompetitorHeatmap
                            data={contextUniverse}
                            primaryEntity={isMultiSelect ? selectedBrandOwners : (firstOwner || '')}
                            entityType="brandOwner"
                            rowType="citta"
                            title={`${t('competitiveLandscape')} in ${filters.regione.join(', ')} (${t('city')})`}
                        />
                    </ErrorBoundary>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                <ErrorBoundary>
                    <BrandOwnerVenueTable
                        data={contextUniverse}
                        brandOwner={isMultiSelect ? selectedBrandOwners : (firstOwner || '')}
                        title={isMultiSelect ? `${t('venuesFor')} ${selectedBrandOwners.length} Owners` : `${t('venuesFor')} ${firstOwner}`}
                    />
                </ErrorBoundary>
            </div>
        </div>
    );
};

export default BrandOwnerSheet;