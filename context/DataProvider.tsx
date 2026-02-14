import { createContext, useContext, useEffect, useState, FC, ReactNode, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import type { MenuItem, ProductMasterItem, MarketUniverseItem, MarketBenchmarkItem } from '../types';

// Import loaders (temporarily, or moving them here)
import { fetchMasterDataFromSheet } from '../utils/googleSheetLoader';
import { getCache, setCache, clearCache } from '../utils/db';

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
    marketUniverse: MarketUniverseItem[];
    marketBenchmarks: MarketBenchmarkItem[];
    loadingProgress: number;
    fullUniverse: MenuItem[];
    refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const normalizeString = (str: string) => {
    if (!str) return str;
    let s = str.trim();
    const lower = s.toLowerCase();

    // 🎯 SPECIFIC FIXES: Handle common inconsistencies and map to English (matching region_match_updates.sql)
    if (lower === 'campari group') return 'Campari Group';
    if (lower === 'n/a' || lower === 'n.a.') return 'N/A';

    // Region Mappings (Standardize to Italian per UI guide)
    if (lower === 'lombardia' || lower === 'lombardy') return 'Lombardia';
    if (lower === 'piemonte' || lower === 'piedmont') return 'Piemonte';
    if (lower === 'sicilia' || lower === 'sicily') return 'Sicilia';
    if (lower === 'toscana' || lower === 'tuscany') return 'Toscana';
    if (lower === 'veneto') return 'Veneto';
    if (lower === 'lazio') return 'Lazio';
    if (lower === 'puglia' || lower === 'apulia') return 'Puglia';
    if (lower === 'campania') return 'Campania';
    if (lower === 'emilia romagna' || lower === 'emilia-romagna') return 'Emilia-Romagna';
    if (lower === 'sardegna' || lower === 'sardinia') return 'Sardegna';
    if (lower === 'abruzzo') return 'Abruzzo';
    if (lower === 'basilicata') return 'Basilicata';
    if (lower === 'calabria') return 'Calabria';
    if (lower === 'liguria') return 'Liguria';
    if (lower === 'marche') return 'Marche';
    if (lower === 'molise') return 'Molise';
    if (lower === 'umbria') return 'Umbria';
    if (lower === 'aosta' || lower === "valle d'aosta" || lower === "valle d' aosta") return "Valle d'Aosta";
    if (lower === 'trentino' || lower.includes('trentino-alto')) return 'Trentino-Alto Adige';

    // 🎯 ACCENT NORMALIZATION: Handle Espolòn vs Espolón
    s = s.replace(/espol[òó]n/gi, 'Espolón');

    // 🎯 TITLE CASE: Standardize casing
    return s.split(/\s+/)
        .map(word => {
            const upper = word.toUpperCase();
            if (upper === 'N/A') return 'N/A';
            if (word.toLowerCase() === "d'aosta") return "d'Aosta";
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
    const [marketUniverse, setMarketUniverse] = useState<MarketUniverseItem[]>([]);
    const [marketBenchmarks, setMarketBenchmarks] = useState<MarketBenchmarkItem[]>([]);
    const [loadingProgress, setLoadingProgress] = useState(0);

    const fetchAllData = async () => {
        setLoading(true);
        setLoadingProgress(5);
        try {
            // 1. Fetch User & Permissions (Sequential for stability)
            setLoadingProgress(10);
            const { data: { user } } = await supabase.auth.getUser();
            let assignedBrand = 'PENDING';
            let userRole = 'user';

            if (user) {
                // 🛡️ SECURITY: Verify user exists and isn't blacklisted
                const [settingsRes, blacklistRes] = await Promise.all([
                    supabase.from('users').select('brand_owner_access, role').eq('id', user.id).maybeSingle(),
                    supabase.from('blacklist').select('email').eq('email', user.email).maybeSingle()
                ]);

                if (blacklistRes.data) {
                    console.warn("User blacklisted. Signing out.");
                    await clearCache(); // Clear potential sensitive data
                    await supabase.auth.signOut();
                    window.location.href = '/'; // Hard redirect to break loops
                    return;
                }

                if (settingsRes.data) {
                    assignedBrand = settingsRes.data.brand_owner_access || 'PENDING';
                    userRole = settingsRes.data.role || 'user';
                    setUserPermissions({ brand: assignedBrand, role: userRole });
                } else {
                    console.warn("User record not found in public.users. Signing out.");
                    // await clearCache(); // Optional: Clear if invalid user
                    await supabase.auth.signOut();
                    window.location.href = '/'; // Hard redirect to break loops
                    return;
                }
            }
            setLoadingProgress(25);

            // ⚡ CACHE CHECK: Try to load from IndexedDB first
            try {
                const [cachedMenu, cachedMaster, cachedUniverse, cachedBenchmarks] = await Promise.all([
                    getCache(`menuItems_${user?.id || 'anon'}`),
                    getCache('masterData'),
                    getCache('marketUniverse'),
                    getCache('marketBenchmarks')
                ]);

                if (cachedMenu && cachedMaster && cachedMenu.length > 0) {
                    console.log("⚡ Loaded data from cache");
                    setMenuItems(cachedMenu);
                    setMasterData(cachedMaster);
                    if (cachedUniverse) setMarketUniverse(cachedUniverse);
                    if (cachedBenchmarks) setMarketBenchmarks(cachedBenchmarks);

                    // Trigger metrics calc immediately with cached data
                    let dataForMetrics = cachedMenu;
                    if (userRole === 'user' && assignedBrand !== 'ALL' && assignedBrand !== 'PENDING') {
                        const target = normalizeString(assignedBrand);
                        dataForMetrics = cachedMenu.filter((item: MenuItem) => normalizeString(item.brandOwner) === target);
                    }
                    calculateMetrics(dataForMetrics);

                    setLoadingProgress(100);
                    setLoading(false);
                    return; // EXIT EARLY - Skip network fetch
                }
            } catch (e) {
                console.warn("Cache read failed, falling back to network", e);
            }

            // 2. Fetch Master Data
            let finalMasterData: ProductMasterItem[] = []; // Store for cache
            try {
                const mData = await fetchMasterDataFromSheet();
                const normalizedMaster: ProductMasterItem[] = (mData || []).map(p => ({
                    ...p,
                    brandOwner: normalizeString(p.brandOwner || 'Unknown'),
                    brand: normalizeString(p.brand || 'Unknown'),
                    macroCategoria: normalizeString(p.macroCategoria || 'Other') as ProductMasterItem['macroCategoria'],
                    categoriaProdotto: normalizeString(p.categoriaProdotto || 'Generic'),
                }));
                setMasterData(normalizedMaster);
                finalMasterData = normalizedMaster;
                setCache('masterData', normalizedMaster, 60 * 24); // Cache for 24h
            } catch (e) {
                console.error("Master data fail:", e);
            }
            setLoadingProgress(40);

            // 3. Fetch Market Data (Data Mart)
            let finalUniverse: MarketUniverseItem[] = [];
            let finalBenchmarks: MarketBenchmarkItem[] = [];
            try {
                const [uRes, bRes] = await Promise.all([
                    supabase.rpc('get_market_universe'),
                    supabase.rpc('get_market_benchmarks')
                ]);
                if (uRes.data) {
                    // 🎯 NORMALIZE MARKET UNIVERSE to match MenuItems
                    const normalizedUniverse = uRes.data.map((item: any) => ({
                        ...item,
                        regione: (() => {
                            const raw = normalizeString(item.regione || 'Unknown Region');
                            if (raw === 'Aosta') return 'Valle d\'Aosta';
                            if (raw === 'Trentino') return 'Trentino-Alto Adige';
                            return raw;
                        })(),
                        citta: normalizeString(item.citta || 'Unknown City'),
                        tipologia_cliente: normalizeString(item.tipologia_cliente || 'Unknown Type'),
                    }));
                    setMarketUniverse(normalizedUniverse);
                    finalUniverse = normalizedUniverse;
                    setCache('marketUniverse', normalizedUniverse, 60 * 24);
                }
                if (bRes.data) {
                    const normalizedBenchmarks = bRes.data.map((item: any) => ({
                        ...item,
                        macro_categoria: normalizeString(item.macro_categoria || 'Other'),
                        categoria_prodotto: normalizeString(item.categoria_prodotto || 'Generic'),
                    }));
                    setMarketBenchmarks(normalizedBenchmarks);
                    finalBenchmarks = normalizedBenchmarks;
                    setCache('marketBenchmarks', normalizedBenchmarks, 60 * 24);
                }
            } catch (e) {
                console.warn("Market data fail:", e);
            }
            setLoadingProgress(55);

            // 4. Fetch Menu Items (Sequential with robustness)
            let allItems: MenuItem[] = [];
            let hasMore = true;
            let page = 0;
            const pageSize = 1000;

            while (hasMore) {
                const { data, error } = await supabase
                    .from('menuitems')
                    .select('*')
                    .range(page * pageSize, (page + 1) * pageSize - 1);

                if (error) {
                    console.error("Menu fetch error:", error);
                    throw new Error(error.message);
                }

                if (data && data.length > 0) {
                    const mapped = data.map((row: any) => ({
                        ...row,
                        // 🌉 ROBUST BRIDGE: Handles exact Supabase headers with Normalization
                        insegna: normalizeString(row.NomeLocale || row.Venue_Name || 'Unknown Venue'),
                        via: row.venue_address || row.Address || '',
                        citta: normalizeString(row.Città || row.venue_city || row.City || 'Unknown City'),
                        regione: (() => {
                            const raw = normalizeString(row.RegionMatch || row.Region || 'Unknown Region');
                            if (raw === 'Aosta') return 'Valle d\'Aosta';
                            if (raw === 'Trentino') return 'Trentino-Alto Adige';
                            return raw;
                        })(),
                        tipologiaCliente: normalizeString(row.TipologiaLocale || row.Customer_Type || 'Unknown Type'),
                        brandOwner: normalizeString(row.ingredients_brand_owner || row.BrandOwner || 'Unknown Owner'),
                        brand: normalizeString(row.ingredients_brand || row.Brand || 'Unknown Brand'),
                        macroCategoria: normalizeString(row.Broad_category || row.MacroCategory || 'Other'),
                        categoriaProdotto: normalizeString(row.ingredients_categoria || row.Product_Category || 'Generic'),
                        nomeCocktail: normalizeString(row.Item_Name || row.CocktailName || 'General Item'),
                        categoryName: normalizeString(row["Category Name"] || ''),
                        subCategory: normalizeString(row.Sub_Category || ''),
                        prezzo: typeof row.Price === 'number' ? row.Price : (parseFloat(String(row.Price || '0').replace(',', '.')) || 0),
                        data: row['Item Date'] || row.Date || row.data || '2024-01-01',
                        venueId: row.NomeLocale || row.Venue_Name || '',
                    }));
                    allItems = [...allItems, ...mapped];

                    if (data.length < pageSize) hasMore = false;
                    else page++;

                    setLoadingProgress(Math.min(95, 55 + (allItems.length / 500))); // Dynamic update
                } else {
                    hasMore = false;
                }
            }

            setMenuItems(allItems);
            // Cache the huge menu items list
            // Use User ID in key to separate cache per user if needed (though data is shared, permissions differ)
            // Actually, safe to just check `user.id` exists.
            if (user) {
                setCache(`menuItems_${user.id}`, allItems, 60 * 4); // Cache for 4 hours
            }

            setLoadingProgress(98);

            // 5. Initial Metrics
            let dataForMetrics = allItems;
            if (userRole === 'user' && assignedBrand !== 'ALL' && assignedBrand !== 'PENDING') {
                const target = normalizeString(assignedBrand);
                dataForMetrics = allItems.filter(item => normalizeString(item.brandOwner) === target);
            }

            calculateMetrics(dataForMetrics);
            setLoadingProgress(100);

            setTimeout(() => {
                setLoading(false);
            }, 300);

        } catch (err) {
            console.error('CRITICAL LOAD ERROR:', err);
            setError(err instanceof Error ? err.message : 'Critical system failure');
            setLoading(false);
            setLoadingProgress(0);
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

    const enrichedDataUnfiltered = useMemo(() => {
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

        // 🎯 ENRICH DATA: Map raw rows to master data
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

    const enrichedData = useMemo(() => {
        // 🛡️ PERMISSION FILTERING: Restrict 'user' role to their assigned brand owner
        if (userPermissions.role === 'user' && userPermissions.brand !== 'ALL') {
            const targetBrandOwner = normalizeString(userPermissions.brand);
            return enrichedDataUnfiltered.filter(item => normalizeString(item.brandOwner) === targetBrandOwner);
        }

        return enrichedDataUnfiltered;
    }, [enrichedDataUnfiltered, userPermissions]);

    // 🎯 FILTER MASTER DATA: Ensure filter dropdowns only show relevant options for restricted users
    const filteredMasterData = useMemo(() => {
        if (userPermissions.role === 'admin' || userPermissions.role === 'super_admin' || userPermissions.role === 'editor' || userPermissions.brand === 'ALL') {
            return masterData;
        }

        const targetBrandOwner = normalizeString(userPermissions.brand);
        return masterData.filter(item => normalizeString(item.brandOwner) === targetBrandOwner);
    }, [masterData, userPermissions]);

    return (
        <DataContext.Provider value={{
            menuItems,
            enrichedData,
            fullUniverse: enrichedDataUnfiltered,
            masterData: filteredMasterData,
            loading,
            error,
            metrics,
            userPermissions,
            marketUniverse,
            marketBenchmarks,
            loadingProgress,
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
