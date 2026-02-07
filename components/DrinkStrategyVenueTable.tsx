import { useMemo, useState, FC } from 'react';
import type { MenuItem } from '../types';
import { isCocktailMatch } from '../utils/cocktailUtils';

interface DrinkStrategyVenueTableProps {
    data: MenuItem[];
    selectedCocktail: string;
    selectedBrand: string;
}

const DrinkStrategyVenueTable: FC<DrinkStrategyVenueTableProps> = ({ data, selectedCocktail, selectedBrand }) => {
    const [sortField, setSortField] = useState<keyof MenuItem | 'brandUsed'>('insegna');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filter venues that serve the selected cocktail
    const venueData = useMemo(() => {
        if (!selectedCocktail) return [];

        // 1. Group by Venue
        const venues = new Map<string, {
            insegna: string;
            citta: string;
            regione: string;
            brandUsed: string;
            isSelectedBrand: boolean;
            price: number;
        }>();

        data.forEach(item => {
            if (isCocktailMatch(item.nomeCocktail, selectedCocktail)) {
                const existing = venues.get(item.insegna);
                const isTargetBrand = item.brand === selectedBrand;

                if (!existing) {
                    venues.set(item.insegna, {
                        insegna: item.insegna,
                        citta: item.citta,
                        regione: item.regione,
                        brandUsed: item.brand,
                        isSelectedBrand: isTargetBrand,
                        price: item.prezzo
                    });
                } else {
                    // Update if we find the brand in this venue (even if previous item didn't have it)
                    if (isTargetBrand) {
                        existing.brandUsed = item.brand;
                        existing.isSelectedBrand = true;
                    }
                }
            }
        });

        const allVenues = Array.from(venues.values());

        // If a brand is selected, we still want to show ALL venues serving the cocktail
        // but sorting or highlighting will handle the distinction.
        // Previously we filtered: if (selectedBrand) return allVenues.filter(v => v.isSelectedBrand);

        return allVenues;
    }, [data, selectedCocktail, selectedBrand]);

    const sortedData = useMemo(() => {
        return [...venueData].sort((a, b) => {
            let aValue: any = a[sortField === 'brandUsed' ? 'brandUsed' : sortField as keyof typeof a];
            let bValue: any = b[sortField === 'brandUsed' ? 'brandUsed' : sortField as keyof typeof b];

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [venueData, sortField, sortDirection]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedData, currentPage]);

    const totalPages = Math.ceil(venueData.length / itemsPerPage);

    const downloadCSV = () => {
        const headers = ['Venue Name', 'City', 'Region', 'Brand Used', 'Price'];
        const rows = sortedData.map(item => [
            `"${item.insegna.replace(/"/g, '""')}"`,
            `"${item.citta.replace(/"/g, '""')}"`,
            `"${item.regione.replace(/"/g, '""')}"`,
            `"${(item.brandUsed || '').replace(/"/g, '""')}"`,
            item.price ? item.price.toFixed(2) : ''
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `drink_strategy_venues.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSort = (field: keyof MenuItem | 'brandUsed') => {
        if (field === sortField) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    if (!selectedCocktail) return null;

    return (
        <div className="bg-gray-800/60 backdrop-blur-md rounded-lg shadow-lg border border-gray-700/50 overflow-hidden">
            <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-gray-100">Venue List: {selectedCocktail}</h3>
                    <p className="text-sm text-gray-400">Venues serving {selectedCocktail} ({venueData.length} total)</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={downloadCSV}
                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium rounded-md transition-colors flex items-center gap-2"
                        title="Export to CSV"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('insegna')}>Venue</th>
                            <th className="px-6 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('citta')}>City</th>
                            <th className="px-6 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('regione')}>Region</th>
                            <th className="px-6 py-3 cursor-pointer hover:text-white text-center" onClick={() => handleSort('brandUsed')}>Brand Used</th>
                            <th className="px-6 py-3 cursor-pointer hover:text-white text-right" onClick={() => handleSort('prezzo')}>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((venue, index) => (
                            <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                                <td className="px-6 py-4 font-medium text-white">{venue.insegna}</td>
                                <td className="px-6 py-4">{venue.citta}</td>
                                <td className="px-6 py-4">{venue.regione}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${venue.isSelectedBrand
                                        ? 'bg-teal-900/50 text-teal-400 border-teal-700/50'
                                        : 'bg-gray-700 text-gray-300 border-gray-600'
                                        }`}>
                                        {venue.brandUsed}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">€{venue.price.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center p-4 border-t border-gray-700/50">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded bg-gray-700 text-gray-300 disabled:opacity-50 hover:bg-gray-600"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-400">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded bg-gray-700 text-gray-300 disabled:opacity-50 hover:bg-gray-600"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default DrinkStrategyVenueTable;
