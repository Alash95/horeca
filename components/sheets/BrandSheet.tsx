import { useMemo, FC } from 'react';
import type { MenuItem, Filters, TimeSelection } from '../../types';
import { formatNumber } from '../../utils/formatters';
import { formatPeriod } from '../../utils/timeUtils';
import MetricCard from '../MetricCard';
import BrandPerformanceChart from '../charts/BrandPerformanceChart';
import CooccurrenceTable from '../CooccurrenceTable';
import CompetitiveLandscapeTable from '../CompetitiveLandscapeTable';
import RegionDistributionChart from '../charts/RegionDistributionChart';
import ChannelPenetrationMetrics from '../ChannelPenetrationMetrics';
import VenueList from '../VenueList';
import CompetitorHeatmap from '../CompetitorHeatmap';
import ErrorBoundary from '../ErrorBoundary';

interface BrandSheetProps {
    primaryPeriodData: MenuItem[];
    comparisonPeriodData: MenuItem[];
    allData: MenuItem[];
    allInComparisonPeriod: MenuItem[];
    filters: Filters;
    timeSelection: TimeSelection;
    handleFilterChange: (filterName: keyof Filters, value: any) => void;
}

const BrandSheet: FC<BrandSheetProps> = ({ primaryPeriodData, comparisonPeriodData, allData, allInComparisonPeriod, filters, timeSelection, handleFilterChange }) => {

    const chartFilterContext = useMemo(() => {
        return allData.filter(i =>
            (filters.macroCategoria.length === 0 || (i.macroCategoria && filters.macroCategoria.includes(i.macroCategoria))) &&
            (filters.brandOwner.length === 0 || (i.brandOwner && filters.brandOwner.includes(i.brandOwner)))
        );
    }, [allData, filters.macroCategoria, filters.brandOwner]);

    const comparisonChartFilterContext = useMemo(() => {
        return comparisonPeriodData.filter(i =>
            (filters.macroCategoria.length === 0 || (i.macroCategoria && filters.macroCategoria.includes(i.macroCategoria))) &&
            (filters.brandOwner.length === 0 || (i.brandOwner && filters.brandOwner.includes(i.brandOwner)))
        );
    }, [comparisonPeriodData, filters.macroCategoria, filters.brandOwner]);

    const selectedBrand = filters.brand.length > 0 ? filters.brand[0] : null;

    if (!selectedBrand) {
        return (
            <div className="space-y-6">
                <div className="bg-slate-900 p-8 rounded-lg shadow-lg text-center border-2 border-dashed border-slate-800">
                    <h2 className="text-xl font-semibold text-white">Select a Brand</h2>
                    <p className="mt-2 text-slate-400">Please select a Brand from the filter panel above, or click a bar on the chart below, to see a detailed performance analysis.</p>
                </div>
                <BrandPerformanceChart
                    allData={allData}
                    allInComparisonPeriod={allInComparisonPeriod}
                    primaryData={chartFilterContext}
                    comparisonData={comparisonChartFilterContext}
                    filters={filters}
                    timeSelection={timeSelection}
                    onFilter={value => handleFilterChange('brand', value)}
                />
            </div>
        );
    }

    const brandAnalysis = useMemo(() => {
        const calculateMetrics = (data: MenuItem[], allPeriodData: MenuItem[]) => {
            const brandData = data.filter(item => item.brand === selectedBrand);
            if (brandData.length === 0) {
                return { avgPrice: 0, brandShareInCategory: 0, cocktailPresenceRate: 0, isSpirit: false, top4PositionRate: 0, priceIndexVsCategory: 0 };
            }

            const brandAvgPrice = (brandData.reduce((acc, i) => acc + i.prezzo, 0) / brandData.length);
            const category = brandData[0]?.categoriaProdotto;

            // 🎯 CSV Guide: [Price Index vs Category] = (BrandAvg / CategoryAvg) * 100
            const categoryData = allPeriodData.filter(i => i.categoriaProdotto === category);
            const categoryAvgPrice = categoryData.length > 0
                ? (categoryData.reduce((acc, i) => acc + i.prezzo, 0) / categoryData.length)
                : brandAvgPrice;
            const priceIndexVsCategory = categoryAvgPrice > 0 ? (brandAvgPrice / categoryAvgPrice) * 100 : 100;

            // 🎯 CSV Guide: [Category Penetration] = Brand List / Category List
            const totalBrandListings = brandData.length;
            const totalCategoryListings = categoryData.length;
            const brandShareInCategory = totalCategoryListings > 0 ? (totalBrandListings / totalCategoryListings) * 100 : 0;

            const isSpirit = brandData[0]?.macroCategoria === 'Spirits' || brandData[0]?.macroCategoria === 'SPIRITS';

            // 🎯 CSV Guide: [Cocktail Presence Rate] = Brand List in Cocktails / Category List in Cocktails
            let cocktailPresenceRate = 0;
            if (isSpirit) {
                const brandCocktailListings = brandData.filter(i =>
                    (i.nomeCocktail && i.nomeCocktail !== 'N/A' && i.nomeCocktail !== 'General Item')
                ).length;
                const totalCategoryCocktailListings = categoryData.filter(i =>
                    (i.nomeCocktail && i.nomeCocktail !== 'N/A' && i.nomeCocktail !== 'General Item')
                ).length;

                cocktailPresenceRate = totalCategoryCocktailListings > 0 ? (brandCocktailListings / totalCategoryCocktailListings) * 100 : 0;
            }

            // 🎯 CSV Guide: [Top 4 Position Rate] = Distinct Count Venues where Brand is in Top 4 by Price
            const brandVenues = new Set(brandData.map(item => item.venueId).filter(Boolean));
            let top4PresenceCount = 0;

            brandVenues.forEach(venue => {
                const venueCategoryItems = categoryData.filter(item =>
                    item.venueId === venue &&
                    (!item.nomeCocktail || item.nomeCocktail === 'N/A' || item.nomeCocktail === 'General Item')
                );

                const sortedByPrice = [...venueCategoryItems].sort((a, b) => b.prezzo - a.prezzo);
                const top4Brands = new Set(sortedByPrice.slice(0, 4).map(item => item.brand));

                if (top4Brands.has(selectedBrand!)) {
                    top4PresenceCount++;
                }
            });
            const top4PositionRate = brandVenues.size > 0 ? (top4PresenceCount / brandVenues.size) * 100 : 0;

            return { avgPrice: brandAvgPrice, brandShareInCategory, cocktailPresenceRate, isSpirit, top4PositionRate, priceIndexVsCategory };
        };

        return {
            primary: calculateMetrics(primaryPeriodData, allData),
            comparison: calculateMetrics(comparisonPeriodData, allInComparisonPeriod),
        };
    }, [primaryPeriodData, comparisonPeriodData, allData, allInComparisonPeriod, selectedBrand]);

    const comparisonLabel = timeSelection.mode !== 'none' ? formatPeriod(timeSelection.periodB, timeSelection.mode) : undefined;

    const selectedCategoryData = primaryPeriodData.find(i => i.brand === selectedBrand);
    const selectedCategory = selectedCategoryData?.categoriaProdotto || '';

    // Calculate Context Universe (Filtered by Region, Client Type, etc., but NOT Brand)
    const contextUniverse = useMemo(() => {
        return allData.filter(item => {
            return (
                (filters.regione.length === 0 || (item.regione && filters.regione.includes(item.regione))) &&
                (filters.citta.length === 0 || (item.citta && filters.citta.includes(item.citta))) &&
                (filters.tipologiaCliente.length === 0 || (item.tipologiaCliente && filters.tipologiaCliente.includes(item.tipologiaCliente)))
            );
        });
    }, [allData, filters.regione, filters.citta, filters.tipologiaCliente]);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-teal-400">Deep Dive: {selectedBrand} {filters.brand.length > 1 && `(+${filters.brand.length - 1} others)`}</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Average Price"
                    primaryValue={`€${formatNumber(brandAnalysis.primary.avgPrice, 2)}`}
                    comparisonValue={brandAnalysis.comparison.avgPrice}
                    comparisonLabel={comparisonLabel}
                />
                <MetricCard
                    title="Brand Share in Category"
                    primaryValue={`${brandAnalysis.primary.brandShareInCategory.toFixed(1)}%`}
                    comparisonValue={brandAnalysis.comparison.brandShareInCategory}
                    comparisonLabel={comparisonLabel}
                />
                <MetricCard
                    title="Top 4 Position Rate (Just Neat Spirits)"
                    primaryValue={`${brandAnalysis.primary.top4PositionRate.toFixed(1)}%`}
                    comparisonValue={brandAnalysis.comparison.top4PositionRate}
                    comparisonLabel={comparisonLabel}
                />
                {brandAnalysis.primary.isSpirit && (
                    <MetricCard
                        title="Cocktail Presence Rate"
                        primaryValue={`${brandAnalysis.primary.cocktailPresenceRate.toFixed(1)}%`}
                        comparisonValue={brandAnalysis.comparison.cocktailPresenceRate}
                        comparisonLabel={comparisonLabel}
                    />
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RegionDistributionChart
                    allData={allData}
                    selectedBrand={selectedBrand}
                    filters={filters}
                    onRegionSelect={value => handleFilterChange('regione', value)}
                />
                <CompetitiveLandscapeTable
                    allData={allData}
                    filteredData={primaryPeriodData}
                    selectedBrand={selectedBrand}
                    selectedCategory={selectedCategory}
                />
            </div>
            <div className="grid grid-cols-1">
                <CooccurrenceTable
                    allData={primaryPeriodData}
                    selectedBrand={selectedBrand}
                    selectedCategory={selectedCategory}
                    timeSelection={timeSelection}
                />
            </div>
            <div className="grid grid-cols-1 gap-6">
                <ChannelPenetrationMetrics
                    allData={contextUniverse}
                    ownerData={primaryPeriodData.filter(i => i.brand === selectedBrand)}
                    ownerName={selectedBrand || undefined}
                    selectedBrand={selectedBrand}
                    selectedCategory={selectedCategory}
                />
            </div>

            {filters.regione.length > 0 && (
                <div className="grid grid-cols-1 gap-6">
                    <ErrorBoundary>
                        <CompetitorHeatmap
                            data={contextUniverse.filter(d => d.categoriaProdotto === selectedCategory)}
                            primaryEntity={selectedBrand}
                            entityType="brand"
                            rowType={filters.citta.length > 0 ? 'insegna' : 'citta'}
                            title={filters.citta.length > 0
                                ? `Competitive Landscape in ${filters.citta.join(', ')} (by Venue)`
                                : `Competitive Landscape in ${filters.regione.join(', ')} (by City)`}
                        />
                    </ErrorBoundary>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                <ErrorBoundary>
                    <VenueList
                        data={primaryPeriodData.filter(i => i.brand === selectedBrand)}
                        opportunityData={useMemo(() => {
                            const currentBrandVenues = new Set(primaryPeriodData.filter(i => i.brand === selectedBrand).map(d => d.insegna));

                            const opportunities = contextUniverse.filter(d =>
                                d.categoriaProdotto === selectedCategory &&
                                !currentBrandVenues.has(d.insegna)
                            );

                            const uniqueOpportunities = new Map();
                            opportunities.forEach(item => {
                                if (!uniqueOpportunities.has(item.insegna)) {
                                    uniqueOpportunities.set(item.insegna, item);
                                }
                            });
                            return Array.from(uniqueOpportunities.values());
                        }, [primaryPeriodData, contextUniverse, selectedBrand, selectedCategory])}
                        title={`Venues for ${selectedBrand}`}
                    />
                </ErrorBoundary>
            </div>
        </div>
    );
};

export default BrandSheet;