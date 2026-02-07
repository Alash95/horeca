import { useMemo, FC } from 'react';
import type { MenuItem } from '../types';
import { TARGET_COCKTAILS } from '../utils/cocktailUtils';
import { formatNumber } from '../utils/formatters';

interface BrandCocktailHeatmapProps {
    allData: MenuItem[];
    selectedBrand: string;
    selectedCategory: string;
    selectedCocktail?: string | null;
}

const BrandCocktailHeatmap: FC<BrandCocktailHeatmapProps> = ({ allData, selectedBrand, selectedCategory, selectedCocktail }) => {
    const { matrix, cocktails, brands, totals } = useMemo(() => {
        if (!selectedCategory) return { matrix: {}, cocktails: [], brands: [], totals: { row: {}, col: {}, grand: 0 } };

        // 1. Filter data for the category AND the target cocktails
        // We use case-insensitive matching for robustness
        const targetCocktailsLower = TARGET_COCKTAILS.map(c => c.toLowerCase());

        const categoryData = allData.filter(d =>
            d.categoriaProdotto === selectedCategory &&
            d.nomeCocktail &&
            targetCocktailsLower.includes(d.nomeCocktail.toLowerCase())
        );

        // 2. Use Fixed Cocktails for Columns
        const cocktails = TARGET_COCKTAILS;

        // 3. Identify Top Brands (Competitors)
        // Logic: "Competitors most used for the selected brand" -> Top Brands in the same category within these cocktails
        const brandCounts = categoryData.reduce((acc, item) => {
            acc[item.brand] = (acc[item.brand] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topBrands = Object.entries(brandCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(e => e[0]);

        // Ensure selected brand is in the list
        if (!topBrands.includes(selectedBrand)) {
            if (topBrands.length >= 5) topBrands.pop();
            topBrands.unshift(selectedBrand);
        } else {
            // Move selected brand to top
            const idx = topBrands.indexOf(selectedBrand);
            topBrands.splice(idx, 1);
            topBrands.unshift(selectedBrand);
        }

        // 4. Build Matrix
        const matrix: Record<string, Record<string, number>> = {};
        const rowTotals: Record<string, number> = {};
        const colTotals: Record<string, number> = {};
        let grandTotal = 0;

        topBrands.forEach(brand => {
            matrix[brand] = {};
            rowTotals[brand] = 0;
            cocktails.forEach(cocktail => {
                // Case-insensitive match for data
                const venues = new Set(categoryData
                    .filter(d => d.brand === brand && d.nomeCocktail?.toLowerCase() === cocktail.toLowerCase())
                    .map(d => d.insegna)
                ).size;

                matrix[brand][cocktail] = venues;
                rowTotals[brand] += venues;
                colTotals[cocktail] = (colTotals[cocktail] || 0) + venues;
                grandTotal += venues;
            });
        });

        return { matrix, cocktails, brands: topBrands, totals: { row: rowTotals, col: colTotals, grand: grandTotal } };

    }, [allData, selectedCategory, selectedBrand]);

    const getIntensityColor = (value: number) => {
        if (value === 0) return 'bg-gray-800';
        if (value <= 2) return 'bg-yellow-100 text-yellow-800';
        if (value <= 4) return 'bg-orange-200 text-orange-800';
        return 'bg-red-400 text-white';
    };

    if (!selectedCategory) return null;

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Metric 5: Brand × Cocktail Presence Heatmap</h3>
            <p className="text-sm text-gray-400 mb-4">
                Top Brands in Category vs Key Cocktails
            </p>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-center border-separate border-spacing-1">
                    <thead>
                        <tr>
                            <th className="p-3 bg-gray-100 text-gray-700 rounded-l font-semibold text-left">Brand / Cocktail</th>
                            {cocktails.map(c => (
                                <th key={c} className="p-3 bg-indigo-500 text-white font-semibold rounded">{c}</th>
                            ))}
                            <th className="p-3 bg-indigo-600 text-white font-semibold rounded-r">Total Placements</th>
                        </tr>
                    </thead>
                    <tbody>
                        {brands.map(brand => (
                            <tr key={brand}>
                                <td className={`p-3 font-medium text-left rounded-l ${brand === selectedBrand ? 'bg-blue-50 text-blue-900 border-l-4 border-blue-500' : 'bg-gray-50 text-gray-700'}`}>
                                    {brand}
                                </td>
                                {cocktails.map(cocktail => (
                                    <td key={`${brand}-${cocktail}`} className={`p-3 rounded font-medium ${getIntensityColor(matrix[brand][cocktail])}`}>
                                        {formatNumber(matrix[brand][cocktail], 0) || '-'}
                                    </td>
                                ))}
                                <td className="p-3 bg-indigo-500 text-white font-bold rounded-r">
                                    {formatNumber(totals.row[brand], 0)}
                                </td>
                            </tr>
                        ))}
                        {/* Total Row */}
                        <tr>
                            <td className="p-3 bg-indigo-600 text-white font-bold rounded-l text-left">Total</td>
                            {cocktails.map(c => (
                                <td key={`total-${c}`} className="p-3 bg-indigo-500 text-white font-bold rounded">
                                    {formatNumber(totals.col[c], 0)}
                                </td>
                            ))}
                            <td className="p-3 bg-indigo-700 text-white font-bold rounded-r">{formatNumber(totals.grand, 0)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                <span>Intensity:</span>
                <div className="flex items-center gap-1"><span className="w-4 h-4 bg-gray-800 border border-gray-600 rounded"></span> None (0)</div>
                <div className="flex items-center gap-1"><span className="w-4 h-4 bg-yellow-100 rounded"></span> Low (1-2)</div>
                <div className="flex items-center gap-1"><span className="w-4 h-4 bg-orange-200 rounded"></span> Medium (3-4)</div>
                <div className="flex items-center gap-1"><span className="w-4 h-4 bg-red-400 rounded"></span> High (5+)</div>
            </div>
        </div>
    );
};

export default BrandCocktailHeatmap;
