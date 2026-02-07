import fs from 'fs';
import Papa from 'papaparse';

const csvFile = fs.readFileSync('temp_sheet_data.csv', 'utf8');

Papa.parse(csvFile, {
    header: true,
    complete: (results) => {
        const owners = new Set();
        results.data.forEach(row => {
            if (row.BrandOwner) {
                owners.add(row.BrandOwner.trim());
            }
        });
        console.log("Unique Brand Owners:", Array.from(owners));
        console.log("Total Rows:", results.data.length);
    }
});
