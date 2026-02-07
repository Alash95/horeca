import { FC, useState, useMemo, useEffect, useRef } from 'react';

interface SearchableSelectProps {
    label: string;
    options: (string | number)[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    disabled?: boolean;
}

const SearchableSelect: FC<SearchableSelectProps> = ({ label, options, selectedValues, onChange, disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredOptions = useMemo(() => {
        return options.filter(opt =>
            String(opt).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    const toggleOption = (opt: string) => {
        const newValues = selectedValues.includes(opt)
            ? selectedValues.filter(v => v !== opt)
            : [...selectedValues, opt];
        onChange(newValues);
    };

    const toggleAll = () => {
        if (selectedValues.length === options.length) {
            onChange([]);
        } else {
            onChange(options.map(String));
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="w-full relative" ref={dropdownRef}>
            <label className={`block text-xs font-medium mb-1 ${selectedValues.length > 0 ? 'text-white' : 'text-gray-400'}`}>
                {label} {selectedValues.length > 0 && `(${selectedValues.length})`}
            </label>

            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm px-3 py-2 text-white cursor-pointer flex justify-between items-center text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-500'} ${isOpen ? 'ring-1 ring-teal-500 border-teal-500' : ''}`}
            >
                <span className="truncate">
                    {selectedValues.length === 0 ? 'Select All' :
                        selectedValues.length === options.length ? 'All Selected' :
                            selectedValues.join(', ')}
                </span>
                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded-md shadow-xl max-h-64 flex flex-col overflow-hidden">
                    <div className="p-2 border-b border-gray-700">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
                        <div
                            onClick={(e) => { e.stopPropagation(); toggleAll(); }}
                            className="flex items-center space-x-2 px-2 py-1.5 hover:bg-gray-700 rounded cursor-pointer transition-colors"
                        >
                            <input
                                type="checkbox"
                                checked={selectedValues.length === options.length && options.length > 0}
                                onChange={() => { }}
                                className="rounded border-gray-600 text-teal-500 focus:ring-teal-500"
                            />
                            <span className="text-xs text-white font-semibold">Select All</span>
                        </div>

                        {filteredOptions.map((opt) => {
                            const sOpt = String(opt);
                            return (
                                <div
                                    key={sOpt}
                                    onClick={(e) => { e.stopPropagation(); toggleOption(sOpt); }}
                                    className="flex items-center space-x-2 px-2 py-1.5 hover:bg-gray-700 rounded cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedValues.includes(sOpt)}
                                        onChange={() => { }}
                                        className="rounded border-gray-600 text-teal-500 focus:ring-teal-500"
                                    />
                                    <span className="text-xs text-gray-200 truncate">{sOpt}</span>
                                </div>
                            );
                        })}

                        {filteredOptions.length === 0 && (
                            <div className="p-4 text-center text-xs text-gray-500">No options found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
