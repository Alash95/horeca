import { useMemo, FC } from 'react';
import type { MenuItem, TimeSelection } from '../types';
import { formatPeriod } from '../utils/timeUtils';
import { formatNumber } from '../utils/formatters';

interface CooccurrenceTableProps {
    allData: MenuItem[];
    selectedBrand: string;
    selectedCategory: string;
    timeSelection: TimeSelection;
}

const CooccurrenceTable: FC<CooccurrenceTableProps> = ({ allData, selectedBrand, selectedCategory, timeSelection }) => {
    const { cooccurrenceData, brandVenueCount } = useMemo(() => {
        if (!selectedBrand || !selectedCategory) return { cooccurrenceData: [], brandVenueCount: 0 };

        const brandVenues = new Set<string>(allData.filter(item => item.brand === selectedBrand).map(item => item.insegna));
        const brandVenueCount = brandVenues.size;

        if (brandVenueCount === 0) return { cooccurrenceData: [], brandVenueCount: 0 };

        const competitorCounts: Record<string, number> = {};

        for (const venue of brandVenues) {
            const competitorsInVenue = allData.filter(item =>
                item.insegna === venue &&
                item.categoriaProdotto === selectedCategory &&
                item.brand !== selectedBrand
            );

            const uniqueCompetitorBrands = new Set<string>(competitorsInVenue.map(item => item.brand));

            for (const brand of uniqueCompetitorBrands) {
                competitorCounts[brand] = (competitorCounts[brand] || 0) + 1;
            }
        }

        const formattedData = Object.entries(competitorCounts)
            .map(([name, count]) => ({
                name,
                sharedVenues: count,
                cooccurrenceRate: (count / brandVenueCount) * 100,
            }))
            .sort((a, b) => b.sharedVenues - a.sharedVenues)
            .slice(0, 5); // Top 5

        return { cooccurrenceData: formattedData, brandVenueCount };
    }, [allData, selectedBrand, selectedCategory]);

    const subtitle = timeSelection.mode !== 'none' ? `Data for ${formatPeriod(timeSelection.periodA, timeSelection.mode)}` : undefined;

    if (!selectedCategory) {
        return (
            <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg h-full flex items-center justify-center">
                <p className="text-gray-500 text-center">Select a category to see co-occurrence analysis.</p>
            </div>
        );
    }

    if (cooccurrenceData.length === 0) {
        return (
            <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg h-full flex items-center justify-center">
                <p className="text-gray-500 text-center">No direct competitors found in the same category and menus.</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg h-full">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-200">Co-occurrence with Competitors in '{selectedCategory}'</h3>
                {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
            </div>
            <p className="text-xs text-gray-400 mb-4">
                Brands in the same category most frequently found on the same menu.
                Based on {formatNumber(brandVenueCount, 0)} venues where {selectedBrand} is present.
            </p>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                    <thead className="border-b border-gray-700">
                        <tr>
                            <th scope="col" className="py-2 px-3 font-medium text-gray-300">Competitor Brand</th>
                            <th scope="col" className="py-2 px-3 font-medium text-gray-300 text-right">Shared Venues</th>
                            <th scope="col" className="py-2 px-3 font-medium text-gray-300 text-right">Co-occurrence Rate</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {cooccurrenceData.map(c => (
                            <tr key={c.name} className="hover:bg-gray-700/50">
                                <td className="py-3 px-3 font-medium text-gray-200">{c.name}</td>
                                <td className="py-3 px-3 text-gray-300 text-right font-mono">{formatNumber(c.sharedVenues, 0)}</td>
                                <td className="py-3 px-3 text-gray-300 text-right font-mono">{c.cooccurrenceRate.toFixed(1)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CooccurrenceTable;
