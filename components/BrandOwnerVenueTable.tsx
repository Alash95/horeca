import { useState, useMemo, FC } from 'react';
import type { MenuItem } from '../types';
import { formatNumber } from '../utils/formatters';

interface BrandOwnerVenueTableProps {
    data: MenuItem[]; // Context Universe (all items in the region/city)
    brandOwner: string | string[];
    title?: string;
}

interface VenueMetric {
    id: string;
    insegna: string;
    citta: string;
    regione: string;
    tipologiaCliente: string;
    totalItems: number;
    ownerItems: number;
    ownerShare: number;
    otherShare: number;
}

const BrandOwnerVenueTable: FC<BrandOwnerVenueTableProps> = ({ data, brandOwner, title = "Venue List" }) => {
    const brandOwnersArray = Array.isArray(brandOwner) ? brandOwner : [brandOwner];
    const [sortField, setSortField] = useState<keyof VenueMetric>('ownerShare');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const venueMetrics = useMemo(() => {
        const metricsMap = new Map<string, VenueMetric>();

        data.forEach(item => {
            const venueKey = `${item.insegna}-${item.citta}-${item.via}`;

            if (!metricsMap.has(venueKey)) {
                metricsMap.set(venueKey, {
                    id: venueKey,
                    insegna: item.insegna,
                    citta: item.citta,
                    regione: item.regione,
                    tipologiaCliente: item.tipologiaCliente,
                    totalItems: 0,
                    ownerItems: 0,
                    ownerShare: 0,
                    otherShare: 0
                });
            }

            const metric = metricsMap.get(venueKey)!;
            metric.totalItems += 1;
            if (brandOwnersArray.includes(item.brandOwner || '')) {
                metric.ownerItems += 1;
            }
        });

        return Array.from(metricsMap.values()).map(m => ({
            ...m,
            ownerShare: (m.ownerItems / m.totalItems) * 100,
            otherShare: ((m.totalItems - m.ownerItems) / m.totalItems) * 100
        }));
    }, [data, brandOwnersArray]);

    const activeData = venueMetrics;
    const firstOwner = brandOwnersArray[0];
    const displayOwnerName = brandOwnersArray.length > 1 ? `Selected Set` : firstOwner;

    const handleSort = (field: keyof VenueMetric) => {
        if (field === sortField) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const sortedData = useMemo(() => {
        return [...activeData].sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];

            if (aValue === bValue) return 0;

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                const comparison = aValue.localeCompare(bValue);
                return sortDirection === 'asc' ? comparison : -comparison;
            }

            const comparison = (aValue as number) < (bValue as number) ? -1 : 1;
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [activeData, sortField, sortDirection]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedData, currentPage]);

    const totalPages = Math.ceil(activeData.length / itemsPerPage);

    const downloadCSV = () => {
        const headers = ['Venue Name', 'City', 'Region', 'Type', `${displayOwnerName} %`, 'Competitors %'];
        const rows = sortedData.map(item => [
            `"${item.insegna.replace(/"/g, '""')}"`,
            `"${item.citta.replace(/"/g, '""')}"`,
            `"${item.regione.replace(/"/g, '""')}"`,
            `"${item.tipologiaCliente.replace(/"/g, '""')}"`,
            item.ownerShare.toFixed(1),
            item.otherShare.toFixed(1)
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${displayOwnerName.replace(/\s+/g, '_')}_venue_list.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-200">
                        {title}
                        <span className="text-sm font-normal text-gray-400 ml-2">({formatNumber(activeData.length, 0)} venues)</span>
                    </h3>
                    {brandOwnersArray.length > 1 && (
                        <p className="text-xs text-gray-500 italic truncate max-w-md">
                            Analyzed: {brandOwnersArray.join(', ')}
                        </p>
                    )}
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

            {activeData.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                    No venues found matching the current criteria.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="bg-gray-900/50 text-xs uppercase text-gray-400">
                            <tr>
                                <th className="px-6 py-3 cursor-pointer hover:text-teal-400" onClick={() => handleSort('insegna')}>Venue Name</th>
                                <th className="px-6 py-3 cursor-pointer hover:text-teal-400" onClick={() => handleSort('citta')}>City</th>
                                <th className="px-6 py-3 cursor-pointer hover:text-teal-400" onClick={() => handleSort('regione')}>Region</th>
                                <th className="px-6 py-3 cursor-pointer hover:text-teal-400" onClick={() => handleSort('tipologiaCliente')}>Type</th>
                                <th className="px-6 py-3 text-right cursor-pointer hover:text-teal-400" onClick={() => handleSort('ownerShare')}>
                                    {displayOwnerName} %
                                </th>
                                <th className="px-6 py-3 text-right cursor-pointer hover:text-teal-400" onClick={() => handleSort('otherShare')}>Competitors %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {paginatedData.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">{item.insegna}</td>
                                    <td className="px-6 py-4">{item.citta}</td>
                                    <td className="px-6 py-4">{item.regione}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 text-xs rounded-full bg-gray-700 border border-gray-600">
                                            {item.tipologiaCliente}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-teal-300 font-bold">
                                        {item.ownerShare.toFixed(1)}%
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-gray-400">
                                        {item.otherShare.toFixed(1)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {totalPages > 1 && (
                <div className="p-4 border-t border-gray-700 flex justify-between items-center">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-gray-700 rounded text-sm disabled:opacity-50 hover:bg-gray-600 transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-400">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-gray-700 rounded text-sm disabled:opacity-50 hover:bg-gray-600 transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default BrandOwnerVenueTable;
