import { useMemo, FC } from 'react';
import type { MenuItem } from '../types';

interface PortfolioBreadthTableProps {
  allDataInPeriod: MenuItem[];
  selectedOwnerName: string;
}

const PortfolioBreadthTable: FC<PortfolioBreadthTableProps> = ({ allDataInPeriod, selectedOwnerName }) => {
  const analysis = useMemo(() => {
    const calculateBreadth = (data: MenuItem[]) => {
      if (data.length === 0) return 0;
      const uniqueVenues = new Set(data.map(item => item.insegna)).size;
      const uniqueBrands = new Set(data.map(item => item.brand)).size;
      return uniqueVenues > 0 ? uniqueBrands / uniqueVenues : 0;
    };

    // Group data by Brand Owner
    // FIX: Explicitly type the accumulator (`acc`) to correctly infer the return type of reduce.
    const dataByOwner = allDataInPeriod.reduce((acc: Record<string, MenuItem[]>, item) => {
      if (!acc[item.brandOwner]) {
        acc[item.brandOwner] = [];
      }
      acc[item.brandOwner].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);

    // Calculate breadth for each owner
    const breadthsByOwner = Object.entries(dataByOwner).map(([name, data]) => ({
      name,
      breadth: calculateBreadth(data)
    }));

    // Find Market Leader
    let marketLeader = { name: 'N/A', breadth: 0 };
    if (breadthsByOwner.length > 0) {
      marketLeader = breadthsByOwner.reduce((leader, current) => current.breadth > leader.breadth ? current : leader, breadthsByOwner[0]);
    }

    // Calculate Market Average
    const totalBreadth = breadthsByOwner.reduce((sum, item) => sum + item.breadth, 0);
    const marketAverageBreadth = breadthsByOwner.length > 0 ? totalBreadth / breadthsByOwner.length : 0;

    // Get selected owner's breadth
    const selectedOwnerData = dataByOwner[selectedOwnerName] || [];
    const selectedOwnerBreadth = calculateBreadth(selectedOwnerData);

    return {
      selectedOwnerBreadth,
      marketLeader,
      marketAverageBreadth
    };
  }, [allDataInPeriod, selectedOwnerName]);

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg h-full">
      <h3 className="text-lg font-semibold text-gray-200 mb-4">Portfolio Breadth (Unique Brands per Outlet)</h3>
      <p className="text-xs text-gray-400 mb-4">
        Measures the ability to cross-sell by calculating the average number of unique brands sold per venue. A higher value indicates a stronger, more diversified presence.
      </p>
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-teal-900/30 p-3 rounded-lg">
          <span className="font-bold text-teal-300">{selectedOwnerName} (You)</span>
          <span className="text-2xl font-bold text-teal-300 font-mono">{analysis.selectedOwnerBreadth.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg">
          <div>
            <span className="font-semibold text-gray-300">Market Leader <span title="Market Leader">👑</span></span>
            <p className="text-xs text-gray-500 truncate">({analysis.marketLeader.name})</p>
          </div>
          <span className="text-2xl font-semibold text-gray-200 font-mono">{analysis.marketLeader.breadth.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg">
          <span className="font-semibold text-gray-300">Market Average</span>
          <span className="text-2xl font-semibold text-gray-200 font-mono">{analysis.marketAverageBreadth.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default PortfolioBreadthTable;