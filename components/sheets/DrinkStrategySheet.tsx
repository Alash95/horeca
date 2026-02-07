import { useMemo, FC } from 'react';
import type { MenuItem, Filters } from '../../types';
import { formatNumber } from '../../utils/formatters';
import RegionalBrandComparisonChart from '../charts/RegionalBrandComparisonChart';
import BrandCocktailHeatmap from '../BrandCocktailHeatmap';
import DrinkStrategyVenueTable from '../DrinkStrategyVenueTable';
import MetricCard from '../MetricCard';
import { isCocktailMatch, TARGET_COCKTAILS } from '../../utils/cocktailUtils';

interface DrinkStrategySheetProps {
    allData: MenuItem[];
    primaryPeriodData: MenuItem[];
    filters: Filters;
    timeSelection: any; // We might not need this explicitly here but it's passed
    handleFilterChange: (filterName: keyof Filters, value: any) => void;
}

const DrinkStrategySheet: FC<DrinkStrategySheetProps> = ({ allData, primaryPeriodData, filters, handleFilterChange, timeSelection }) => {
    const selectedCocktail = filters.cocktail.length > 0 ? filters.cocktail[0] : null;
    const selectedBrand = filters.brand.length > 0 ? filters.brand[0] : null;

    // 1. Context Data: All data filtered by Region/City/ClientType (but NOT Brand/Cocktail)
    const contextData = useMemo(() => {
        return allData.filter(item => {
            return (
                (filters.regione.length === 0 || (item.regione && filters.regione.includes(item.regione))) &&
                (filters.citta.length === 0 || (item.citta && filters.citta.includes(item.citta))) &&
                (filters.tipologiaCliente.length === 0 || (item.tipologiaCliente && filters.tipologiaCliente.includes(item.tipologiaCliente))) &&
                (filters.macroCategoria.length === 0 || (item.macroCategoria && filters.macroCategoria.includes(item.macroCategoria))) &&
                (filters.categoriaProdotto.length === 0 || (item.categoriaProdotto && filters.categoriaProdotto.includes(item.categoriaProdotto)))
            );
        });
    }, [allData, filters]);

    // 2. Metrics Calculation
    const metrics = useMemo(() => {
        // If no cocktail selected, no metrics
        if (!selectedCocktail) return null;

        const allVenues = new Set(contextData.map(d => d.venueId).filter(Boolean));
        const totalVenues = allVenues.size;

        const venuesWithCocktail = new Set(contextData
            .filter(d => isCocktailMatch(d.nomeCocktail, selectedCocktail))
            .map(d => d.venueId)
            .filter(Boolean)
        ).size;
        const cocktailDistribution = totalVenues > 0 ? (venuesWithCocktail / totalVenues) * 100 : 0;

        const venuesWithBrandInCocktail = selectedBrand
            ? new Set(contextData
                .filter(d => isCocktailMatch(d.nomeCocktail, selectedCocktail) && d.brand === selectedBrand)
                .map(d => d.venueId)
                .filter(Boolean)
            ).size
            : venuesWithCocktail; // Fallback to total for cocktail if no brand selected

        const venuesWithCompetitorInCocktail = selectedBrand
            ? new Set(contextData
                .filter(d => isCocktailMatch(d.nomeCocktail, selectedCocktail) && d.brand !== selectedBrand)
                .map(d => d.venueId)
                .filter(Boolean)
            ).size
            : 0;

        const cocktailPrices = contextData
            .filter(d => isCocktailMatch(d.nomeCocktail, selectedCocktail))
            .map(d => d.prezzo);
        const cocktailAvgPrice = cocktailPrices.length > 0
            ? cocktailPrices.reduce((a, b) => a + b, 0) / cocktailPrices.length
            : 0;

        const targetCocktailsLower = TARGET_COCKTAILS.map(c => c.toLowerCase());
        const brandCocktailData = contextData.filter(d =>
            d.brand === selectedBrand &&
            d.nomeCocktail &&
            targetCocktailsLower.includes(d.nomeCocktail.toLowerCase())
        );
        const placementsByCocktail = brandCocktailData.reduce((acc, item) => {
            const normalizedName = item.nomeCocktail.toLowerCase();
            if (!acc[normalizedName]) acc[normalizedName] = new Set();
            acc[normalizedName].add(item.venueId || item.insegna);
            return acc;
        }, {} as Record<string, Set<string>>);
        const brandTotalPlacements = Object.values(placementsByCocktail).reduce<number>((sum, venues) => sum + (venues as Set<string>).size, 0);

        return {
            cocktailDistribution,
            venuesWithBrandInCocktail,
            venuesWithCompetitorInCocktail,
            cocktailAvgPrice,
            brandTotalPlacements
        };
    }, [contextData, selectedBrand, selectedCocktail]);

    const dataForSelectedCocktail = useMemo(() => {
        if (!selectedCocktail) return [];
        return contextData.filter(item => isCocktailMatch(item.nomeCocktail, selectedCocktail));
    }, [contextData, selectedCocktail]);

    const selectedCategory = useMemo(() => {
        if (filters.categoriaProdotto.length > 0) return filters.categoriaProdotto[0];
        if (selectedBrand) {
            const brandItem = allData.find(i => i.brand === selectedBrand);
            return brandItem?.categoriaProdotto || '';
        }
        return '';
    }, [filters.categoriaProdotto, selectedBrand, allData]);

    if (!selectedCocktail) {
        return (
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center border-2 border-dashed border-gray-700">
                <h2 className="text-xl font-semibold text-white">Select a Cocktail</h2>
                <p className="mt-2 text-gray-400">Please select a Cocktail from the main filter panel to analyze its Drink Strategy.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-teal-400 mb-2">Drink Strategy: {selectedBrand || 'All Brands'} on {selectedCocktail} {filters.cocktail.length > 1 && `(+${filters.cocktail.length - 1} others)`}</h2>
            </div>

            {/* KPI Cards Row */}
            {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Cocktail Popularity"
                        primaryValue={`${metrics.cocktailDistribution.toFixed(1)}%`}
                        subtitle="of total venues serve this cocktail"
                    />
                    <MetricCard
                        title="Venue Count"
                        primaryValue={formatNumber(metrics.venuesWithBrandInCocktail, 0)}
                        subtitle={selectedBrand
                            ? `vs ${formatNumber(metrics.venuesWithCompetitorInCocktail, 0)} Competitor Venues`
                            : "Total venues serving this cocktail"}
                    />
                    <MetricCard
                        title="Cocktail Avg Price"
                        primaryValue={`€${formatNumber(metrics.cocktailAvgPrice, 2)}`}
                        subtitle={`Average price of ${selectedCocktail}`}
                    />
                    <MetricCard
                        title="Brand Total Placements"
                        primaryValue={formatNumber(metrics.brandTotalPlacements, 0)}
                        subtitle="Total brand-cocktail combinations"
                    />
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                <RegionalBrandComparisonChart
                    allData={contextData}
                    selectedCocktail={selectedCocktail}
                    selectedBrand={selectedBrand}
                />
            </div>

            <div className="grid grid-cols-1 gap-6">
                <BrandCocktailHeatmap
                    allData={contextData}
                    selectedBrand={selectedBrand}
                    selectedCategory={selectedCategory}
                    selectedCocktail={selectedCocktail}
                />
            </div>

            <div className="grid grid-cols-1 gap-6">
                <DrinkStrategyVenueTable
                    data={contextData}
                    selectedCocktail={selectedCocktail}
                    selectedBrand={selectedBrand}
                />
            </div>
        </div>
    );
};

export default DrinkStrategySheet;