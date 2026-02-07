import fs from 'fs';
import Papa from 'papaparse';

const csvFile = fs.readFileSync('temp_sheet_data.csv', 'utf8');

Papa.parse(csvFile, {
    header: true,
    complete: (results) => {
        const allVenues = new Set();
        const bacardiVenues = new Set();

        results.data.forEach(row => {
            if (!row.Venue_Name) return;

            const venueKey = `${row.Venue_Name}-${row.City}`; // Simplified key
            allVenues.add(venueKey);

            if (row.BrandOwner && row.BrandOwner.trim() === 'Bacardi Martini') {
                bacardiVenues.add(venueKey);
            }
        });

        const total = allVenues.size;
        const bacardi = bacardiVenues.size;
        const percentage = total > 0 ? (bacardi / total) * 100 : 0;

        console.log(`Total Unique Venues: ${total}`);
        console.log(`Venues with Bacardi Martini: ${bacardi}`);
        console.log(`Global Percentage: ${percentage.toFixed(2)}%`);
    }
});
