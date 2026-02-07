import { useMemo, FC } from 'react';
import type { MenuItem } from '../types';
import { formatNumber } from '../utils/formatters';

interface ChannelMetrics {
  name: string;
  ownerPenetration: number;
  competitorPenetration: number;
  competitorVenues: number;
  totalVenues: number;
  ownerVenues: number;
}

interface ChannelPenetrationMetricsProps {
  allData: MenuItem[];
  ownerData: MenuItem[];
  ownerName?: string;
  selectedBrand?: string;
  selectedCategory?: string;
}

const ChannelPenetrationMetrics: FC<ChannelPenetrationMetricsProps> = ({ allData, ownerData, ownerName, selectedBrand, selectedCategory }) => {
  const channelMetrics = useMemo<ChannelMetrics[]>(() => {
    // Determine the universe of entities (Owners or Brands)
    const allEntities = selectedBrand
      ? [...new Set(allData.filter(i => !selectedCategory || i.categoriaProdotto === selectedCategory).map(item => item.brand))]
      : [...new Set(allData.map(item => item.brandOwner))];

    // Dynamically get all unique customer types from the data
    const customerTypes = [...new Set(allData.map(item => item.tipologiaCliente))].sort();

    return customerTypes.map(type => {
      // 1. Total unique venues for this channel
      const allVenuesInChannel = new Set(allData.filter(item => item.tipologiaCliente === type).map(item => item.venueId).filter(Boolean));
      const totalVenuesInChannel = allVenuesInChannel.size;

      if (totalVenuesInChannel === 0) {
        return {
          name: type,
          ownerPenetration: 0,
          competitorPenetration: 0,
          competitorVenues: 0,
          totalVenues: 0,
          ownerVenues: 0,
        };
      }

      // 2. Selected owner's (or brand's) stats
      // Note: ownerData passed in should already be filtered for the specific entity (Brand or Owner)
      const entityItemsInChannel = ownerData.filter(item => item.tipologiaCliente === type);
      const entityVenuesInChannel = new Set(entityItemsInChannel.map(item => item.venueId).filter(Boolean)).size;
      const entityPenetration = (entityVenuesInChannel / totalVenuesInChannel) * 100;
      // 3. Competitor stats (inverse of owner)
      const competitorVenues = totalVenuesInChannel - entityVenuesInChannel;
      const competitorPenetration = totalVenuesInChannel > 0 ? (competitorVenues / totalVenuesInChannel) * 100 : 0;

      return {
        name: type,
        ownerPenetration: parseFloat(entityPenetration.toFixed(1)),
        competitorPenetration: parseFloat(competitorPenetration.toFixed(1)),
        competitorVenues,
        totalVenues: totalVenuesInChannel,
        ownerVenues: entityVenuesInChannel,
      };
    });
  }, [allData, ownerData, ownerName, selectedBrand, selectedCategory]);

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-gray-200">Channel Penetration</h3>
      <p className="text-xs text-gray-400 mt-1 mb-4">
        Comparing {selectedBrand || ownerName}'s penetration vs. the market leader and average in each channel.
      </p>

      <div className="grid grid-cols-1 gap-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {channelMetrics.map(metric => (
            <div key={metric.name} className="bg-gray-900/50 p-4 rounded-lg">
              <div className="text-center mb-3">
                <h4 className="font-bold text-gray-300">{metric.name}</h4>
                <p className="text-xs text-gray-500">Universe: {formatNumber(metric.totalVenues, 0)} venues</p>
              </div>
              <div className="space-y-3 text-sm">
                {/* Selected Owner */}
                <div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-teal-400 font-semibold truncate" title={selectedBrand || ownerName}>{selectedBrand || ownerName}</span>
                    <span className="font-mono text-lg font-bold text-teal-300">{metric.ownerPenetration.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>{formatNumber(metric.ownerVenues, 0)} / {formatNumber(metric.totalVenues, 0)} venues</span>
                  </div>
                </div>
                {/* Divider */}
                <div className="border-t border-gray-700"></div>

                {/* Competitors */}
                <div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-400 font-semibold truncate">Competitors</span>
                    <span className="font-mono text-lg font-bold text-gray-300">{metric.competitorPenetration.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>{formatNumber(metric.competitorVenues, 0)} / {formatNumber(metric.totalVenues, 0)} venues</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>

  );
};

export default ChannelPenetrationMetrics;