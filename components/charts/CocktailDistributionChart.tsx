import { useMemo, FC } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine, Legend } from 'recharts';
import type { MenuItem } from '../../types';
import ChartContainer from './ChartContainer';
import { formatNumber } from '../../utils/formatters';

interface CocktailDistributionChartProps {
    allData: MenuItem[];
    selectedCocktail: string;
    selectedCategory: string;
}

const TARGET_COCKTAILS = [
    'Paloma',
    'Negroni',
    'Americano',
    'Spritz',
    'Boulevardier',
    'Gin&Tonic',
    'Cocktail Martini'
];

const CocktailDistributionChart: FC<CocktailDistributionChartProps> = ({ allData, selectedCocktail, selectedCategory }) => {
    const chartData = useMemo(() => {
        if (!selectedCategory) return [];

        // 1. Get all venues in the current context (already filtered by region/city in parent)
        const totalVenues = new Set(allData.map(d => d.insegna)).size;
        if (totalVenues === 0) return [];

        // 2. Use Fixed Cocktails List
        const targetCocktailsLower = TARGET_COCKTAILS.map(c => c.toLowerCase());

        // Filter data to only include these cocktails for calculation
        const categoryData = allData.filter(d =>
            d.categoriaProdotto === selectedCategory &&
            d.nomeCocktail &&
            targetCocktailsLower.includes(d.nomeCocktail.toLowerCase())
        );

        // 3. Calculate distribution for each TARGET cocktail
        const data = TARGET_COCKTAILS.map(cocktail => {
            // Case-insensitive matching
            const venuesWithCocktail = new Set(categoryData
                .filter(d => d.nomeCocktail?.toLowerCase() === cocktail.toLowerCase())
                .map(d => d.insegna)
            ).size;

            return {
                name: cocktail,
                value: (venuesWithCocktail / totalVenues) * 100,
                venues: venuesWithCocktail
            };
        });

        // 4. Sort by distribution desc
        return data.sort((a, b) => b.value - a.value);

    }, [allData, selectedCategory, selectedCocktail]);

    const marketAverage = useMemo(() => {
        if (chartData.length === 0) return 0;
        return chartData.reduce((acc, curr) => acc + curr.value, 0) / chartData.length;
    }, [chartData]);

    return (
        <ChartContainer title="Cocktail Distribution" subtitle="Distribution of Key Cocktails" isEmpty={chartData.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" vertical={false} />
                    <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip
                        cursor={{ fill: 'rgba(147, 197, 253, 0.1)' }}
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '0.5rem', color: '#F3F4F6' }}
                        formatter={(value: number, name: string, props: any) => [
                            `${value.toFixed(1)}% (${formatNumber(props.payload.venues, 0)} venues)`,
                            'Distribution'
                        ]}
                    />
                    <Legend verticalAlign="top" wrapperStyle={{ top: -10, right: 0 }} />
                    <ReferenceLine y={marketAverage} stroke="#F87171" strokeDasharray="3 3" label={{ position: 'right', value: 'Avg', fill: '#F87171', fontSize: 12 }} />
                    <Bar dataKey="value" name="Distribution %" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.name === selectedCocktail ? '#8884d8' : '#6B7280'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};

export default CocktailDistributionChart;
