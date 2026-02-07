import fs from 'fs';
import Papa from 'papaparse';

const fileContent = fs.readFileSync('temp_sheet_data.csv', 'utf8');

Papa.parse(fileContent, {
    header: true,
    complete: (results) => {
        const cocktails = new Set();
        results.data.forEach(row => {
            if (row.Brand === 'Gin Tanqueray') {
                cocktails.add(row.CocktailName);
            }
        });

        console.log("Cocktails for Gin Tanqueray:", Array.from(cocktails).sort());
    }
});
