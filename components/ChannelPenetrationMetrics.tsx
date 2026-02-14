import { useMemo, FC } from 'react';
import type { MenuItem, Filters } from '../types';
import { formatNumber } from '../utils/formatters';
import { useData } from '../context/DataProvider';

interface ChannelMetrics {
  name: string;
  ownerPenetration: number;
  competitorPenetration: number;
  competitorName: string;
  competitorVenues: number;
  totalVenues: number;
  ownerVenues: number;
}

interface ChannelPenetrationMetricsProps {
  allData: MenuItem[];
  ownerData: MenuItem[];
  ownerName?: string;
  selectedBrand?: string | string[];
  selectedCategory?: string;
  filters: Filters; // Pass filters for market context
  onBrandOwnerClick?: (brandOwner: string) => void; // Drill-down callback
}

const ChannelPenetrationMetrics: FC<ChannelPenetrationMetricsProps> = ({ allData, ownerData, ownerName, selectedBrand, selectedCategory, filters, onBrandOwnerClick }) => {
  const { marketUniverse } = useData();
  const selectedBrandsArray = useMemo(() => {
    if (!selectedBrand) return [];
    return Array.isArray(selectedBrand) ? selectedBrand : [selectedBrand];
  }, [selectedBrand]);

  const displayEntityName = useMemo(() => {
    if (selectedBrandsArray.length > 1) return `${selectedBrandsArray.length} Brands`;
    return selectedBrandsArray[0] || ownerName || 'Selected Entity';
  }, [selectedBrandsArray, ownerName]);

  /* 
    Updated to use normalized matching for robustness.
    We handle "Ristoranti" vs "Ristorante" and case-insensitivity.
  */
  const normalize = (str: string | undefined) => str ? str.trim().toLowerCase() : '';

  const channelMetrics = useMemo<ChannelMetrics[]>(() => {
    // 1. Identify active customer types from the current viewable data + market data
    const viewableTypes = [...new Set(allData.map(item => item.tipologiaCliente))];
    const marketTypes = [...new Set(marketUniverse.map(item => item.tipologia_cliente))];
    const customerTypes = [...new Set([...viewableTypes, ...marketTypes])].filter(Boolean).sort();

    return customerTypes.map(type => {
      // 1. Calculate Market Universe for this channel (Total unique venues)
      // CORRECTED: Use Global Market Universe (filtered by Region/City, but NOT Brand Owner)
      const relevantMarketItems = marketUniverse.filter(item => {
        const matchRegion = filters.regione.length === 0 || filters.regione.includes(item.regione);
        const matchCity = filters.citta.length === 0 || filters.citta.includes(item.citta);
        return matchRegion && matchCity;
      });

      const totalVenuesInChannel = relevantMarketItems
        .filter(item => {
          // Helper matches "Bar" == "bar ", "Ristorante" == "Ristoranti"
          const normItem = normalize(item.tipologia_cliente);
          const normType = normalize(type);
          return normItem === normType || (normType === 'ristoranti' && normItem === 'ristorante');
        })
        .reduce((sum, item) => sum + Number(item.venue_count), 0);

      // 2. Calculate Owner Penetration (Venues with owner's products / Total venues)
      const entityItemsInChannel = ownerData.filter(item => {
        const normItem = normalize(item.tipologiaCliente);
        const normType = normalize(type);
        return normItem === normType || (normType === 'ristoranti' && normItem === 'ristorante');
      });

      const entityVenuesInChannel = new Set(entityItemsInChannel.map(item => item.venueId || item.insegna).filter(Boolean)).size;
      const entityPenetration = totalVenuesInChannel > 0 ? (entityVenuesInChannel / totalVenuesInChannel) * 100 : 0;

      // 5. Calculate top competitor penetration (highest brand owner excluding selected)
      // IMPORTANT: Filter by same categories as selected owner (product category, macro category)
      const selectedOwnerNames = [...new Set(ownerData.map(item => item.brandOwner).filter(Boolean))];

      // Get active categories from ownerData to ensure we compare within same category
      // Normalize categories for "intuitive" matching
      const ownerCategories = [...new Set(ownerData.map(item => normalize(item.categoriaProdotto)).filter(Boolean))];
      const ownerMacroCategories = [...new Set(ownerData.map(item => normalize(item.macroCategoria)).filter(Boolean))];

      // Group venues by brand owner in this channel, filtered by same categories
      const venuesByOwnerInChannel = allData
        .filter(item => {
          // Must be same customer type (channel)
          const normItem = normalize(item.tipologiaCliente);
          const normType = normalize(type);
          const isChannelMatch = normItem === normType || (normType === 'ristoranti' && normItem === 'ristorante');

          if (!isChannelMatch) return false;

          // Must match product category if owner has specific categories
          if (ownerCategories.length > 0 && item.categoriaProdotto && !ownerCategories.includes(normalize(item.categoriaProdotto))) {
            return false;
          }

          // Must match macro category if owner has specific macro categories
          if (ownerMacroCategories.length > 0 && item.macroCategoria && !ownerMacroCategories.includes(normalize(item.macroCategoria))) {
            return false;
          }

          return true;
        })
        .reduce((acc: Record<string, Set<string>>, item) => {
          const owner = item.brandOwner;
          if (!owner) return acc;
          if (!acc[owner]) acc[owner] = new Set<string>();
          const venueKey = item.venueId || item.insegna;
          if (venueKey) acc[owner].add(venueKey);
          return acc;
        }, {} as Record<string, Set<string>>);

      // Find top competitor (excluding selected owner)
      let topCompetitorName = 'Unknown';
      let topCompetitorVenues = 0;

      for (const owner in venuesByOwnerInChannel) {
        if (!selectedOwnerNames.includes(owner)) {
          const venueCount = venuesByOwnerInChannel[owner].size;
          if (venueCount > topCompetitorVenues) {
            topCompetitorVenues = venueCount;
            topCompetitorName = owner;
          }
        }
      }

      const competitorPenetration = totalVenuesInChannel > 0
        ? (topCompetitorVenues / totalVenuesInChannel) * 100
        : 0;

      return {
        name: type,
        ownerPenetration: parseFloat(entityPenetration.toFixed(1)),
        competitorPenetration: parseFloat(competitorPenetration.toFixed(1)),
        competitorName: topCompetitorName,
        competitorVenues: topCompetitorVenues,
        totalVenues: totalVenuesInChannel,
        ownerVenues: entityVenuesInChannel,
      };
    });
  }, [allData, ownerData, marketUniverse, filters.regione, filters.citta]);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-gray-200">Channel Penetration</h3>
      <p className="text-xs text-gray-400 mt-1 mb-4">
        Comparing {displayEntityName}'s penetration vs. the market leader and average in each channel.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {channelMetrics.map(metric => (
          <div key={metric.name} className="bg-gray-900/50 p-4 rounded-lg">
            <div className="text-center mb-3">
              <h4 className="font-bold text-gray-300">{metric.name}</h4>
              <p className="text-[10px] text-teal-400 font-medium">Market Universe: {formatNumber(metric.totalVenues, 0)}</p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-baseline">
                <span className="text-teal-400 font-semibold truncate" title={displayEntityName}>{displayEntityName}</span>
                <span className="font-mono text-lg font-bold text-teal-300">{metric.ownerPenetration.toFixed(1)}%</span>
              </div>
              <div className="border-t border-gray-700"></div>
              <div
                className={`flex justify-between items-baseline ${onBrandOwnerClick ? 'cursor-pointer hover:bg-gray-800/50 p-2 -m-2 rounded transition-colors' : ''}`}
                onClick={() => onBrandOwnerClick?.(metric.competitorName)}
                title={onBrandOwnerClick ? `Click to filter by ${metric.competitorName}` : undefined}
              >
                <span className="text-gray-400 font-semibold truncate" title={metric.competitorName}>
                  {metric.competitorName}
                </span>
                <span className="font-mono text-lg font-bold text-gray-300">{metric.competitorPenetration.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChannelPenetrationMetrics;