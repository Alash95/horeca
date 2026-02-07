import fs from 'fs';
import Papa from 'papaparse';

const csvPath = 'temp_sheet_data.csv';
const fileContent = fs.readFileSync(csvPath, 'utf8');

Papa.parse(fileContent, {
    header: true,
    complete: (results) => {
        const data = results.data.filter(row => row.Venue_Name); // Filter out empty lines
        const output = [];
        output.push(`Total Rows: ${data.length}`);

        // UNIQUE VENUES
        const venues = new Set(data.map(row => row.Venue_Name.trim()).filter(Boolean));
        output.push(`Unique Venues (Venue_Name): ${venues.size}`);

        // UNIQUE BRANDS
        const brands = new Set(data.map(row => row.Brand?.trim()).filter(Boolean));
        output.push(`Unique Brands: ${brands.size}`);

        // UNIQUE BRAND OWNERS
        const brandOwners = new Set(data.map(row => row.BrandOwner?.trim()).filter(Boolean));
        output.push(`Unique Brand Owners: ${brandOwners.size}`);

        // TOTAL LISTINGS
        output.push(`Total Listings: ${data.length}`);

        // AVERAGE PRICE
        const prices = data.map(row => parseFloat(String(row.Price).replace(',', '.'))).filter(p => !isNaN(p));
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        output.push(`Average Price: ${avgPrice.toFixed(2)}`);

        // COCKTAIL PENETRATION
        // Based on CSV guide: MenuItems[Sezione_drink_list] = "Cocktail"
        // In our CSV, it seems CocktailName presence or MacroCategory SPIRITS might be it.
        // Let's check unique Venue_Names that have a CocktailName
        const cocktailVenues = new Set(data.filter(row => row.CocktailName?.trim()).map(row => row.Venue_Name.trim()));
        output.push(`Unique Venues with Cocktails: ${cocktailVenues.size}`);
        output.push(`Cocktail Menu Penetration: ${(cocktailVenues.size / venues.size * 100).toFixed(2)}%`);

        output.push('\nVenues List:');
        Array.from(venues).sort().forEach(v => output.push(` - ${v}`));

        fs.writeFileSync('audit_results.txt', output.join('\n'));
        console.log('Audit results written to audit_results.txt');
    }
});
