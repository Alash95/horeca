/**
 * MAPPING TABLE: City -> Italian Region
 */
const CITY_TO_REGION = {
    'MILANO': 'Lombardia',
    'MILAN': 'Lombardia',
    'ROMA': 'Lazio',
    'ROME': 'Lazio',
    'TORINO': 'Piemonte',
    'TURIN': 'Piemonte',
    'VENICE': 'Veneto',
    'VENEZIA': 'Veneto',
    'PALERMO': 'Sicilia',
    'FIRENZE': 'Toscana',
    'FLORENCE': 'Toscana',
    'BULLEIT BOURBON WHISKY': 'Unknown' // Likely a data error in CSV
};

const fs = require('fs');
const content = fs.readFileSync('menuitems latest - menuitems.csv', 'utf8');
const lines = content.split('\n');

const updates = [];
const header = lines[0];

// Use a simple parser since commas might exist inside quotes
function parseLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

lines.slice(1).forEach(l => {
    if (!l.trim()) return;
    const cols = parseLine(l);
    if (cols.length < 6) return;

    const id = cols[0];
    const rawCity = cols[3].toUpperCase().replace(/^"|"$/g, '');
    const region = CITY_TO_REGION[rawCity] || 'Unknown';

    if (region !== 'Unknown') {
        updates.push(`UPDATE menuitems SET "RegionMatch" = '${region}' WHERE "Menu ID" = ${id};`);
    } else {
        // Log unknowns for verification
        // console.warn(`ID ${id}: Unknown city "${rawCity}"`);
    }
});

const sqlContent = [
    '-- Refined Italian Region Updates',
    '-- Based on City mapping and Horeca Intelligence UI standards\n',
    ...updates
].join('\n');

fs.writeFileSync('region_match_updates_refined.sql', sqlContent);
console.log(`✅ Generated ${updates.length} SQL updates in region_match_updates_refined.sql`);
