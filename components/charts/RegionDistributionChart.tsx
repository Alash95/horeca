import { useMemo, FC } from 'react';
import { MenuItem, Filters } from '../../types';
import { formatNumber } from '../../utils/formatters';

interface RegionDistributionChartProps {
    allData: MenuItem[]; // All data in the selected period (time-filtered only)
    selectedBrandOwner?: string | string[];
    selectedBrand?: string | string[];
    filters: Filters;
    onRegionSelect: (region: string | null) => void;
}

const REGIONS_BY_AREA: Record<string, string[]> = {
    "Nord": ["Emilia-Romagna", "Friuli-Venezia Giulia", "Liguria", "Lombardia", "Piemonte", "Trentino-Alto Adige", "Valle d'Aosta", "Veneto"],
    "Centro": ["Abruzzo", "Lazio", "Marche", "Molise", "Toscana", "Umbria"],
    "Sud": ["Basilicata", "Calabria", "Campania", "Puglia"],
    "Isole": ["Sardegna", "Sicilia"]
};

const RegionDistributionChart: FC<RegionDistributionChartProps> = ({ allData, selectedBrandOwner, selectedBrand, filters, onRegionSelect }) => {
    const selectedBrandsArray = useMemo(() => {
        if (!selectedBrand) return [];
        return Array.isArray(selectedBrand) ? selectedBrand : [selectedBrand];
    }, [selectedBrand]);

    const selectedOwnersArray = useMemo(() => {
        if (!selectedBrandOwner) return [];
        return Array.isArray(selectedBrandOwner) ? selectedBrandOwner : [selectedBrandOwner];
    }, [selectedBrandOwner]);

    const regionData = useMemo(() => {
        if (selectedBrandsArray.length === 0 && selectedOwnersArray.length === 0) return {};

        let universeData = allData;

        if (filters.macroCategoria.length > 0) {
            universeData = universeData.filter(i => filters.macroCategoria.includes(i.macroCategoria));
        }
        if (filters.tipologiaCliente.length > 0) {
            universeData = universeData.filter(i => filters.tipologiaCliente.includes(i.tipologiaCliente));
        }
        if (filters.categoriaProdotto.length > 0) {
            universeData = universeData.filter(i => filters.categoriaProdotto.includes(i.categoriaProdotto));
        }

        const dataByArea: Record<string, { region: string, percentage: number, ownerVenues: number, totalVenues: number }[]> = {};

        Object.entries(REGIONS_BY_AREA).forEach(([area, regions]) => {
            const mappedRegions = regions.map(region => {
                const regionUniverse = universeData.filter(i => i.regione === region);

                const getVenueKey = (item: MenuItem) => `${item.insegna}-${item.citta}-${item.via}`;
                const totalVenues = new Set(regionUniverse.map(getVenueKey)).size;

                let ownerItems: MenuItem[] = [];
                if (selectedBrandsArray.length > 0) {
                    ownerItems = regionUniverse.filter(i => selectedBrandsArray.includes(i.brand || ''));
                } else if (selectedOwnersArray.length > 0) {
                    ownerItems = regionUniverse.filter(i => selectedOwnersArray.includes(i.brandOwner || ''));
                }

                const ownerVenues = new Set(ownerItems.map(getVenueKey)).size;
                const percentage = totalVenues > 0 ? (ownerVenues / totalVenues) * 100 : 0;

                return {
                    region,
                    percentage,
                    ownerVenues,
                    totalVenues
                };
            });

            dataByArea[area] = mappedRegions.sort((a, b) => b.percentage - a.percentage);
        });

        return dataByArea;

    }, [allData, selectedOwnersArray, selectedBrandsArray, filters]);

    const handleRegionClick = (region: string) => {
        onRegionSelect(region);
    };

    const hasSelection = selectedBrandsArray.length > 0 || selectedOwnersArray.length > 0;

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Regional Presence (Numeric Distribution)</h3>
            </div>

            <div className="space-y-6">
                {hasSelection ? (
                    Object.entries(regionData).map(([area, items]) => (
                        <div key={area} className="flex flex-col sm:flex-row items-start gap-4 border-b border-gray-700 pb-4 last:border-0 last:pb-0">
                            <div className="w-full sm:w-24 flex-shrink-0 pt-2">
                                <h4 className="text-sm font-bold text-teal-400 uppercase tracking-wider">
                                    {area}
                                </h4>
                            </div>
                            <div className="flex flex-wrap gap-2 flex-1">
                                {items.map((item) => {
                                    const isSelected = filters.regione.includes(item.region);
                                    return (
                                        <div
                                            key={item.region}
                                            onClick={() => handleRegionClick(item.region)}
                                            className={`flex flex-col items-center justify-center p-2 rounded-md border min-w-[80px] transition-all cursor-pointer ${isSelected
                                                ? 'bg-teal-600/30 border-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.3)]'
                                                : item.totalVenues === 0
                                                    ? 'bg-gray-800/50 border-gray-700 opacity-50 cursor-not-allowed'
                                                    : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700 hover:border-teal-500/50'
                                                }`}
                                        >
                                            <span className={`text-base font-bold ${item.totalVenues > 0 ? (isSelected ? 'text-white' : 'text-teal-400') : 'text-gray-600'}`}>
                                                {item.percentage.toFixed(0)}%
                                            </span>
                                            <span className={`text-[10px] font-medium text-center leading-tight mt-0.5 ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                                {item.region}
                                            </span>
                                            <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-teal-200' : 'text-gray-500'}`}>
                                                {formatNumber(item.ownerVenues, 0)}/{formatNumber(item.totalVenues, 0)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-500 py-4">
                        Select a Brand or Brand Owner to see distribution data.
                    </div>
                )}
            </div>
        </div>
    );
};

export default RegionDistributionChart;
