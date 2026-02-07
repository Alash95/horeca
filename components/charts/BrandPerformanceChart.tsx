import { useMemo, FC } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import type { MenuItem, Filters, TimeSelection } from '../../types';
import { formatPeriod } from '../../utils/timeUtils';
import { formatNumber } from '../../utils/formatters';
import ChartContainer from './ChartContainer';

interface BrandPerformanceChartProps {
  allData: MenuItem[]; // This is allInPrimaryPeriod
  allInComparisonPeriod: MenuItem[];
  primaryData: MenuItem[];
  comparisonData: MenuItem[];
  filters: Filters;
  timeSelection: TimeSelection;
  onFilter: (brand: string | null) => void;
}

const BrandPerformanceChart: FC<BrandPerformanceChartProps> = ({ allData, allInComparisonPeriod, primaryData, comparisonData, filters, timeSelection, onFilter }) => {
  const { chartData, primaryLabel, comparisonLabel } = useMemo(() => {
    const isComparisonMode = timeSelection.mode !== 'none';

    const calculateVenueCounts = (data: MenuItem[]) => {
      const itemsByBrand = data.reduce((acc, item) => {
        if (!acc[item.brand]) {
          acc[item.brand] = new Set();
        }
        acc[item.brand].add(item.insegna);
        return acc;
      }, {} as Record<string, Set<string>>);
      return Object.entries(itemsByBrand).reduce((acc, [brand, venues]) => {
        acc[brand] = venues.size;
        return acc;
      }, {} as Record<string, number>);
    };

    const primaryCounts = calculateVenueCounts(primaryData);

    if (!isComparisonMode) {
      const singlePeriodData = Object.entries(primaryCounts)
        .map(([name, value]) => ({
          name,
          value: value
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      return { chartData: singlePeriodData, primaryLabel: '', comparisonLabel: '' };
    }

    const comparisonCounts = calculateVenueCounts(comparisonData);

    const allBrands = new Set([...Object.keys(primaryCounts), ...Object.keys(comparisonCounts)]);
    const combinedData = Array.from(allBrands).map(brand => ({
      name: brand,
      primary: primaryCounts[brand] || 0,
      comparison: comparisonCounts[brand] || 0,
    }));

    const top10Combined = combinedData.sort((a, b) => (b.primary + b.comparison) - (a.primary + a.comparison)).slice(0, 10);

    return {
      chartData: top10Combined,
      primaryLabel: formatPeriod(timeSelection.periodA, timeSelection.mode),
      comparisonLabel: formatPeriod(timeSelection.periodB, timeSelection.mode),
    };
  }, [primaryData, comparisonData, timeSelection]);

  const title = filters.macroCategoria.length > 0
    ? `Brand Performance in ${filters.macroCategoria.join(', ')}`
    : 'Brand Performance by Unique Venues';

  const subtitle = timeSelection.mode === 'none' ? 'Top 10 by # of Venues' : `Comparing ${primaryLabel} vs ${comparisonLabel}`;

  return (
    <ChartContainer title={title} subtitle={subtitle} isEmpty={chartData.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 70 }}>
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
              <Bar dataKey="primary" name={primaryLabel} fill="#00C49F" barSize={15} onClick={(d) => onFilter(d.name)} />
              <Bar dataKey="comparison" name={comparisonLabel} fill="#FFBB28" barSize={15} onClick={(d) => onFilter(d.name)} />
            </>
          ) : (
            <Bar dataKey="value" name="Unique Venues" barSize={20} fill="#00C49F" onClick={(d) => onFilter(d.name)} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default BrandPerformanceChart;