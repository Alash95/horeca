
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Correct path: one level up from horeca-intelligence-dashboard
const excelPath = path.resolve(__dirname, '../MASTER BEVERAGE 19.11.2025.xlsx');

console.log(`Reading file from: ${excelPath}`);

try {
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Get headers
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (jsonData.length > 0) {
        console.log('Headers:', jsonData[0]);
        console.log('First row:', jsonData[1]);
        console.log('Second row:', jsonData[2]);
    } else {
        console.log('Empty sheet');
    }
} catch (error) {
    console.error('Error reading file:', error.message);
}
