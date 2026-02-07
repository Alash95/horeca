import { useMemo, FC } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { MenuItem, ChartDataItem, TimeSelection } from '../../types';
import { formatPeriod } from '../../utils/timeUtils';
import { formatNumber } from '../../utils/formatters';
import ChartContainer from './ChartContainer';

interface BrandOwnerShareChartProps {
  data: MenuItem[];
  timeSelection: TimeSelection;
  onFilter: (brandOwner: string | null) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c', '#8dd1e1'];

const BrandOwnerShareChart: FC<BrandOwnerShareChartProps> = ({ data, timeSelection, onFilter }) => {
  const chartData = useMemo<ChartDataItem[]>(() => {
    const ownerCounts = data.reduce((acc: Record<string, number>, item) => {
      acc[item.brandOwner] = (acc[item.brandOwner] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedOwners = Object.entries(ownerCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    if (sortedOwners.length > 10) {
      const top9 = sortedOwners.slice(0, 9);
      const othersValue = sortedOwners.slice(9).reduce((acc: number, item) => acc + item.value, 0);
      return [...top9, { name: 'Others', value: othersValue }];
    }

    return sortedOwners;
  }, [data]);

  const subtitle = timeSelection.mode !== 'none' ? `Data for ${formatPeriod(timeSelection.periodA, timeSelection.mode)}` : undefined;

  const handleFilterClick = (payload: any) => {
    if (payload.name !== 'Others') {
      onFilter(payload.name);
    }
  };

  return (
    <ChartContainer title="'Share of Menu' by Brand Owner" subtitle={subtitle} isEmpty={chartData.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '0.5rem' }}
            formatter={(value: number, name: string) => {
              const total = chartData.reduce((acc: number, curr) => acc + curr.value, 0);
              const percent = total > 0 ? (value / total * 100).toFixed(1) : 0;
              return [`${formatNumber(value, 0)} listings (${percent}%)`, name];
            }}
          />
          <Legend layout="vertical" verticalAlign="middle" align="right" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingLeft: '20px' }} />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="40%"
            cy="50%"
            outerRadius={'80%'}
            innerRadius={'40%'}
            labelLine={false}
            onClick={handleFilterClick}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="cursor-pointer focus:outline-none" stroke="#374151" strokeWidth={2} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default BrandOwnerShareChart;