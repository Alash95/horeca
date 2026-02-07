import Papa from 'papaparse';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1cDqPmWSEgfHfOBy8zIS9EZfEu_LRj4xn/export?format=csv&gid=890021754';

async function verifyData() {
    try {
        console.log("Fetching CSV from:", CSV_URL);
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const csvText = await response.text();

        Papa.parse(csvText, {
            header: true,
            complete: (results) => {
                const data = results.data;
                const region = 'Lombardia';
                const type = 'Cocktail Bar';

                // Normalization similar to loader
                const processed = data.map(row => ({
                    ...row,
                    regione: row.Region?.trim(),
                    tipologiaCliente: row.Customer_Type?.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
                    venue: row.Venue_Name?.trim()
                }));

                const lombardiaData = processed.filter(d => d.regione === region);
                console.log(`Total items in ${region}:`, lombardiaData.length);

                const cocktailBars = lombardiaData.filter(d => d.tipologiaCliente === type);
                console.log(`Total items in ${region} - ${type}:`, cocktailBars.length);

                const uniqueVenues = new Set(cocktailBars.map(d => d.venue));
                console.log(`Unique Venues in ${region} - ${type}:`, uniqueVenues.size);
                console.log('Venue Names:', Array.from(uniqueVenues));
            }
        });
    } catch (error) {
        console.error("Error:", error.message);
    }
}

verifyData();
