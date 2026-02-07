
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const excelPath = path.resolve(__dirname, '../../MASTER BEVERAGE 19.11.2025.xlsx');
const outputPath = path.resolve(__dirname, '../public/data/product-master.json');

console.log(`Reading Master Beverage file from: ${excelPath}`);

try {
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rawData = XLSX.utils.sheet_to_json(sheet);

    console.log(`Found ${rawData.length} rows.`);

    const processedData = rawData.map(row => {
        // Normalize Macro Category
        let macroCat = row['macro category'];
        if (macroCat) {
            // Convert to Title Case (e.g., "SPIRITS" -> "Spirits")
            macroCat = macroCat.charAt(0).toUpperCase() + macroCat.slice(1).toLowerCase();

            // Handle specific cases if needed to match the union type exactly
            // "Spirits" | "Wine" | "Champagne" | "Beer" | "Soft Drink"
            if (macroCat === 'Soft drink') macroCat = 'Soft Drink';
        }

        // Collect aliases
        const aliases = [];
        if (row['alias1']) aliases.push(String(row['alias1']).trim());
        if (row['alias2']) aliases.push(String(row['alias2']).trim());

        return {
            brand: String(row['Brand'] || '').trim(),
            brandOwner: String(row['BrandOwner'] || '').trim(),
            macroCategoria: macroCat,
            categoriaProdotto: String(row['category'] || '').trim(),
            aliases: aliases.length > 0 ? aliases : undefined
        };
    }).filter(item => item.brand && item.brandOwner); // Filter out empty rows

    // Ensure directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2));
    console.log(`Successfully wrote ${processedData.length} items to ${outputPath}`);

} catch (error) {
    console.error('Error processing file:', error);
    process.exit(1);
}
