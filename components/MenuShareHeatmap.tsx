import { useMemo, FC, CSSProperties } from 'react';
import type { MenuItem, TimeSelection } from '../types';
import { formatPeriod } from '../utils/timeUtils';

interface MenuShareHeatmapProps {
  data: MenuItem[];
  timeSelection: TimeSelection;
}

interface HeatmapData {
  venues: string[];
  brandOwners: string[];
  matrix: Record<string, Record<string, number>>;
}

const MenuShareHeatmap: FC<MenuShareHeatmapProps> = ({ data, timeSelection }) => {
  const heatmapData = useMemo<HeatmapData | null>(() => {
    if (data.length === 0) return null;

    const venues: string[] = [...new Set<string>(data.map(item => item.insegna))].sort();
    const brandOwners: string[] = [...new Set<string>(data.map(item => item.brandOwner))].sort();

    const matrix: Record<string, Record<string, number>> = {};

    for (const venue of venues) {
      matrix[venue] = {};
      const venueItems = data.filter(item => item.insegna === venue);
      const totalItemsInVenue = venueItems.length;

      if (totalItemsInVenue === 0) {
        brandOwners.forEach(owner => {
          matrix[venue][owner] = 0;
        });
        continue;
      }

      for (const owner of brandOwners) {
        const ownerItemsInVenue = venueItems.filter(item => item.brandOwner === owner).length;
        matrix[venue][owner] = (ownerItemsInVenue / totalItemsInVenue) * 100;
      }
    }

    const allBrandOwnersSorted = brandOwners.map(owner => ({
      name: owner,
      total: data.filter(item => item.brandOwner === owner).length
    })).sort((a, b) => b.total - a.total).map(item => item.name);


    return { venues, brandOwners: allBrandOwnersSorted, matrix };
  }, [data]);

  const getCellStyle = (percentage: number): CSSProperties => {
    if (percentage <= 0) {
      return { backgroundColor: 'transparent', color: '#6b7280' }; // gray-500 for text
    }
    const intensity = 0.15 + (percentage / 100) * 0.85;
    return {
      backgroundColor: `rgba(20, 184, 166, ${intensity})`, // teal-500 with variable alpha
      color: percentage > 40 ? 'white' : '#e5e7eb' // gray-200
    };
  };

  const subtitle = timeSelection.mode !== 'none' ? `Data for ${formatPeriod(timeSelection.periodA, timeSelection.mode)}` : undefined;

  if (!heatmapData || heatmapData.venues.length === 0) {
    return (
      <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg h-[450px] flex flex-col items-center justify-center">
        <h3 className="text-lg font-semibold text-gray-200 mb-2">Menu Share Heatmap (% by Brand Owner)</h3>
        {subtitle && <p className="text-xs text-gray-400 mb-4">{subtitle}</p>}
        <p className="text-gray-500">No data available for the current selection.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg h-[450px] flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-200">Menu Share Heatmap (% by Brand Owner)</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className="flex-grow overflow-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="sticky top-0 bg-gray-800">
            <tr className="border-b border-gray-700">
              <th scope="col" className="py-3 px-4 font-medium text-gray-300 w-1/4">Venue</th>
              {heatmapData.brandOwners.map(owner => (
                <th key={owner} scope="col" className="py-3 px-4 font-medium text-gray-300 text-center">{owner}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {heatmapData.venues.map(venue => (
              <tr key={venue} className="hover:bg-gray-700/50">
                <td className="py-3 px-4 font-medium text-gray-200 whitespace-nowrap">{venue}</td>
                {heatmapData.brandOwners.map(owner => {
                  const percentage = heatmapData.matrix[venue][owner] || 0;
                  return (
                    <td key={owner} className="py-2 px-4 text-center">
                      <div
                        className="p-2 rounded-md transition-all duration-200"
                        style={getCellStyle(percentage)}
                      >
                        {percentage.toFixed(1)}%
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MenuShareHeatmap;
