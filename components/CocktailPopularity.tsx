import { useMemo, FC } from 'react';
import type { MenuItem } from '../types';

interface CocktailPopularityProps {
    data: MenuItem[];
}

const CocktailPopularity: FC<CocktailPopularityProps> = ({ data }) => {
    const popularityData = useMemo(() => {
        if (data.length === 0) return [];

        const totalVenues = new Set(data.map(d => d.insegna)).size;
        if (totalVenues === 0) return [];

        const cocktailVenues = new Map<string, Set<string>>();

        data.forEach(item => {
            if (item.nomeCocktail && item.nomeCocktail !== 'N/A') {
                if (!cocktailVenues.has(item.nomeCocktail)) {
                    cocktailVenues.set(item.nomeCocktail, new Set());
                }
                cocktailVenues.get(item.nomeCocktail)?.add(item.insegna);
            }
        });

        const sortedCocktails = Array.from(cocktailVenues.entries())
            .map(([cocktail, venues]) => ({
                name: cocktail,
                count: venues.size,
                percentage: (venues.size / totalVenues) * 100
            }))
            .sort((a, b) => b.percentage - a.percentage);

        return sortedCocktails;
    }, [data]);

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-96 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Cocktail Popularity (% of Venues)</h3>
            <div className="flex-grow overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700/50 sticky top-0">
                        <tr>
                            <th className="px-4 py-2">Rank</th>
                            <th className="px-4 py-2">Cocktail</th>
                            <th className="px-4 py-2 text-right">% Citation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {popularityData.map((item, index) => (
                            <tr key={item.name} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                <td className="px-4 py-2.5 font-medium text-gray-500">{index + 1}</td>
                                <td className="px-4 py-2.5 font-medium text-gray-200">{item.name}</td>
                                <td className="px-4 py-2.5 text-right font-semibold text-teal-400">
                                    {item.percentage.toFixed(1)}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {popularityData.length === 0 && (
                    <div className="text-center text-gray-500 mt-10">No cocktail data available</div>
                )}
            </div>
        </div>
    );
};

export default CocktailPopularity;
