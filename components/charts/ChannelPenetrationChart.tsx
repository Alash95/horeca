import { useMemo, FC } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import type { MenuItem, TimeSelection } from '../../types';
import ChartContainer from './ChartContainer';

const CUSTOMER_TYPES = ["Bar", "Ristorante", "Hotel", "Club", "Enoteca"];

interface ChannelPenetrationChartProps {
  allData: MenuItem[];
  ownerData: MenuItem[];
  ownerName: string;
  timeSelection: TimeSelection;
}

const ChannelPenetrationChart: FC<ChannelPenetrationChartProps> = ({ allData, ownerData, ownerName, timeSelection }) => {
  const chartData = useMemo(() => {
    const allBrandOwners = [...new Set(allData.map(item => item.brandOwner))];

    return CUSTOMER_TYPES.map(type => {
      // 1. Total unique venues for this channel
      const allVenuesInChannel = new Set(allData.filter(item => item.tipologiaCliente === type).map(item => item.insegna));
      const totalVenuesInChannel = allVenuesInChannel.size;

      if (totalVenuesInChannel === 0) {
        return {
          name: type,
          owner: 0,
          leader: 0,
          leaderName: 'N/A',
          average: 0,
        };
      }

      // 2. Selected owner's penetration
      const ownerVenuesInChannel = new Set(ownerData.filter(item => item.tipologiaCliente === type).map(item => item.insegna)).size;
      const ownerPenetration = (ownerVenuesInChannel / totalVenuesInChannel) * 100;

      // 3. Find leader and their penetration
      let leaderName = 'N/A';
      let leaderVenues = 0;
      const venuesByOwnerInChannel = allData
        .filter(item => item.tipologiaCliente === type)
        // FIX: Explicitly type the accumulator (`acc`) to fix downstream type inference errors.
        .reduce((acc: Record<string, Set<string>>, item) => {
          if (!acc[item.brandOwner]) {
            acc[item.brandOwner] = new Set<string>();
          }
          acc[item.brandOwner].add(item.insegna);
          return acc;
        }, {} as Record<string, Set<string>>);

      for (const owner in venuesByOwnerInChannel) {
        const venueCount = venuesByOwnerInChannel[owner].size;
        if (venueCount > leaderVenues) {
          leaderVenues = venueCount;
          leaderName = owner;
        }
      }
      const leaderPenetration = (leaderVenues / totalVenuesInChannel) * 100;

      // 4. Calculate market average penetration
      const allPenetrations = allBrandOwners.map(owner => {
        const currentOwnerVenues = venuesByOwnerInChannel[owner]?.size || 0;
        return (currentOwnerVenues / totalVenuesInChannel) * 100;
      });
      const averagePenetration = allPenetrations.length > 0 ? allPenetrations.reduce((sum, p) => sum + p, 0) / allBrandOwners.length : 0;

      return {
        name: type,
        owner: parseFloat(ownerPenetration.toFixed(1)),
        leader: parseFloat(leaderPenetration.toFixed(1)),
        leaderName,
        average: parseFloat(averagePenetration.toFixed(1)),
      };
    });
  }, [allData, ownerData]);

  const subtitle = `Comparing ${ownerName}'s penetration vs. the market leader and average in each channel.`;

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
                finalName = `Leader (${props.payload.leaderName})`;
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