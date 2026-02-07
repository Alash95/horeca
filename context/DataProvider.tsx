import { createContext, useContext, useEffect, useState, FC, ReactNode, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import type { MenuItem, ProductMasterItem } from '../types';

// Import loaders (temporarily, or moving them here)
import { fetchMasterDataFromSheet } from '../utils/googleSheetLoader';

interface DataContextType {
    menuItems: MenuItem[];
    enrichedData: MenuItem[];
    masterData: ProductMasterItem[];
    loading: boolean;
    error: string | null;
    userPermissions: { brand: string; role: string };
    metrics: {
        totalMenus: number;
        totalOrders: number;
        totalClients: number;
        totalRevenue: number;
    };
    refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// 🎯 SHARED HELPER: Robust string normalization
const normalizeString = (str: string) => {
    if (!str) return str;
    let s = str.trim();
    const lower = s.toLowerCase();

    // 🎯 SPECIFIC FIXES: Handle common inconsistencies
    if (lower === 'campari group') return 'Campari Group';
    if (lower === 'n/a' || lower === 'n.a.') return 'N/A';

    // 🎯 ACCENT NORMALIZATION: Handle Espolòn vs Espolón
    s = s.replace(/espol[òó]n/gi, 'Espolón');

    // 🎯 TITLE CASE: Standardize casing
    return s.split(/\s+/)
        .map(word => {
            if (word.toUpperCase() === 'N/A') return 'N/A';
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
};

export const DataProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [masterData, setMasterData] = useState<ProductMasterItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userPermissions, setUserPermissions] = useState<{ brand: string; role: string }>({ brand: 'PENDING', role: 'user' });

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // 1. Fetch User Permissions
            const { data: { user } } = await supabase.auth.getUser();
            let assignedBrand = 'PENDING';
            let userRole = 'user';

            if (user) {
                const { data: settings } = await supabase
                    .from('users')
                    .select('brand_owner_access, role')
                    .eq('id', user.id)
                    .maybeSingle();

                if (settings) {
                    const { data: isBlacklisted } = await supabase
                        .from('blacklist')
                        .select('email')
                        .eq('email', user.email)
                        .maybeSingle();

                    if (isBlacklisted) {
                        await supabase.auth.signOut();
                        navigate('/');
                        return;
                    }

                    assignedBrand = settings.brand_owner_access || 'PENDING';
                    userRole = settings.role || 'user';
                    setUserPermissions({ brand: assignedBrand, role: userRole });
                }
            }

            // 2. Fetch Master Data
            try {
                const mData = await fetchMasterDataFromSheet();
                // 🎯 NORMALIZE MASTER DATA: Ensures filter options match menu items
                const normalizedMaster: ProductMasterItem[] = mData.map(p => ({
                    ...p,
                    brandOwner: normalizeString(p.brandOwner),
                    brand: normalizeString(p.brand),
                    macroCategoria: normalizeString(p.macroCategoria) as ProductMasterItem['macroCategoria'],
                    categoriaProdotto: normalizeString(p.categoriaProdotto),
                }));
                setMasterData(normalizedMaster);
            } catch (e) {
                console.error("Failed to load Master Data:", e);
            }

            // 3. Fetch Menu Items (Supabase)
            let allItems: MenuItem[] = [];
            let page = 0;
            const pageSize = 1000;
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await supabase
                    .from('menuitems')
                    .select('*')
                    .range(page * pageSize, (page + 1) * pageSize - 1);

                if (error) throw new Error(error.message);

                if (data && data.length > 0) {
                    const mappedData: MenuItem[] = data.map((row: any) => ({
                        ...row,
                        // 🌉 ROBUST BRIDGE: Handles exact Supabase headers with Normalization
                        insegna: normalizeString(row.NomeLocale || row.Venue_Name || 'Unknown Venue'),
                        via: row.venue_address || row.Address || '',
                        citta: normalizeString(row.Città || row.venue_city || row.City || 'Unknown City'),
                        regione: normalizeString(row.RegionMatch || row.Region || 'Unknown Region'),
                        tipologiaCliente: normalizeString(row.TipologiaLocale || row.Customer_Type || 'Unknown Type'),
                        brandOwner: normalizeString(row.ingredients_brand_owner || row.BrandOwner || 'Unknown Owner'),
                        brand: normalizeString(row.ingredients_brand || row.Brand || 'Unknown Brand'),
                        macroCategoria: normalizeString(row.Broad_category || row.MacroCategory || 'Other'),
                        categoriaProdotto: normalizeString(row.ingredients_categoria || row.Product_Category || 'Generic'),
                        nomeCocktail: normalizeString(row.Item_Name || row.CocktailName || 'General Item'),
                        prezzo: typeof row.Price === 'number' ? row.Price : (parseFloat(String(row.Price || '0').replace(',', '.')) || 0),
                        data: row['Item Date'] || row.Date || row.data || '2024-01-01',
                        venueId: row.NomeLocale || row.Venue_Name || '', // USE RAW NAME OR STABLE ID
                    }));

                    allItems = [...allItems, ...mappedData];
                    if (data.length < pageSize) hasMore = false;
                    else page++;
                } else {
                    hasMore = false;
                }
            }

            setMenuItems(allItems);
            calculateMetrics(allItems);
            setLoading(false);

        } catch (err) {
            console.error('Data loading error:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [navigate]);

    const [metrics, setMetrics] = useState({
        totalMenus: 0,
        totalOrders: 0,
        totalClients: 0,
        totalRevenue: 0,
    });

    const calculateMetrics = (data: MenuItem[]) => {
        const uniqueVenues = new Set(data.map(item => item.insegna)).size;
        const totalRevenue = data.reduce((sum, item) => sum + (item.prezzo || 0), 0);

        setMetrics({
            totalMenus: uniqueVenues,
            totalOrders: data.length,
            totalClients: uniqueVenues,
            totalRevenue: totalRevenue
        });
    };

    const enrichedData = useMemo(() => {
        if (!masterData || masterData.length === 0) return menuItems;

        const productMap = new Map<string, ProductMasterItem>();
        masterData.forEach(item => {
            if (item.brand) productMap.set(item.brand.toLowerCase(), item);
            if (item.aliases) {
                item.aliases.forEach(alias => {
                    if (alias) productMap.set(alias.toLowerCase(), item);
                });
            }
        });

        return menuItems.map(item => {
            const masterInfo = productMap.get((item.brand || '').toLowerCase());
            if (masterInfo) {
                return {
                    ...item,
                    brandOwner: masterInfo.brandOwner,
                    macroCategoria: masterInfo.macroCategoria,
                    categoriaProdotto: masterInfo.categoriaProdotto,
                    brand: masterInfo.brand,
                };
            }
            return item;
        });
    }, [masterData, menuItems]);

    return (
        <DataContext.Provider value={{
            menuItems,
            enrichedData,
            masterData,
            loading,
            error,
            metrics,
            userPermissions,
            refreshData: fetchAllData
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
