import { useMemo, FC } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { MenuItem } from '../types';

interface ChannelDistributionProps {
    data: MenuItem[];
}

const ChannelDistribution: FC<ChannelDistributionProps> = ({ data }) => {
    const chartData = useMemo(() => {
        if (data.length === 0) return [];

        const typologyCounts = new Map<string, Set<string>>();

        data.forEach(item => {
            if (item.tipologiaCliente) {
                if (!typologyCounts.has(item.tipologiaCliente)) {
                    typologyCounts.set(item.tipologiaCliente, new Set());
                }
                typologyCounts.get(item.tipologiaCliente)?.add(item.insegna);
            }
        });

        const result = Array.from(typologyCounts.entries()).map(([name, venues]) => ({
            name,
            value: venues.size
        })).sort((a, b) => b.value - a.value);

        return result;
    }, [data]);

    // Custom colors for bars
    const COLORS = ['#2dd4bf', '#818cf8', '#f472b6', '#fb923c', '#34d399', '#a78bfa'];

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-96 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Channel Distribution (Tracked Venues)</h3>
            <div className="flex-grow w-full min-h-0">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                            <XAxis type="number" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis
                                type="category"
                                dataKey="name"
                                stroke="#9ca3af"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                width={100}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#e5e7eb' }}
                                itemStyle={{ color: '#2dd4bf' }}
                                cursor={{ fill: '#374151', opacity: 0.4 }}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        No data available
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChannelDistribution;
