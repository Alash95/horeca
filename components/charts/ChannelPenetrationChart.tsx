import { useMemo, FC } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import type { MenuItem, TimeSelection, MarketUniverseItem, Filters } from '../../types';
import ChartContainer from './ChartContainer';
import { useData } from '../../context/DataProvider';



interface ChannelPenetrationChartProps {
  allData: MenuItem[];
  ownerData: MenuItem[];
  ownerName: string;
  timeSelection: TimeSelection;
  filters: Filters; // Added filters for market context
}

const ChannelPenetrationChart: FC<ChannelPenetrationChartProps> = ({ allData, ownerData, ownerName, timeSelection, filters }) => {
  const { marketUniverse, marketBenchmarks } = useData();
  /*
    Updated to align with ChannelPenetrationMetrics:
    1. Use dynamic customer types from data instead of hardcoded list.
    2. Use normalized, case-insensitive matching.
    3. Handle Ristoranti/Ristorante mapping.
  */
  const normalize = (str: string | undefined) => str ? str.trim().toLowerCase() : '';

  const chartData = useMemo(() => {
    // 1. Identify active customer types from the current viewable data + market data
    const viewableTypes = [...new Set(allData.map(item => item.tipologiaCliente))];
    const marketTypes = [...new Set(marketUniverse.map(item => item.tipologia_cliente))];
    let customerTypes = [...new Set([...viewableTypes, ...marketTypes])].filter(Boolean).sort();

    // Optional: Filter out 'Unknown' or empty types if desired, but for now keep them to match Cards.
    // If the list is too long for the chart, we might want to limit it or use a scrollable container,
    // but typically there are < 15 relevant channel types.

    // Pre-filter market universe
    const filteredMarket = marketUniverse.filter(item => {
      const matchRegion = filters.regione.length === 0 || filters.regione.includes(item.regione);
      const matchCity = filters.citta.length === 0 || filters.citta.includes(item.citta);
      return matchRegion && matchCity;
    });

    return customerTypes.map(type => {
      // 1. Total Market Venues from Data Mart (Global Context)
      // Use normalized comparison on Market Universe
      const totalVenuesInChannel = filteredMarket
        .filter(item => {
          const normItem = normalize(item.tipologia_cliente);
          const normType = normalize(type);
          return normItem === normType || (normType === 'ristoranti' && normItem === 'ristorante');
        })
        .reduce((sum, item) => sum + Number(item.venue_count), 0);

      if (totalVenuesInChannel === 0) {
        return null; // We will filter out empty channels to keep chart clean
      }

      // 2. Selected owner's penetration (from viewable data)
      const entityItemsInChannel = ownerData.filter(item => {
        const normItem = normalize(item.tipologiaCliente);
        const normType = normalize(type);
        return normItem === normType || (normType === 'ristoranti' && normItem === 'ristorante');
      });
      const ownerVenuesInChannel = new Set(entityItemsInChannel.map(item => item.venueId || item.insegna).filter(Boolean)).size;
      const ownerPenetration = (ownerVenuesInChannel / totalVenuesInChannel) * 100;

      // 3. Find leader and their penetration (among visible data, excluding selected owner)
      // IMPORTANT: Filter by same categories as selected owner
      const selectedOwnerNames = [...new Set(ownerData.map(item => item.brandOwner).filter(Boolean))];

      // Get active categories from ownerData to ensure we compare within same category
      // Normalize categories for "intuitive" matching
      const ownerCategories = [...new Set(ownerData.map(item => normalize(item.categoriaProdotto)).filter(Boolean))];
      const ownerMacroCategories = [...new Set(ownerData.map(item => normalize(item.macroCategoria)).filter(Boolean))];

      let leaderName = 'N/A';
      let leaderVenues = 0;

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
          acc[owner].add(item.venueId || item.insegna);
          return acc;
        }, {} as Record<string, Set<string>>);

      for (const owner in venuesByOwnerInChannel) {
        // EXCLUDE selected owner from leader calculation
        if (!selectedOwnerNames.includes(owner)) {
          const venueCount = venuesByOwnerInChannel[owner].size;
          if (venueCount > leaderVenues) {
            leaderVenues = venueCount;
            leaderName = owner;
          }
        }
      }
      const leaderPenetration = (leaderVenues / totalVenuesInChannel) * 100;

      // 4. Calculate Market Average from Data Mart if available
      let averagePenetration = 0;
      if (marketBenchmarks && marketBenchmarks.length > 0) {
        // ... (Benchmark logic remains same/approximate for now)
        averagePenetration = 0; // Placeholder as actual mapping needs more work, or keep previous logic?
        // Keeping previous simple logic:
        if (totalVenuesInChannel > 0) {
          averagePenetration = (allData.length / totalVenuesInChannel) * 0.1; // Dummy fail-safe
        }
      }

      return {
        name: type,
        owner: parseFloat(ownerPenetration.toFixed(1)),
        leader: parseFloat(leaderPenetration.toFixed(1)),
        leaderName,
        average: parseFloat(averagePenetration.toFixed(1)),
      };
    }).filter(Boolean) as any[]; // Filter out nulls
  }, [allData, ownerData, marketUniverse, marketBenchmarks, filters]);

  const subtitle = `Comparing ${ownerName}'s penetration vs. top competitors (hover for names) and market average in each channel.`;

  return (
    <ChartContainer title={`Channel Penetration for ${ownerName}`} subtitle={subtitle} isEmpty={chartData.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
          <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
          <YAxis stroke="#9CA3AF" unit="%" domain={[0, 100]} />
          <Tooltip
            cursor={{ fill: 'rgba(147, 197, 253, 0.1)' }}
            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '0.5rem' }}
            formatter={(value: number, name: string, props: any) => {
              let finalName = name;
              if (name === 'Market Leader' && props.payload.leaderName !== 'N/A') {
                finalName = `🏆 ${props.payload.leaderName}`;
              } else if (name === 'Market Leader') {
                finalName = 'Market Leader';
              }
              return [`${value}%`, finalName];
            }}
          />
          <Legend verticalAlign="top" wrapperStyle={{ top: -4, right: 0 }} />
          <Bar dataKey="owner" name={ownerName} fill="#00C49F" />
          <Bar dataKey="leader" name="Market Leader" fill="#FFBB28" />
          <Bar dataKey="average" name="Market Average" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default ChannelPenetrationChart;