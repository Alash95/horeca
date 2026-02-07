import Papa from 'papaparse';
import { ProductMasterItem } from '../types';

const SHEET_ID = '15y6oQvwtm5pKnW_YcG3JfUtTP0Oi0dacDKbikbX1Lx8';
const SHEET_GID = '0';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

interface SheetRow {
    Brand: string;
    BrandOwner: string;
    'macro category': string;
    category: string;
    alias1?: string;
    alias2?: string;
    [key: string]: string | undefined;
}

export const fetchMasterDataFromSheet = async (): Promise<ProductMasterItem[]> => {
    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch Google Sheet: ${response.status} ${response.statusText}`);
        }
        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse<SheetRow>(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const parsedData: ProductMasterItem[] = results.data
                        .filter(row => row.Brand && row.BrandOwner) // Ensure required fields exist
                        .map(row => {
                            const aliases: string[] = [];
                            if (row.alias1) aliases.push(row.alias1.trim());
                            if (row.alias2) aliases.push(row.alias2.trim());

                            // Normalize macro category
                            let macroCat = row['macro category']?.trim() || '';
                            // Simple title case normalization if needed, though the sheet seems to have "SPIRITS" etc.
                            // We match the type definition: "Spirits" | "Wine" | "Champagne" | "Beer" | "Soft Drink"
                            // If the sheet has uppercase, we might need to map it.
                            // Let's assume standard casing or map common ones.
                            const upper = macroCat.toUpperCase();
                            if (upper === 'SPIRITS') macroCat = 'Spirits';
                            else if (upper === 'WINE') macroCat = 'Wine';
                            else if (upper === 'CHAMPAGNE') macroCat = 'Champagne';
                            else if (upper === 'BEER') macroCat = 'Beer';
                            else if (upper === 'SOFT DRINK' || upper === 'SOFT DRINKS') macroCat = 'Soft Drink';

                            return {
                                brand: row.Brand.trim(),
                                brandOwner: row.BrandOwner.trim(),
                                macroCategoria: macroCat as any, // Cast to specific type
                                categoriaProdotto: row.category?.trim() || '',
                                aliases: aliases.length > 0 ? aliases : undefined
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
        console.error("Error loading Google Sheet data:", error);
        throw error;
    }
};
