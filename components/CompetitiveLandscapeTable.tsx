import React, { useMemo } from 'react';
import type { MenuItem } from '../types';
import { formatNumber } from '../utils/formatters';

interface CompetitiveLandscapeTableProps {
    allData: MenuItem[];
    filteredData: MenuItem[]; // Data with current filters applied (for context)
    selectedBrand: string | string[];
    selectedCategory: string;
}

const CompetitiveLandscapeTable: React.FC<CompetitiveLandscapeTableProps> = ({ allData, filteredData, selectedBrand, selectedCategory }) => {
    const selectedBrandsArray = Array.isArray(selectedBrand) ? selectedBrand : [selectedBrand];

    const competitors = useMemo(() => {
        if (!selectedCategory) return [];

        // Find all competitors in the same category across the entire dataset
        const competitorBrands = allData.filter(item =>
            item.categoriaProdotto === selectedCategory &&
            !selectedBrandsArray.includes(item.brand || '')
        );

        const competitorCounts = competitorBrands.reduce((acc: Record<string, number>, item) => {
            acc[item.brand] = (acc[item.brand] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const competitorPrices = allData.filter(item => item.categoriaProdotto === selectedCategory).reduce((acc: Record<string, { total: number, count: number }>, item) => {
            if (!acc[item.brand]) {
                acc[item.brand] = { total: 0, count: 0 };
            }
            acc[item.brand].total += item.prezzo;
            acc[item.brand].count++;
            return acc;
        }, {} as Record<string, { total: number, count: number }>);

        return Object.entries(competitorCounts)
            .map(([name, listings]) => {
                const avgPrice = (competitorPrices[name].total / competitorPrices[name].count) || 0;
                return { name, listings, avgPrice };
            })
            .sort((a, b) => b.listings - a.listings)
            .slice(0, 5); // Top 5 competitors

    }, [allData, selectedBrandsArray, selectedCategory]);

    const selectedBrandAvgPrice = useMemo(() => {
        if (filteredData.length === 0) return 0;
        const brandData = filteredData.filter(i => selectedBrandsArray.includes(i.brand || ''));
        if (brandData.length === 0) return 0;
        const total = brandData.reduce((acc: number, item) => acc + item.prezzo, 0);
        return total / brandData.length;
    }, [filteredData, selectedBrandsArray]);

    const displayBrandName = selectedBrandsArray.length > 1 ? `${selectedBrandsArray.length} Selected Brands` : selectedBrandsArray[0];

    if (!selectedCategory) {
        return (
            <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg h-full flex items-center justify-center">
                <p className="text-gray-500 text-center">Select a category to see competitive landscape.</p>
            </div>
        );
    }

    if (competitors.length === 0) {
        return (
            <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg h-full flex items-center justify-center">
                <p className="text-gray-500 text-center">No direct competitors found in this category.</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg h-full">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Competitive Landscape: {selectedCategory}</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                    <thead className="border-b border-gray-700">
                        <tr>
                            <th scope="col" className="py-2 px-3 font-medium text-gray-300">Brand</th>
                            <th scope="col" className="py-2 px-3 font-medium text-gray-300 text-right">Total Listings</th>
                            <th scope="col" className="py-2 px-3 font-medium text-gray-300 text-right">Avg. Price</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        <tr className="bg-teal-900/30">
                            <td className="py-3 px-3 font-bold text-teal-300">{displayBrandName} (You)</td>
                            <td className="py-3 px-3 font-bold text-teal-300 text-right font-mono">{formatNumber(filteredData.filter(i => selectedBrandsArray.includes(i.brand || '')).length, 0)}</td>
                            <td className="py-3 px-3 font-bold text-teal-300 text-right font-mono">€{selectedBrandAvgPrice.toFixed(2)}</td>
                        </tr>
                        {competitors.map(c => {
                            const priceDiff = c.avgPrice - selectedBrandAvgPrice;
                            const priceColor = priceDiff > 0 ? 'text-red-400' : 'text-green-400';
                            return (
                                <tr key={c.name} className="hover:bg-gray-700/50">
                                    <td className="py-3 px-3 font-medium text-gray-200">{c.name}</td>
                                    <td className="py-3 px-3 text-gray-300 text-right font-mono">{formatNumber(c.listings, 0)}</td>
                                    <td className="py-3 px-3 text-gray-300 text-right font-mono">€{c.avgPrice.toFixed(2)}
                                        <span className={`ml-2 text-xs ${priceColor}`}>
                                            ({priceDiff > 0 ? '+' : ''}{priceDiff.toFixed(2)})
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CompetitiveLandscapeTable;