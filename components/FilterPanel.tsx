import { useMemo, FC, ChangeEvent } from 'react';
import type { MenuItem, Filters, TimeSelection, ProductMasterItem } from '../types';
import SearchableSelect from './SearchableSelect';

interface FilterPanelProps {
    activeSheet: string;
    allData: MenuItem[];
    productMaster: ProductMasterItem[];
    filters: Filters;
    onFilterChange: (filterName: keyof Filters, value: any) => void;
    timeSelection: TimeSelection;
    onTimeSelectionChange: (selection: TimeSelection) => void;
    availableYears: number[];
    onDataUpload?: (data: MenuItem[]) => void;
    onDataExport?: () => void;
}

const FilterPanel: FC<FilterPanelProps> = ({ activeSheet, allData, productMaster, filters, onFilterChange, timeSelection, onTimeSelectionChange, availableYears, onDataUpload, onDataExport }) => {
    const options = useMemo(() => {
        const unique = (key: keyof MenuItem) => [...new Set(allData.map(item => item[key]))].filter(v => v !== null && v !== undefined && v !== '').sort((a, b) => String(a).localeCompare(String(b)));

        // Geographical and venue type filters
        const regioneOptions = unique('regione');

        let cittaOptions: string[] = [];
        if (filters.regione.length > 0) {
            cittaOptions = [...new Set(allData.filter(i => i.regione && filters.regione.includes(i.regione)).map(i => i.citta))].filter(Boolean).sort() as string[];
        } else {
            cittaOptions = unique('citta') as string[];
        }

        // Product-related filters with strict drill-down logic
        let availableProducts = productMaster;
        if (filters.macroCategoria.length > 0) {
            availableProducts = availableProducts.filter(p => filters.macroCategoria.includes(p.macroCategoria));
        }

        // Brand Owners (filtered by Macro Category)
        const brandOwners = [...new Set(availableProducts.map(p => p.brandOwner))].sort();

        // Product Categories (filtered by Macro Category AND Brand Owner)
        let productsForCategory = availableProducts;
        if (filters.brandOwner.length > 0) {
            productsForCategory = productsForCategory.filter(p => filters.brandOwner.includes(p.brandOwner));
        }
        const productCategories = [...new Set(productsForCategory.map(p => p.categoriaProdotto))].sort();

        // Brands (filtered by Macro Category AND Brand Owner AND Product Category)
        let productsForBrand = productsForCategory;
        if (filters.categoriaProdotto.length > 0) {
            productsForBrand = productsForBrand.filter(p => filters.categoriaProdotto.includes(p.categoriaProdotto));
        }
        const brands = [...new Set(productsForBrand.map(p => p.brand))].sort();

        // Venues (filtered by Region/City)
        let filteredVenues = allData;
        if (filters.regione.length > 0) filteredVenues = filteredVenues.filter(i => i.regione && filters.regione.includes(i.regione));
        if (filters.citta.length > 0) filteredVenues = filteredVenues.filter(i => i.citta && filters.citta.includes(i.citta));
        if (filters.tipologiaCliente.length > 0) filteredVenues = filteredVenues.filter(i => i.tipologiaCliente && filters.tipologiaCliente.includes(i.tipologiaCliente));

        return {
            regione: regioneOptions as string[],
            citta: cittaOptions as string[],
            tipologiaCliente: unique('tipologiaCliente') as string[],
            venueId: [...new Set(filteredVenues.map(i => i.venueId || i["Menu ID"]))].filter(Boolean).map(String).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
            insegna: [...new Set(filteredVenues.map(i => i.insegna))].filter(Boolean).sort() as string[],
            brandOwner: brandOwners,
            brand: brands,
            macroCategoria: ["Spirits", "Wine", "Beer", "Soft Drink"],
            categoriaProdotto: productCategories,
        };
    }, [allData, productMaster, filters]);

    const handleClearFilters = () => {
        (Object.keys(filters) as (keyof Filters)[]).forEach(key => {
            onFilterChange(key, []);
        });
    };

    const handleTimeModeChange = (mode: TimeSelection['mode']) => {
        const currentYear = timeSelection.periodA.year;
        let newSelection: TimeSelection = {
            mode,
            periodA: { year: currentYear },
            periodB: { year: currentYear - 1 }
        };

        if (mode === 'QoQ') {
            const d = new Date();
            const currentQuarter = Math.floor(d.getMonth() / 3) + 1;
            newSelection.periodA.quarter = currentQuarter;
            if (currentQuarter > 1) {
                newSelection.periodB.quarter = currentQuarter - 1;
                newSelection.periodB.year = currentYear;
            } else {
                newSelection.periodB.quarter = 4;
                newSelection.periodB.year = currentYear - 1;
            }
        }
        onTimeSelectionChange(newSelection);
    };

    const handleTimePeriodChange = (period: 'A' | 'B', part: 'year' | 'quarter', value: number) => {
        const periodKey = period === 'A' ? 'periodA' : 'periodB';
        onTimeSelectionChange({
            ...timeSelection,
            [periodKey]: {
                ...timeSelection[periodKey],
                [part]: value
            }
        });
    };

    const hasActiveFilters = Object.values(filters).some(v => Array.isArray(v) && v.length > 0);

    const macroCategories = ["Spirits", "Wine", "Beer", "Soft Drink"];
    const cocktailOptions = ["Paloma", "Negroni", "Americano", "Spritz", "Boulevardier", "Gin&Tonic", "Cocktail Martini"];

    return (
        <div className="bg-gray-800/60 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-gray-700/50 space-y-6">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-6">
                    {/* Top Row: Time Selection & Macro Category Buttons */}
                    <div className="flex flex-col lg:flex-row gap-6 border-b border-gray-700 pb-6">
                        {/* Time Selection Group */}
                        <div className="flex flex-wrap gap-4 items-end">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Comparison Mode</label>
                                <div className="flex items-center space-x-2 bg-gray-700 p-1 rounded-md">
                                    <button onClick={() => handleTimeModeChange('none')} className={`px-3 py-1 text-xs rounded ${timeSelection.mode === 'none' ? 'bg-teal-500 text-white' : 'hover:bg-gray-600'}`}>None</button>
                                    <button onClick={() => handleTimeModeChange('YoY')} className={`px-3 py-1 text-xs rounded ${timeSelection.mode === 'YoY' ? 'bg-teal-500 text-white' : 'hover:bg-gray-600'}`}>YoY</button>
                                    <button onClick={() => handleTimeModeChange('QoQ')} className={`px-3 py-1 text-xs rounded ${timeSelection.mode === 'QoQ' ? 'bg-teal-500 text-white' : 'hover:bg-gray-600'}`}>QoQ</button>
                                </div>
                            </div>

                            <div className="flex items-end space-x-2">
                                <div className="w-24">
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Primary Year</label>
                                    <select
                                        value={timeSelection.periodA.year}
                                        onChange={e => handleTimePeriodChange('A', 'year', parseInt(e.target.value))}
                                        className="w-full bg-gray-700 border-gray-600 rounded px-2 py-1.5 text-xs text-white"
                                    >
                                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                {timeSelection.mode === 'QoQ' && (
                                    <div className="w-20">
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Quarter</label>
                                        <select
                                            value={timeSelection.periodA.quarter ?? 1}
                                            onChange={e => handleTimePeriodChange('A', 'quarter', parseInt(e.target.value))}
                                            className="w-full bg-gray-700 border-gray-600 rounded px-2 py-1.5 text-xs text-white"
                                        >
                                            {[1, 2, 3, 4].map(q => <option key={q} value={q}>Q{q}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {timeSelection.mode !== 'none' && (
                                <div className="flex items-end space-x-2 text-gray-300">
                                    <span className="mb-2 text-xs font-bold uppercase text-gray-500 px-2 italic">vs</span>
                                    <div className="w-24">
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Comparison Year</label>
                                        <select
                                            value={timeSelection.periodB.year}
                                            onChange={e => handleTimePeriodChange('B', 'year', parseInt(e.target.value))}
                                            className="w-full bg-gray-700 border-gray-600 rounded px-2 py-1.5 text-xs text-white"
                                        >
                                            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    {timeSelection.mode === 'QoQ' && (
                                        <div className="w-20">
                                            <label className="block text-xs font-medium text-gray-400 mb-1">Quarter</label>
                                            <select
                                                value={timeSelection.periodB.quarter ?? 1}
                                                onChange={e => handleTimePeriodChange('B', 'quarter', parseInt(e.target.value))}
                                                className="w-full bg-gray-700 border-gray-600 rounded px-2 py-1.5 text-xs text-white"
                                            >
                                                {[1, 2, 3, 4].map(q => <option key={q} value={q}>Q{q}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Macro Category Buttons */}
                        <div className="flex-1 flex flex-col items-end">
                            <label className="block text-xs font-medium text-gray-400 mb-1">Macro Category</label>
                            <div className="flex flex-wrap gap-2 justify-end">
                                {macroCategories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => onFilterChange('macroCategoria', filters.macroCategoria.includes(cat) ? filters.macroCategoria.filter(c => c !== cat) : [...filters.macroCategoria, cat])}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border ${filters.macroCategoria.includes(cat)
                                            ? 'bg-teal-600 border-teal-500 text-white shadow-[0_0_10px_rgba(20,184,166,0.3)]'
                                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* FILTERS - Row 1: Geography & Venue */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <SearchableSelect label="Region" options={options.regione} selectedValues={filters.regione} onChange={vals => onFilterChange('regione', vals)} />
                            <SearchableSelect label="City" options={options.citta} selectedValues={filters.citta} onChange={vals => onFilterChange('citta', vals)} disabled={filters.regione.length === 0} />
                            <SearchableSelect label="Customer Type" options={options.tipologiaCliente} selectedValues={filters.tipologiaCliente} onChange={vals => onFilterChange('tipologiaCliente', vals)} />
                            <SearchableSelect label="Venue ID" options={options.venueId} selectedValues={filters.venueId} onChange={vals => onFilterChange('venueId', vals)} />
                            <SearchableSelect label="Venue Name" options={options.insegna} selectedValues={filters.insegna} onChange={vals => onFilterChange('insegna', vals)} />
                        </div>

                        {/* FILTERS - Row 2: Product & Contextual */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                            <SearchableSelect label="Brand Owner" options={options.brandOwner} selectedValues={filters.brandOwner} onChange={vals => onFilterChange('brandOwner', vals)} />
                            <SearchableSelect label="Product Category" options={options.categoriaProdotto} selectedValues={filters.categoriaProdotto} onChange={vals => onFilterChange('categoriaProdotto', vals)} />
                            <SearchableSelect label="Brand" options={options.brand} selectedValues={filters.brand} onChange={vals => onFilterChange('brand', vals)} />

                            {activeSheet === 'Drink Strategy' ? (
                                <SearchableSelect label="Cocktail" options={cocktailOptions} selectedValues={filters.cocktail} onChange={vals => onFilterChange('cocktail', vals)} />
                            ) : (
                                <div className="hidden lg:block"></div>
                            )}

                            <div className="flex items-end">
                                <button
                                    onClick={handleClearFilters}
                                    disabled={!hasActiveFilters}
                                    className="w-full px-4 py-2 bg-red-600/80 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-sm font-medium border border-red-500/20"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterPanel;
