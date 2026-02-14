import { useState, useMemo, useCallback, useEffect, FC } from 'react';
import type { MenuItem, Filters, TimeSelection } from '../types';
import { getAvailableYears, getDateRangeForPeriod } from '../utils/timeUtils';
import FilterPanel from './FilterPanel';
import OverviewSheet from './sheets/OverviewSheet';
import BrandOwnerSheet from './sheets/BrandOwnerSheet';
import BrandSheet from './sheets/BrandSheet';
import DrinkStrategySheet from './sheets/DrinkStrategySheet';
import InsightsSheet from './sheets/InsightsSheet';
import { useData } from '../context/DataProvider';
import { useLanguage } from '../context/LanguageContext';

type Sheet = 'Overview' | 'Brand Owner' | 'Brand' | 'Drink Strategy' | 'Insights';

const Dashboard: FC = () => {
    const { enrichedData, masterData, loading: dataLoading, error: dataError } = useData();
    const { t } = useLanguage();
    const [activeSheet, setActiveSheet] = useState<Sheet>('Overview');

    const availableYears = useMemo(() => getAvailableYears(enrichedData), [enrichedData]);

    const [filters, setFilters] = useState<Filters>({
        regione: [],
        citta: [],
        tipologiaCliente: [],
        brandOwner: [],
        brand: [],
        macroCategoria: [],
        categoriaProdotto: [],
        cocktail: [],
        insegna: [],
        venueId: [],
    });

    const [timeSelection, setTimeSelection] = useState<TimeSelection>({
        mode: 'none',
        periodA: { year: availableYears[0] || new Date().getFullYear() },
        periodB: { year: (availableYears[0] || new Date().getFullYear()) - 1 },
    });

    // Update time selection if the available years change (e.g. after data upload)
    useEffect(() => {
        if (availableYears.length > 0 && !availableYears.includes(timeSelection.periodA.year)) {
            setTimeSelection(prev => ({
                ...prev,
                periodA: { ...prev.periodA, year: availableYears[0] },
                periodB: { ...prev.periodB, year: availableYears.length > 1 ? availableYears[1] : availableYears[0] - 1 }
            }));
        }
    }, [availableYears, timeSelection.periodA.year]);


    const handleFilterChange = useCallback((filterName: keyof Filters, value: any) => {
        setFilters(prev => {
            const currentArray = (prev[filterName] as string[]) || [];
            let newArray: string[];

            if (value === null) {
                // Clear filter
                newArray = [];
            } else if (Array.isArray(value)) {
                // Direct set (e.g. "Select All")
                newArray = value;
            } else {
                // Toggle single value
                newArray = currentArray.includes(value)
                    ? currentArray.filter(i => i !== value)
                    : [...currentArray, value];
            }

            const newFilters = { ...prev, [filterName]: newArray };

            // Logic for drill-downs: if parent changes significantly, clear children
            // (Note: with multi-select, we might just filter available options instead of clearing selection, 
            // but for now let's keep it simple and clear children if parent selection changes)
            if (filterName === 'regione') newFilters.citta = [];
            if (filterName === 'brandOwner') newFilters.brand = [];
            if (filterName === 'macroCategoria') newFilters.categoriaProdotto = [];

            if (filterName === 'brand' && newArray.length === 1 && masterData) {
                const brandInfo = masterData.find(p => p.brand === newArray[0]);
                if (brandInfo) {
                    // Logic to auto-select parent meta-data if a single brand is selected
                    if (!(newFilters.brandOwner as string[]).includes(brandInfo.brandOwner)) newFilters.brandOwner = [brandInfo.brandOwner];
                    if (!(newFilters.macroCategoria as string[]).includes(brandInfo.macroCategoria)) newFilters.macroCategoria = [brandInfo.macroCategoria];
                    if (!(newFilters.categoriaProdotto as string[]).includes(brandInfo.categoriaProdotto)) newFilters.categoriaProdotto = [brandInfo.categoriaProdotto];
                }
            }
            return newFilters;
        });
    }, [masterData]);

    const filteredData = useMemo(() => {
        const applyFilters = (data: MenuItem[]) => {
            return data.filter(item => {
                // Handle multi-select arrays: if empty, it means "All"
                // 🎯 ROBUST CHECK: Using case-insensitive comparison to handle legacy filter values
                const check = (array: string[], val: string | number | undefined | null) => {
                    if (!array || array.length === 0) return true;
                    if (!val) return array.includes('');
                    const target = String(val).toLowerCase();
                    return array.some(filterVal => String(filterVal).toLowerCase() === target);
                };

                return (
                    check(filters.regione, item.regione) &&
                    check(filters.citta, item.citta) &&
                    check(filters.tipologiaCliente, item.tipologiaCliente) &&
                    check(filters.brandOwner, item.brandOwner) &&
                    check(filters.brand, item.brand) &&
                    check(filters.macroCategoria, item.macroCategoria) &&
                    check(filters.categoriaProdotto, item.categoriaProdotto) &&
                    check(filters.cocktail, item.nomeCocktail) &&
                    check(filters.insegna, item.insegna) &&
                    check(filters.venueId, item["Menu ID"])
                );
            });
        };

        const filterByTime = (data: MenuItem[], period: { year: number, quarter?: number }) => {
            const { start, end } = getDateRangeForPeriod(period);
            return data.filter(item => {
                const itemDate = new Date(item.data);
                return itemDate >= start && itemDate <= end;
            });
        };

        const primaryPeriodDataRaw = filterByTime(enrichedData, timeSelection.periodA);
        const comparisonPeriodDataRaw = timeSelection.mode !== 'none' ? filterByTime(enrichedData, timeSelection.periodB) : [];

        return {
            primary: applyFilters(primaryPeriodDataRaw),
            comparison: applyFilters(comparisonPeriodDataRaw),
            allInPrimaryPeriod: primaryPeriodDataRaw,
            allInComparisonPeriod: comparisonPeriodDataRaw,
        };
    }, [enrichedData, filters, timeSelection]);

    const handleDataExport = useCallback(() => {
        if (filteredData.primary.length === 0) {
            alert(t('noDataExport'));
            return;
        }

        // Generate CSV
        const headers = ["id", "insegna", "via", "citta", "regione", "tipologiaCliente", "brandOwner", "brand", "macroCategoria", "categoriaProdotto", "nomeCocktail", "prezzo", "data"];

        const csvContent = [
            headers.join(','),
            ...filteredData.primary.map(row => headers.map(fieldName => {
                const value = row[fieldName as keyof MenuItem];
                // Escape quotes and wrap in quotes to handle commas in data
                const stringValue = String(value !== undefined && value !== null ? value : '');
                return `"${stringValue.replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `horeca_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }, [filteredData.primary, t]);

    const renderSheet = () => {
        switch (activeSheet) {
            case 'Overview':
                return <OverviewSheet
                    primaryPeriodData={filteredData.primary}
                    comparisonPeriodData={filteredData.comparison}
                    allData={filteredData.allInPrimaryPeriod}
                    allInComparisonPeriod={filteredData.allInComparisonPeriod}
                    filters={filters}
                    timeSelection={timeSelection}
                    handleFilterChange={handleFilterChange}
                    averagePrice={0}
                />;
            case 'Brand Owner':
                return <BrandOwnerSheet
                    primaryPeriodData={filteredData.primary}
                    comparisonPeriodData={filteredData.comparison}
                    allData={filteredData.allInPrimaryPeriod}
                    filters={filters}
                    timeSelection={timeSelection}
                    handleFilterChange={handleFilterChange}
                />;
            case 'Brand':
                return <BrandSheet
                    primaryPeriodData={filteredData.primary}
                    comparisonPeriodData={filteredData.comparison}
                    allData={filteredData.allInPrimaryPeriod}
                    allInComparisonPeriod={filteredData.allInComparisonPeriod}
                    filters={filters}
                    timeSelection={timeSelection}
                    handleFilterChange={handleFilterChange}
                />;
            case 'Drink Strategy':
                return <DrinkStrategySheet
                    primaryPeriodData={filteredData.primary}
                    allData={filteredData.allInPrimaryPeriod}
                    filters={filters}
                    timeSelection={timeSelection}
                    handleFilterChange={handleFilterChange}
                />;
            case 'Insights':
                return <InsightsSheet
                    primaryPeriodData={filteredData.primary}
                    allData={filteredData.allInPrimaryPeriod}
                    filters={filters}
                    timeSelection={timeSelection}
                />;
            default:
                return null;
        }
    };

    if (dataLoading) {
        return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-24 w-24 border-b-2 border-teal-400"></div></div>;
    }

    if (dataError) {
        return <div className="flex items-center justify-center h-screen"><div className="bg-red-900 border border-red-400 text-red-100 px-4 py-3 rounded-lg shadow-lg" role="alert"><strong className="font-bold">{t('error')}:</strong><span className="block sm:inline ml-2">{dataError}</span></div></div>;
    }

    const sheets: { id: Sheet; label: string }[] = [
        { id: 'Overview', label: t('overview') },
        { id: 'Brand Owner', label: t('brandOwner') },
        { id: 'Brand', label: t('brand') },
        { id: 'Drink Strategy', label: t('drinkStrategy') },
        { id: 'Insights', label: t('insights') }
    ];

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="flex-grow">
                                <FilterPanel
                                    activeSheet={activeSheet}
                                    allData={enrichedData}
                                    productMaster={masterData || []}
                                    filters={filters}
                                    onFilterChange={handleFilterChange}
                                    timeSelection={timeSelection}
                                    onTimeSelectionChange={setTimeSelection}
                                    availableYears={availableYears}
                                    onDataExport={handleDataExport}
                                />
                            </div>
                            {/* REMOVED: AI Insights Button */}
                        </div>

                        <div className="border-b border-gray-700">
                            <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                                {sheets.map(sheet => (
                                    <button
                                        key={sheet.id}
                                        onClick={() => {
                                            setActiveSheet(sheet.id);
                                        }}
                                        className={`${activeSheet === sheet.id
                                            ? 'border-teal-400 text-teal-400'
                                            : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                                            } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-base transition-colors`}
                                    >
                                        {sheet.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div>
                            {renderSheet()}
                        </div>
                    </div>
                </div>
            </div>

            {/* REMOVED: AI Insights Sidebar */}
        </div>
    );
};

export default Dashboard;
