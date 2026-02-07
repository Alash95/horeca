import { useMemo, FC } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import type { MenuItem, ChartDataItem, TimeSelection } from '../../types';
import { formatPeriod } from '../../utils/timeUtils';
import { formatNumber } from '../../utils/formatters';
import ChartContainer from './ChartContainer';

interface BrandOwnerPerformanceChartProps {
  primaryData: MenuItem[];
  comparisonData: MenuItem[];
  allInPrimaryPeriod: MenuItem[];
  allInComparisonPeriod: MenuItem[];
  timeSelection: TimeSelection;
  onFilter: (brandOwner: string | null) => void;
}

const BrandOwnerPerformanceChart: FC<BrandOwnerPerformanceChartProps> = ({ primaryData, comparisonData, allInPrimaryPeriod, allInComparisonPeriod, timeSelection, onFilter }) => {
  const { chartData, primaryLabel, comparisonLabel } = useMemo(() => {
    const isComparisonMode = timeSelection.mode !== 'none';

    const calculateVenueCounts = (data: MenuItem[]): Record<string, number> => {
      const itemsByOwner = data.reduce((acc, item) => {
        if (!acc[item.brandOwner]) {
          acc[item.brandOwner] = new Set<string>();
        }
        acc[item.brandOwner].add(item.insegna);
        return acc;
      }, {} as Record<string, Set<string>>);

      return Object.entries(itemsByOwner).reduce((acc, [owner, venues]) => {
        acc[owner] = venues.size;
        return acc;
      }, {} as Record<string, number>);
    };

    const primaryCounts = calculateVenueCounts(primaryData);

    if (!isComparisonMode) {
      const singlePeriodData = Object.entries(primaryCounts)
        .map(([name, value]): ChartDataItem => ({
          name,
          value: value
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      return { chartData: singlePeriodData, primaryLabel: '', comparisonLabel: '' };
    }

    const comparisonCounts = calculateVenueCounts(comparisonData);

    const allOwners = new Set([...Object.keys(primaryCounts), ...Object.keys(comparisonCounts)]);
    const combinedData = Array.from(allOwners)
      .map(owner => ({
        name: owner,
        primary: primaryCounts[owner] || 0,
        comparison: comparisonCounts[owner] || 0,
      }))
      .sort((a, b) => (b.primary + b.comparison) - (a.primary + a.comparison))
      .slice(0, 10);

    return {
      chartData: combinedData,
      primaryLabel: formatPeriod(timeSelection.periodA, timeSelection.mode),
      comparisonLabel: formatPeriod(timeSelection.periodB, timeSelection.mode),
    };

  }, [primaryData, comparisonData, timeSelection]);

  const title = "Brand Owner Performance (by Unique Venues)";
  const subtitle = timeSelection.mode !== 'none' ? `Comparing ${primaryLabel} vs ${comparisonLabel}` : 'Top 10 by # of Venues';

  return (
    <ChartContainer title={title} subtitle={subtitle} isEmpty={chartData.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="horizontal" margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
          <XAxis
            dataKey="name"
            stroke="#9CA3AF"
            interval={0}
            angle={-45}
            textAnchor="end"
            tick={{ fontSize: 10 }}
          />
          <YAxis
            stroke="#9CA3AF"
            allowDecimals={false}
            tickFormatter={(value) => formatNumber(value, 0)}
          />
          <Tooltip
            cursor={{ fill: 'rgba(147, 197, 253, 0.1)' }}
            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '0.5rem' }}
            formatter={(value: number) => [formatNumber(value, 0), "Unique Venues"]}
          />
          {timeSelection.mode !== 'none' ? (
            <>
              <Legend verticalAlign="top" wrapperStyle={{ top: -4, right: 0 }} />
              <Bar dataKey="primary" name={primaryLabel} fill="#8884d8" barSize={15} onClick={(d) => onFilter(d.name)} />
              <Bar dataKey="comparison" name={comparisonLabel} fill="#82ca9d" barSize={15} onClick={(d) => onFilter(d.name)} />
            </>
          ) : (
            <Bar dataKey="value" name="Unique Venues" barSize={30} fill="#8884d8" onClick={(d) => onFilter(d.name)} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default BrandOwnerPerformanceChart;