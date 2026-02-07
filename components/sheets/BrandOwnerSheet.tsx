import React, { useMemo } from 'react';
import type { MenuItem, Filters, TimeSelection } from '../../types';
import { formatPeriod } from '../../utils/timeUtils';
import RegionDistributionChart from '../charts/RegionDistributionChart';
import CategoryPerformanceChart from '../charts/CategoryPerformanceChart';
import BrandOwnerPerformanceChart from '../charts/BrandOwnerPerformanceChart';
import PortfolioAnalysis from '../PortfolioAnalysis';
import ChannelPenetrationMetrics from '../ChannelPenetrationMetrics';
import BrandOwnerVenueTable from '../BrandOwnerVenueTable';
import CompetitorHeatmap from '../CompetitorHeatmap';
import ErrorBoundary from '../ErrorBoundary';

interface BrandOwnerSheetProps {
    primaryPeriodData: MenuItem[];
    comparisonPeriodData: MenuItem[];
    allData: MenuItem[];
    filters: Filters;
    timeSelection: TimeSelection;
    handleFilterChange: (filterName: keyof Filters, value: any) => void;
}

const BrandOwnerSheet: React.FC<BrandOwnerSheetProps> = ({ primaryPeriodData, comparisonPeriodData, allData, filters, timeSelection, handleFilterChange }) => {

    const dataForBrandOwnerChart = useMemo(() => {
        return (timeSelection.mode === 'none' ? allData : primaryPeriodData)
            .filter(i => filters.macroCategoria.length === 0 || (i.macroCategoria && filters.macroCategoria.includes(i.macroCategoria)));
    }, [allData, primaryPeriodData, timeSelection.mode, filters.macroCategoria]);

    const nationalUniverse = useMemo(() => {
        return allData;
    }, [allData]);

    // 2. Calculate Context Universe (Filtered by Region, Client Type, etc., but NOT Brand/Owner)
    const contextUniverse = useMemo(() => {
        return nationalUniverse.filter(item => {
            return (
                (filters.regione.length === 0 || (item.regione && filters.regione.includes(item.regione))) &&
                (filters.citta.length === 0 || (item.citta && filters.citta.includes(item.citta))) &&
                (filters.tipologiaCliente.length === 0 || (item.tipologiaCliente && filters.tipologiaCliente.includes(item.tipologiaCliente))) &&
                (filters.macroCategoria.length === 0 || (item.macroCategoria && filters.macroCategoria.includes(item.macroCategoria))) &&
                (filters.categoriaProdotto.length === 0 || (item.categoriaProdotto && filters.categoriaProdotto.includes(item.categoriaProdotto)))
            );
        });
    }, [nationalUniverse, filters]);

    const opportunityData = useMemo(() => {
        if (filters.brandOwner.length === 0) return [];

        const currentVenues = new Set(primaryPeriodData.map(d => d.insegna));
        // Get all venues in the current context
        const opportunities = contextUniverse.filter(d => !currentVenues.has(d.insegna));

        // Deduplicate by venue name
        const uniqueOpportunities = new Map();
        opportunities.forEach(item => {
            if (!uniqueOpportunities.has(item.insegna)) {
                uniqueOpportunities.set(item.insegna, item);
            }
        });
        return Array.from(uniqueOpportunities.values());
    }, [primaryPeriodData, contextUniverse, filters.brandOwner]);

    // For "selectedBrandOwner", if multi-select just take the first one for the deep dive or handle plurality
    const selectedBrandOwner = filters.brandOwner.length > 0 ? filters.brandOwner[0] : null;

    if (!selectedBrandOwner) {
        return (
            <div className="space-y-6">
                <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center border-2 border-dashed border-gray-700">
                    <h2 className="text-xl font-semibold text-white">Select a Brand Owner</h2>
                    <p className="mt-2 text-gray-400">Please select a Brand Owner from the filter panel above, or click a bar on the chart below, to see a detailed performance analysis.</p>
                </div>
                <BrandOwnerPerformanceChart
                    primaryData={dataForBrandOwnerChart}
                    comparisonData={comparisonPeriodData.filter(i => filters.macroCategoria.length === 0 || (i.macroCategoria && filters.macroCategoria.includes(i.macroCategoria)))}
                    allInPrimaryPeriod={nationalUniverse}
                    allInComparisonPeriod={comparisonPeriodData}
                    timeSelection={timeSelection}
                    onFilter={value => handleFilterChange('brandOwner', value)}
                />
            </div>
        );
    }

    const comparisonDataForOwner = comparisonPeriodData.filter(item => item.brandOwner === selectedBrandOwner);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-teal-400">Deep Dive: {selectedBrandOwner} {filters.brandOwner.length > 1 && `(+${filters.brandOwner.length - 1} others)`}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <RegionDistributionChart
                        allData={nationalUniverse}
                        selectedBrandOwner={selectedBrandOwner}
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
                    ownerName={selectedBrandOwner}
                    subtitle={timeSelection.mode !== 'none' ? `Data for ${formatPeriod(timeSelection.periodA, timeSelection.mode)}` : undefined}
                />
            </div>
            <div className="grid grid-cols-1 gap-6">
                <ChannelPenetrationMetrics
                    allData={contextUniverse}
                    ownerData={contextUniverse.filter(item => item.brandOwner === selectedBrandOwner)}
                    ownerName={selectedBrandOwner}
                />
            </div>

            {filters.regione.length > 0 && (
                <div className="grid grid-cols-1 gap-6">
                    <ErrorBoundary>
                        <CompetitorHeatmap
                            data={contextUniverse}
                            primaryEntity={selectedBrandOwner}
                            entityType="brandOwner"
                            rowType="citta"
                            title={`Competitive Landscape in ${filters.regione.join(', ')} (by City)`}
                        />
                    </ErrorBoundary>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                <ErrorBoundary>
                    <BrandOwnerVenueTable
                        data={contextUniverse}
                        brandOwner={selectedBrandOwner}
                        title={`Venues for ${selectedBrandOwner}`}
                    />
                </ErrorBoundary>
            </div>
        </div>
    );
};

export default BrandOwnerSheet;