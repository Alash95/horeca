import Papa from 'papaparse';
import { MenuItem } from '../types';

const SHEET_ID = '1cDqPmWSEgfHfOBy8zIS9EZfEu_LRj4xn';
const SHEET_GID = '890021754';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

interface DrinklistRow {
    Region: string;
    City: string;
    Venue_Name: string;
    Customer_Type: string;
    BrandOwner: string;
    Brand: string;
    MacroCategory: string;
    Product_Category: string;
    CocktailName: string;
    Price: string;
    Top4: string;
}

const normalizeCocktailName = (rawName: string | undefined): string | undefined => {
    if (!rawName) return undefined;
    const lower = rawName.toLowerCase();

    if (lower.includes('negroni')) return 'Negroni';
    if (lower.includes('spritz')) return 'Spritz';
    if (lower.includes('americano')) return 'Americano';
    if (lower.includes('boulevardier')) return 'Boulevardier';
    if (lower.includes('paloma')) return 'Paloma';

    // Gin & Tonic variations
    if (lower.includes('gin') && lower.includes('tonic')) return 'Gin&Tonic';
    if (lower.includes(' gt') || lower.endsWith(' gt')) return 'Gin&Tonic';
    if (lower.includes('capri tonic') || lower.includes('black tonic') || lower.includes('mediterranean')) return 'Gin&Tonic'; // Heuristic for Gin Mare/Amuerte

    // Martini variations
    if (lower.includes('martini dry') || lower.includes('white martini')) return 'Cocktail Martini';

    // If no match, return original (or null if we only want strict targets)
    // Returning original allows other cocktails to be listed if we expand the UI later
    return rawName;
};

export const fetchDrinklistData = async (): Promise<MenuItem[]> => {
    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch Drinklist Sheet: ${response.status} ${response.statusText}`);
        }
        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse<DrinklistRow>(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const parsedData: MenuItem[] = results.data
                        .filter(row => row.Venue_Name && row.Brand) // Ensure required fields exist
                        .map((row, index) => {
                            return {
                                "Menu ID": `dl-${index}`,
                                insegna: row.Venue_Name?.trim() || 'Unknown Venue',
                                citta: row.City?.trim() || 'Unknown City',
                                regione: (row.Region?.trim() || 'Unknown Region') as any,
                                tipologiaCliente: (row.Customer_Type?.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown Type'),
                                brandOwner: row.BrandOwner?.trim() || 'Unknown Owner',
                                brand: row.Brand?.trim() || 'Unknown Brand',
                                macroCategoria: (row.MacroCategory?.trim() || 'Unknown Category') as any,
                                categoriaProdotto: row.Product_Category?.trim() || 'Unknown Product',
                                nomeCocktail: normalizeCocktailName(row.CocktailName?.trim()),
                                prezzo: parseFloat(row.Price?.replace(',', '.') || '0'),
                                data: '2024-01-01', // Default date as it's missing in source
                                via: '' // Missing in source
                            };
                        });
                    resolve(parsedData);
                },
                error: (error: Error) => {
                    reject(error);
                }
            });
        });
    } catch (error) {
        console.error("Error loading Drinklist data:", error);
        throw error;
    }
};
