import { useMemo, FC } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import type { MenuItem } from '../../types';
import ChartContainer from './ChartContainer';
import { formatNumber } from '../../utils/formatters';

interface GapAnalysisChartProps {
    allData: MenuItem[];
    selectedCocktail: string;
    selectedBrand: string;
    selectedCategory: string;
}

const GapAnalysisChart: FC<GapAnalysisChartProps> = ({ allData, selectedCocktail, selectedBrand, selectedCategory }) => {
    const chartData = useMemo(() => {
        if (!selectedCategory || !selectedCocktail || !selectedBrand) return [];

        // 1. Filter data for the category
        const categoryData = allData.filter(d => d.categoriaProdotto === selectedCategory);

        // 2. Find all venues serving the selected cocktail
        const venuesWithCocktail = new Set(
            categoryData
                .filter(d => d.nomeCocktail === selectedCocktail)
                .map(d => d.insegna)
        );

        // 3. Find venues serving the selected brand (in any context within category, or specifically in cocktail? 
        // "Locali che fanno Gin&Tonic MA NON hanno Tanqueray" implies Tanqueray might be present in the venue but not used in G&T? 
        // Usually "Gap" means the brand is not present at all in that context. 
        // Let's assume: Venues serving G&T where Tanqueray is NOT the brand used for G&T.
        // But wait, a venue might have multiple G&T listings. If *any* of them use Tanqueray, it's not a gap.

        const venuesWithBrandInCocktail = new Set(
            categoryData
                .filter(d => d.nomeCocktail === selectedCocktail && d.brand === selectedBrand)
                .map(d => d.insegna)
        );

        // 4. Identify Gap Venues (Serve Cocktail but NOT Brand in that Cocktail)
        const gapVenues: string[] = [];
        venuesWithCocktail.forEach(venue => {
            if (!venuesWithBrandInCocktail.has(venue)) {
                gapVenues.push(venue);
            }
        });

        // 5. Group Gap Venues by City
        // We need to look up the city for each venue. 
        // We can create a map of venue -> city from allData
        const venueCityMap = new Map<string, string>();
        allData.forEach(d => {
            if (d.insegna && d.citta) {
                venueCityMap.set(d.insegna, d.citta);
            }
        });

        const cityGapCounts: Record<string, number> = {};
        gapVenues.forEach(venue => {
            const city = venueCityMap.get(venue) || 'Unknown';
            cityGapCounts[city] = (cityGapCounts[city] || 0) + 1;
        });

        // 6. Format for Chart (Top 10 Cities)
        return Object.entries(cityGapCounts)
            .map(([city, count]) => ({ name: city, value: count }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

    }, [allData, selectedCategory, selectedCocktail, selectedBrand]);

    return (
        <ChartContainer
            title={`Opportunity Hunt: ${selectedCocktail}`}
            subtitle={`Top Cities where ${selectedCocktail} is served but ${selectedBrand} is NOT present`}
            isEmpty={chartData.length === 0}
        >
            <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" horizontal={false} />
                    <XAxis type="number" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} tickLine={false} axisLine={false} width={100} />
                    <Tooltip
                        cursor={{ fill: 'rgba(147, 197, 253, 0.1)' }}
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '0.5rem', color: '#F3F4F6' }}
                        formatter={(value: number) => [formatNumber(value, 0), "Gap Venues"]}
                    />
                    <Bar dataKey="value" name="Gap Venues" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill="#F87171" /> // Red color for "Opportunity/Gap"
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};

export default GapAnalysisChart;
