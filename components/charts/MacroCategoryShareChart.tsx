import { useMemo, FC } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { MenuItem, ChartDataItem, TimeSelection } from '../../types';
import { formatPeriod } from '../../utils/timeUtils';
import ChartContainer from './ChartContainer';
import { formatNumber } from '../../utils/formatters';

interface MacroCategoryShareChartProps {
  data: MenuItem[];
  timeSelection: TimeSelection;
  onFilter: (category: string | null) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const MacroCategoryShareChart: FC<MacroCategoryShareChartProps> = ({ data, timeSelection, onFilter }) => {
  const chartData = useMemo<ChartDataItem[]>(() => {
    const categoryCounts = data.reduce((acc, item) => {
      acc[item.macroCategoria] = (acc[item.macroCategoria] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
  }, [data]);

  const subtitle = timeSelection.mode !== 'none' ? `Data for ${formatPeriod(timeSelection.periodA, timeSelection.mode)}` : undefined;

  return (
    <ChartContainer title="'Share of Menu' by Macro Category" subtitle={subtitle} isEmpty={chartData.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '0.5rem' }}
            formatter={(value: number) => [formatNumber(value, 0), "Listings"]}
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={'80%'}
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            onClick={(d) => onFilter(d.name)}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default MacroCategoryShareChart;
