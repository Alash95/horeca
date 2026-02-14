const fs = require('fs');
const content = fs.readFileSync('menuitems latest - menuitems.csv', 'utf8');
const lines = content.split('\n');
const cities = new Set();
const venues = {};

lines.slice(1).forEach(l => {
    if (!l.trim()) return;
    const cols = l.split(',');
    if (cols.length < 6) return;

    // Clean city name (column D - index 3)
    let city = cols[3].trim().replace(/^"|"$/g, '').toUpperCase();
    if (city) cities.add(city);

    // Track venue and their city (column B - index 1)
    let venue = cols[1].trim().replace(/^"|"$/g, '');
    if (venue && !venues[venue]) {
        venues[venue] = city;
    }
});

console.log('--- UNIQUE CITIES ---');
console.log(JSON.stringify(Array.from(cities).sort(), null, 2));
console.log('\n--- VENUE SAMPLE ---');
const venueKeys = Object.keys(venues);
console.log(JSON.stringify(venueKeys.slice(0, 10).map(k => `${k}: ${venues[k]}`), null, 2));
