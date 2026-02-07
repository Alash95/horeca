import fs from 'fs';
import Papa from 'papaparse';

const csvFile = fs.readFileSync('temp_sheet_data.csv', 'utf8');

Papa.parse(csvFile, {
    header: true,
    preview: 1,
    complete: (results) => {
        console.log("Headers:", results.meta.fields);
        console.log("First Row:", results.data[0]);
    }
});
