import { useMemo, FC } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import type { MenuItem } from '../../types';
import ChartContainer from './ChartContainer';
import { isCocktailMatch } from '../../utils/cocktailUtils';
import { formatNumber } from '../../utils/formatters';

interface RegionalBrandComparisonChartProps {
    allData: MenuItem[];
    selectedCocktail: string;
    selectedBrand: string | null;
}

const RegionalBrandComparisonChart: FC<RegionalBrandComparisonChartProps> = ({ allData, selectedCocktail, selectedBrand }) => {
    const chartData = useMemo(() => {
        if (!selectedCocktail) return [];

        const regionMap = new Map<string, { brand: Set<string>; competitors: Set<string> }>();

        allData.forEach(item => {
            if (!item.regione || !item.insegna) return;
            // Use robust matching
            if (!isCocktailMatch(item.nomeCocktail, selectedCocktail)) return;

            if (!regionMap.has(item.regione)) {
                regionMap.set(item.regione, { brand: new Set(), competitors: new Set() });
            }

            const regionEntry = regionMap.get(item.regione)!;

            if (selectedBrand && item.brand === selectedBrand) {
                regionEntry.brand.add(item.insegna);
            } else {
                regionEntry.competitors.add(item.insegna);
            }
        });

        const data = Array.from(regionMap.entries()).map(([region, sets]) => ({
            name: region,
            Brand: sets.brand.size,
            Competitors: sets.competitors.size,
            Total: sets.brand.size + sets.competitors.size
        }));

        // Sort by Total descending
        return data.sort((a, b) => b.Total - a.Total);

    }, [allData, selectedCocktail, selectedBrand]);

    const title = selectedBrand
        ? `Regional Comparison: ${selectedBrand} vs Competitors`
        : `Regional Comparison: ${selectedCocktail}`;

    const subtitle = selectedBrand
        ? `Venues serving ${selectedCocktail} with ${selectedBrand} vs others`
        : `Venues serving ${selectedCocktail} (Total)`;

    return (
        <ChartContainer title={title} subtitle={subtitle} isEmpty={chartData.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                    <XAxis
                        dataKey="name"
                        stroke="#9CA3AF"
                        interval={0} // Ensure all regions are shown
                        tick={{ fontSize: 12 }}
                    />
                    <YAxis
                        stroke="#9CA3AF"
                        allowDecimals={false}
                        tickFormatter={(value) => formatNumber(value, 0)}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(147, 197, 253, 0.1)' }}
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '0.5rem' }}
                        formatter={(value: number) => [formatNumber(value, 0), "Venues"]}
                    />
                    <Legend verticalAlign="top" wrapperStyle={{ top: -10, right: 0 }} />
                    <Bar dataKey="Brand" name={selectedBrand || 'Selected Brand'} fill="#10B981" barSize={20} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Competitors" name="Competitors" fill="#EF4444" barSize={20} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};

export default RegionalBrandComparisonChart;
