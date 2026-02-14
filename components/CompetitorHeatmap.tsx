import { useMemo, FC, CSSProperties } from 'react';
import type { MenuItem } from '../types';

interface CompetitorHeatmapProps {
    data: MenuItem[];
    primaryEntity: string | string[];
    entityType: 'brandOwner' | 'brand';
    rowType: 'citta' | 'insegna';
    title: string;
}

const CompetitorHeatmap: FC<CompetitorHeatmapProps> = ({ data, primaryEntity, entityType, rowType, title }) => {
    const primaryEntitiesArray = Array.isArray(primaryEntity) ? primaryEntity : [primaryEntity];

    const heatmapData = useMemo(() => {
        if (data.length === 0) return null;

        // 1. Identify Top 5 Competitors (Excluding all primary entities)
        const entityCounts = new Map<string, number>();
        data.forEach(item => {
            const entity = item[entityType] as string;
            if (entity && !primaryEntitiesArray.includes(entity)) {
                entityCounts.set(entity, (entityCounts.get(entity) || 0) + 1);
            }
        });

        const topCompetitors = Array.from(entityCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(entry => entry[0]);

        // Columns: "Primary Set" (Aggregated) followed by top competitors
        const primaryColLabel = primaryEntitiesArray.length > 1 ? `Selected Set` : primaryEntitiesArray[0];
        const columns = [primaryColLabel, ...topCompetitors];

        // 2. Prepare Rows (Cities or Venues)
        const rows = Array.from(new Set(data.map(item => item[rowType] as string))).sort();

        // 3. Build Matrix
        const matrix: Record<string, Record<string, number>> = {};

        rows.forEach(row => {
            matrix[row] = {};
            const rowItems = data.filter(item => (item[rowType] as string) === row);
            const totalItemsInRow = rowItems.length;

            if (totalItemsInRow === 0) {
                columns.forEach(col => matrix[row][col] = 0);
                return;
            }

            columns.forEach((col, idx) => {
                if (idx === 0) {
                    // This is the primary set column
                    const entityItems = rowItems.filter(item => primaryEntitiesArray.includes((item[entityType] as string))).length;
                    matrix[row][col] = (entityItems / totalItemsInRow) * 100;
                } else {
                    const entityItems = rowItems.filter(item => (item[entityType] as string) === col).length;
                    matrix[row][col] = (entityItems / totalItemsInRow) * 100;
                }
            });
        });

        return { rows, columns, matrix };
    }, [data, primaryEntitiesArray, entityType, rowType]);

    const getCellStyle = (percentage: number): CSSProperties => {
        if (percentage <= 0) return { backgroundColor: 'transparent', color: '#6b7280' };
        const intensity = 0.1 + (percentage / 100) * 0.9;
        return {
            backgroundColor: `rgba(20, 184, 166, ${intensity})`, // teal-500
            color: percentage > 40 ? 'white' : '#e5e7eb'
        };
    };

    if (!heatmapData || heatmapData.rows.length === 0) return null;

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 flex flex-col h-[500px]">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">{title}</h3>
            {primaryEntitiesArray.length > 1 && (
                <p className="text-xs text-gray-400 mb-4 italic truncate">
                    Selected: {primaryEntitiesArray.join(', ')}
                </p>
            )}
            <div className="flex-grow overflow-auto">
                <table className="min-w-full text-sm text-left border-collapse">
                    <thead className="sticky top-0 bg-gray-900 z-10">
                        <tr>
                            <th className="py-3 px-4 font-medium text-gray-400 border-b border-gray-700 bg-gray-900">
                                {rowType === 'citta' ? 'City' : 'Venue'}
                            </th>
                            {heatmapData.columns.map((col, idx) => (
                                <th key={col} className={`py-3 px-4 font-medium text-center border-b border-gray-700 bg-gray-900 ${idx === 0 ? 'text-teal-400 font-bold' : 'text-gray-300'}`}>
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {heatmapData.rows.map(row => (
                            <tr key={row} className="hover:bg-gray-700/30 transition-colors">
                                <td className="py-2 px-4 font-medium text-gray-200 bg-gray-800/50 sticky left-0">
                                    {row}
                                </td>
                                {heatmapData.columns.map(col => {
                                    const val = heatmapData.matrix[row][col] || 0;
                                    return (
                                        <td key={`${row}-${col}`} className="py-2 px-2 text-center">
                                            <div
                                                className="py-1 px-2 rounded"
                                                style={getCellStyle(val)}
                                            >
                                                {val.toFixed(1)}%
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CompetitorHeatmap;
