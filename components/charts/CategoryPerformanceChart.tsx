import { useMemo, FC } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { MenuItem, ChartDataItem, TimeSelection } from '../../types';
import { formatPeriod } from '../../utils/timeUtils';
import { formatNumber } from '../../utils/formatters';
import ChartContainer from './ChartContainer';

interface CategoryPerformanceChartProps {
  data: MenuItem[];
  timeSelection: TimeSelection;
  onFilter: (category: string | null) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const CategoryPerformanceChart: FC<CategoryPerformanceChartProps> = ({ data, timeSelection, onFilter }) => {
  const chartData = useMemo<ChartDataItem[]>(() => {
    const total = data.length;
    const categoryCounts = data.reduce((acc, item) => {
      acc[item.categoriaProdotto] = (acc[item.categoriaProdotto] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryCounts)
      .map(([name, value]) => ({
        name: `${name} ${(((value as number) / total) * 100).toFixed(0)}%`,
        originalName: name,
        value
      }))
      .sort((a, b) => (b.value as number) - (a.value as number));
  }, [data]);

  const subtitle = timeSelection.mode !== 'none' ? `Data for ${formatPeriod(timeSelection.periodA, timeSelection.mode)}` : undefined;

  return (
    <ChartContainer title="Category Performance" subtitle={subtitle} isEmpty={chartData.length === 0} className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '0.5rem' }}
            itemStyle={{ color: '#E5E7EB' }}
            formatter={(value: number) => [formatNumber(value, 0), "Listings"]}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={'70%'}
            labelLine={false}
            onClick={(d) => onFilter(d.originalName)}
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

export default CategoryPerformanceChart;
