import { useMemo, FC } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import type { MenuItem } from '../../types';
import ChartContainer from './ChartContainer';
import { formatNumber } from '../../utils/formatters';

interface CocktailRegionalDistributionChartProps {
    allData: MenuItem[];
    selectedCocktail: string;
    selectedBrand?: string | null;
}

const CocktailRegionalDistributionChart: FC<CocktailRegionalDistributionChartProps> = ({ allData, selectedCocktail, selectedBrand }) => {
    const chartData = useMemo(() => {
        if (!selectedCocktail) return [];

        // 1. Get all regions
        const regions = [...new Set(allData.map(d => d.regione))].filter(Boolean);

        // 2. Calculate distribution for each region
        const data = regions.map(region => {
            const regionData = allData.filter(d => d.regione === region);
            const totalVenuesInRegion = new Set(regionData.map(d => d.insegna)).size;

            if (totalVenuesInRegion === 0) return { name: region, value: 0, venues: 0 };

            const venuesWithCocktail = new Set(regionData
                .filter(d => d.nomeCocktail && d.nomeCocktail.toLowerCase() === selectedCocktail.toLowerCase() && (!selectedBrand || d.brand === selectedBrand))
                .map(d => d.insegna)
            ).size;

            return {
                name: region,
                value: (venuesWithCocktail / totalVenuesInRegion) * 100,
                venues: venuesWithCocktail,
                total: totalVenuesInRegion
            };
        });

        // 3. Sort by distribution desc
        return data.sort((a, b) => b.value - a.value);

    }, [allData, selectedCocktail, selectedBrand]);

    return (
        <ChartContainer
            title={`Regional Popularity: ${selectedCocktail}${selectedBrand ? ` (${selectedBrand})` : ''}`}
            subtitle={`% of venues serving this cocktail${selectedBrand ? ` with ${selectedBrand}` : ''} by region`}
            isEmpty={chartData.length === 0}
        >
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" vertical={false} />
                    <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} interval={0} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip
                        cursor={{ fill: 'rgba(147, 197, 253, 0.1)' }}
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '0.5rem', color: '#F3F4F6' }}
                        formatter={(value: number, name: string, props: any) => [
                            `${value.toFixed(1)}% (${formatNumber(props.payload.venues, 0)}/${formatNumber(props.payload.total, 0)})`,
                            'Penetration'
                        ]}
                    />
                    <Bar dataKey="value" name="Penetration %" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill="#14B8A6" />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};

export default CocktailRegionalDistributionChart;
