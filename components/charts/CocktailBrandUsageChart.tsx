import { useMemo, FC } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, Legend } from 'recharts';
import type { MenuItem } from '../../types';
import ChartContainer from './ChartContainer';
import { formatNumber } from '../../utils/formatters';

interface CocktailBrandComparisonChartProps {
  data: MenuItem[];
  cocktailName: string;
  selectedBrand: string;
}

const CocktailBrandComparisonChart: FC<CocktailBrandComparisonChartProps> = ({ data, cocktailName, selectedBrand }) => {
  const chartData = useMemo(() => {
    if (!selectedBrand || data.length === 0) return [];

    const venueSets = data.reduce((acc, item) => {
      if (item.brand === selectedBrand) {
        acc.myBrand.add(item.insegna);
      } else {
        acc.competitors.add(item.insegna);
      }
      return acc;
    }, { myBrand: new Set<string>(), competitors: new Set<string>() });

    return [
      { name: selectedBrand, Venues: venueSets.myBrand.size },
      { name: 'Competitors', Venues: venueSets.competitors.size },
    ];
  }, [data, selectedBrand]);

  const title = `Venue Count for ${cocktailName}`;
  const subtitle = `Comparing ${selectedBrand} vs. Competitors`;

  return (
    <ChartContainer title={title} subtitle={subtitle} isEmpty={chartData.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="horizontal" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
          <XAxis dataKey="name" type="category" stroke="#9CA3AF" />
          <YAxis type="number" stroke="#9CA3AF" allowDecimals={false} />
          <Tooltip
            cursor={{ fill: 'rgba(147, 197, 253, 0.1)' }}
            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '0.5rem' }}
            formatter={(value: number) => [formatNumber(value, 0), "Venues"]}
          />
          <Legend verticalAlign="top" wrapperStyle={{ top: -4, right: 0 }} />
          <Bar dataKey="Venues" name="Unique Venues" barSize={60}>
            <Cell key={selectedBrand} fill={'#00C49F'} />
            <Cell key={'Competitors'} fill={'#FF8042'} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default CocktailBrandComparisonChart;