import { useMemo, FC } from 'react';
import type { MenuItem, Filters, TimeSelection, ProductMasterItem } from '../types';
import SearchableSelect from './SearchableSelect';
import { isCocktailMatch, isStrictCocktail } from '../utils/cocktailUtils';
import { useLanguage } from '../context/LanguageContext';

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

const FilterPanel: FC<FilterPanelProps> = ({ activeSheet, allData, productMaster, filters, onFilterChange, timeSelection, onTimeSelectionChange, availableYears, onDataExport }) => {
    const { t } = useLanguage();
    const options = useMemo(() => {
        // Helper to get unique values for a particular filter key, based on data filtered by ALL OTHER active filters.
        const getFilteredOptions = (targetFilterKey: keyof Filters, itemKey: keyof MenuItem, additionalFilter?: (item: MenuItem) => boolean) => {
            let filteredData = allData;

            // Apply all filters EXCEPT the one we are generating options for
            (Object.keys(filters) as (keyof Filters)[]).forEach(key => {
                if (key === targetFilterKey) return; // Skip self

                const activeValues = filters[key];
                if (activeValues && activeValues.length > 0) {
                    // Map filter key to data item key (if different)
                    let checkItemKey: keyof MenuItem = key as keyof MenuItem;
                    if (key === 'cocktail') checkItemKey = 'nomeCocktail';
                    if (key === 'venueId') checkItemKey = 'Menu ID';

                    filteredData = filteredData.filter(item => {
                        const val = item[checkItemKey];
                        // Robust check: valid value AND included in filter
                        return val && activeValues.includes(String(val));
                    });
                }
            });

            // Apply additional custom filter (e.g. for Cocktails)
            if (additionalFilter) {
                filteredData = filteredData.filter(additionalFilter);
            }

            // Extract unique values for the target key
            const uniqueValues = new Set<string>();
            filteredData.forEach(item => {
                const val = item[itemKey];
                if (val !== null && val !== undefined && val !== '') {
                    uniqueValues.add(String(val));
                }
            });

            return [...uniqueValues].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        };

        return {
            regione: getFilteredOptions('regione', 'regione'),
            citta: getFilteredOptions('citta', 'citta'),
            tipologiaCliente: getFilteredOptions('tipologiaCliente', 'tipologiaCliente'),
            venueId: getFilteredOptions('venueId', 'Menu ID'), // STRICTLY use Menu ID
            insegna: getFilteredOptions('insegna', 'insegna'),
            brandOwner: getFilteredOptions('brandOwner', 'brandOwner'),
            brand: getFilteredOptions('brand', 'brand'),
            macroCategoria: getFilteredOptions('macroCategoria', 'macroCategoria'),
            categoriaProdotto: getFilteredOptions('categoriaProdotto', 'categoriaProdotto'),
            cocktail: getFilteredOptions('cocktail', 'nomeCocktail', (item: MenuItem) => {
                return isStrictCocktail(item);
            }), // Dynamic list from Item Name + Broad Category Sync
        };
    }, [allData, filters]);

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
                                <label className="block text-xs font-medium text-gray-400 mb-1">{t('comparisonMode')}</label>
                                <div className="flex items-center space-x-2 bg-gray-700 p-1 rounded-md">
                                    <button onClick={() => handleTimeModeChange('none')} className={`px-3 py-1 text-xs rounded ${timeSelection.mode === 'none' ? 'bg-teal-500 text-white' : 'hover:bg-gray-600'}`}>{t('none')}</button>
                                    <button onClick={() => handleTimeModeChange('YoY')} className={`px-3 py-1 text-xs rounded ${timeSelection.mode === 'YoY' ? 'bg-teal-500 text-white' : 'hover:bg-gray-600'}`}>YoY</button>
                                    <button onClick={() => handleTimeModeChange('QoQ')} className={`px-3 py-1 text-xs rounded ${timeSelection.mode === 'QoQ' ? 'bg-teal-500 text-white' : 'hover:bg-gray-600'}`}>QoQ</button>
                                </div>
                            </div>

                            <div className="flex items-end space-x-2">
                                <div className="w-24">
                                    <label className="block text-xs font-medium text-gray-400 mb-1">{t('primaryYear')}</label>
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
                                        <label className="block text-xs font-medium text-gray-400 mb-1">{t('quarter')}</label>
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
                                        <label className="block text-xs font-medium text-gray-400 mb-1">{t('comparisonYear')}</label>
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
                                            <label className="block text-xs font-medium text-gray-400 mb-1">{t('quarter')}</label>
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
                            <label className="block text-xs font-medium text-gray-400 mb-1">{t('macroCategory')}</label>
                            <div className="flex flex-wrap gap-2 justify-end">
                                {macroCategories.map(cat => {
                                    const isDisabled = !options.macroCategoria.includes(cat) && filters.macroCategoria.length === 0; // Only disable if not filtering, or... actually, if I am filtering by "Paloma", I want to know "Wine" is 0 results. 
                                    const isAvailable = options.macroCategoria.includes(cat);

                                    // Complex logic: If I select "Paloma", "Wine" is not in options.
                                    // If I click "Wine", it would yield 0 results. 
                                    // So it should be disabled.
                                    // BUT, if I have "Spirits" selected, "Wine" might not be in options (unless options logic includes current selection... wait).
                                    // My logic: keys.forEach(key => { if (key === target) return }).
                                    // So if I select "Spirits", calculating options for MacroCategory SKIPS MacroCategory filter.
                                    // So "Wine" IS in options (unless other filters exclude it).
                                    // Perfect.

                                    return (
                                        <button
                                            key={cat}
                                            disabled={!isAvailable}
                                            onClick={() => onFilterChange('macroCategoria', filters.macroCategoria.includes(cat) ? filters.macroCategoria.filter(c => c !== cat) : [...filters.macroCategoria, cat])}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border ${filters.macroCategoria.includes(cat)
                                                ? 'bg-teal-600 border-teal-500 text-white shadow-[0_0_10px_rgba(20,184,166,0.3)]'
                                                : !isAvailable
                                                    ? 'bg-gray-800 border-gray-700 text-gray-600 cursor-not-allowed opacity-50'
                                                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    )
                                })}
                                <button
                                    onClick={onDataExport}
                                    className="ml-4 px-4 py-2 bg-slate-900 border border-slate-700 hover:border-teal-500/50 text-teal-400 rounded-md text-sm font-medium transition-all flex items-center gap-2"
                                    title={t('exportData')}
                                >
                                    📥 {t('export')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* FILTERS - Row 1: Geography & Venue */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <SearchableSelect label={t('region')} options={options.regione} selectedValues={filters.regione} onChange={vals => onFilterChange('regione', vals)} itemLabel="Region" itemsLabel="Regions" />
                            <SearchableSelect label={t('city')} options={options.citta} selectedValues={filters.citta} onChange={vals => onFilterChange('citta', vals)} disabled={filters.regione.length === 0} itemLabel="City" itemsLabel="Cities" />
                            <SearchableSelect label={t('customerType')} options={options.tipologiaCliente} selectedValues={filters.tipologiaCliente} onChange={vals => onFilterChange('tipologiaCliente', vals)} itemLabel="Type" itemsLabel="Types" />
                            <SearchableSelect label="Menu ID" options={options.venueId} selectedValues={filters.venueId} onChange={vals => onFilterChange('venueId', vals)} itemLabel="ID" itemsLabel="IDs" />
                            <SearchableSelect label={t('venueName')} options={options.insegna} selectedValues={filters.insegna} onChange={vals => onFilterChange('insegna', vals)} itemLabel="Venue" itemsLabel="Venues" />
                        </div>

                        {/* FILTERS - Row 2: Product & Contextual */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                            <SearchableSelect label={t('brandOwner')} options={options.brandOwner} selectedValues={filters.brandOwner} onChange={vals => onFilterChange('brandOwner', vals)} itemLabel="Owner" itemsLabel="Owners" />
                            <SearchableSelect label={t('productCategory')} options={options.categoriaProdotto} selectedValues={filters.categoriaProdotto} onChange={vals => onFilterChange('categoriaProdotto', vals)} itemLabel="Category" itemsLabel="Categories" />
                            <SearchableSelect label={t('brand')} options={options.brand} selectedValues={filters.brand} onChange={vals => onFilterChange('brand', vals)} itemLabel="Brand" itemsLabel="Brands" />

                            {activeSheet === 'Drink Strategy' ? (
                                <SearchableSelect label={t('cocktail')} options={options.cocktail} selectedValues={filters.cocktail} onChange={vals => onFilterChange('cocktail', vals)} itemLabel="Cocktail" itemsLabel="Cocktails" />
                            ) : (
                                <div className="hidden lg:block"></div>
                            )}

                            <div className="flex items-end">
                                <button
                                    onClick={handleClearFilters}
                                    disabled={!hasActiveFilters}
                                    className="w-full px-4 py-2 bg-red-600/80 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-sm font-medium border border-red-500/20"
                                >
                                    {t('clearAllFilters')}
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
