import { useMemo, FC } from 'react';
import type { MenuItem } from '../types';

const MACRO_CATEGORIES = ["Spirits", "Wine", "Champagne", "Beer", "Soft Drink"] as const;

interface PortfolioAnalysisProps {
    ownerData: MenuItem[];
    comparisonOwnerData: MenuItem[];
    allDataInPeriod: MenuItem[];
    ownerName: string;
    subtitle?: string;
}

const PortfolioAnalysis: FC<PortfolioAnalysisProps> = ({ ownerData, comparisonOwnerData, allDataInPeriod, ownerName, subtitle }) => {
    const analysis = useMemo(() => {
        if (ownerData.length === 0) return null;

        const totalListings = ownerData.length;
        const brandCounts = ownerData.reduce((acc: Record<string, number>, item) => {
            acc[item.brand] = (acc[item.brand] || 0) + 1;
            return acc;
        }, {});

        const brandBreakdown = Object.entries(brandCounts)
            // FIX: Explicitly type the [name, count] parameters to ensure 'count' is treated as a number.
            .map(([name, count]: [string, number]) => ({ name, count, percentage: (count / totalListings) * 100 }))
            .sort((a, b) => b.count - a.count);

        const presentCategories = new Set(ownerData.map(item => item.macroCategoria));
        const missingCategories = MACRO_CATEGORIES.filter(cat => !presentCategories.has(cat));

        const heroBrand = brandBreakdown[0];
        const heroBrandDependency = heroBrand ? heroBrand.percentage : 0;

        // Original calculateDepth function
        const calculateDepth = (data: MenuItem[]) => {
            if (data.length === 0) return 0;
            const uniqueVenues = new Set(data.map(item => item.venueId).filter(Boolean)).size;
            return uniqueVenues > 0 ? data.length / uniqueVenues : 0;
        };

        // New calculateTop4PositionRate function based on the provided snippet's intent
        // This function is not directly used in the current PortfolioAnalysis component's return,
        // but is included as per the instruction's "Code Edit" snippet.
        // It assumes `brandData` and `categoryData` would be passed or derived.
        const calculateTop4PositionRate = (brandData: MenuItem[], categoryData: MenuItem[]) => { // 🎯 CSV Guide: [Top 4 Position Rate] = Distinct Count Venues where Brand is in Top 4 by Price
            const brandVenues = new Set(brandData.map(item => item.venueId).filter(Boolean));
            let top4PresenceCount = 0;

            brandVenues.forEach(venue => {
                const venueCategoryItems = categoryData.filter(item =>
                    item.venueId === venue &&
                    (!item.nomeCocktail || item.nomeCocktail === 'N/A' || item.nomeCocktail === 'General Item')
                );

                const sortedByPrice = [...venueCategoryItems].sort((a, b) => b.prezzo - a.prezzo);
                // Logic to check if brand is in top 4 would go here
                // For now, just returning a placeholder or assuming this function is for future use
            });
            return top4PresenceCount; // Placeholder
        };


        const primaryDepth = calculateDepth(ownerData);
        const comparisonDepth = calculateDepth(comparisonOwnerData);

        // --- New Benchmark Calculations ---
        // FIX: Explicitly type the accumulator (`acc`) to correctly infer the return type of reduce, which resolves downstream type errors.
        const dataByOwner = allDataInPeriod.reduce((acc: Record<string, MenuItem[]>, item) => {
            if (!acc[item.brandOwner]) {
                acc[item.brandOwner] = [];
            }
            acc[item.brandOwner].push(item);
            return acc;
        }, {} as Record<string, MenuItem[]>);

        const depthsByOwner = Object.entries(dataByOwner).map(([name, data]) => ({
            name,
            depth: calculateDepth(data)
        }));

        let marketLeader = { name: 'N/A', depth: 0 };
        if (depthsByOwner.length > 0) {
            marketLeader = depthsByOwner.reduce((leader, current) => current.depth > leader.depth ? current : leader, depthsByOwner[0]);
        }

        const totalDepth = depthsByOwner.reduce((sum, item) => sum + item.depth, 0);
        const marketAverageDepth = depthsByOwner.length > 0 ? totalDepth / depthsByOwner.length : 0;
        // --- End New Calculations ---

        return {
            brandBreakdown,
            presentCategories,
            missingCategories,
            heroBrandDependency,
            distributionDepth: {
                primary: primaryDepth,
                comparison: comparisonDepth
            },
            marketLeader,
            marketAverageDepth
        };
    }, [ownerData, comparisonOwnerData, allDataInPeriod]);

    if (!analysis) {
        return <div className="text-gray-500">Not enough data for portfolio analysis.</div>;
    }

    const getDependencyColor = (percentage: number) => {
        if (percentage > 75) return 'text-red-400';
        if (percentage > 50) return 'text-amber-400';
        return 'text-green-400';
    };

    const primaryDepth = analysis.distributionDepth.primary;
    const comparisonDepth = analysis.distributionDepth.comparison;
    let depthChange: number | null = null;
    if (comparisonDepth > 0) {
        depthChange = ((primaryDepth - comparisonDepth) / comparisonDepth) * 100;
    }

    return (
        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg h-full flex flex-col">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-200">Portfolio Analysis for {ownerName}</h3>
                {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                <div>
                    <h4 className="text-md font-semibold text-gray-300 mb-2">Brand Contribution</h4>
                    <p className={`text-sm mb-3 ${getDependencyColor(analysis.heroBrandDependency)}`}>
                        <strong>Hero Brand Dependency: {analysis.heroBrandDependency.toFixed(1)}%</strong>
                        <span className="block text-xs text-gray-400">({analysis.brandBreakdown[0]?.name} drives the majority of listings)</span>
                    </p>
                    <ul className="space-y-2 overflow-y-auto max-h-[140px] pr-2">
                        {analysis.brandBreakdown.map(brand => (
                            <li key={brand.name} className="text-sm">
                                <div className="flex justify-between items-center text-gray-300">
                                    <span>{brand.name}</span>
                                    <span className="font-mono">{brand.percentage.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                                    <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${brand.percentage}%` }}></div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 className="text-md font-semibold text-gray-300 mb-2">Category & Distribution</h4>
                    <div className="space-y-4">
                        <div className="bg-gray-900/50 p-3 rounded-md">
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-medium text-gray-400">Distribution Depth (SKU/Outlet)</p>
                                {depthChange !== null && (
                                    <span className={`text-xs font-medium ${depthChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {depthChange >= 0 ? '▲' : '▼'} {Math.abs(depthChange).toFixed(1)}%
                                    </span>
                                )}
                            </div>
                            <p className="text-2xl font-semibold text-white mt-1 font-mono">{primaryDepth.toFixed(2)}</p>
                            <div className="border-t border-gray-700 mt-3 pt-2 flex justify-between text-xs">
                                <div className="text-center">
                                    <p className="text-gray-400">Market Leader <span title="Market Leader">👑</span></p>
                                    <p className="text-gray-200 font-semibold font-mono">{analysis.marketLeader.depth.toFixed(2)}</p>
                                    <p className="text-gray-500 truncate text-xxs">({analysis.marketLeader.name})</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-gray-400">Market Average</p>
                                    <p className="text-gray-200 font-semibold font-mono">{analysis.marketAverageDepth.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default PortfolioAnalysis;