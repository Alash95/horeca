import type { MenuItem } from './types';

export const MOCK_DATA: MenuItem[] = [];

export const CITY_COORDS: Record<string, { name: string, coords: { x: number, y: number } }[]> = {
    "Lombardia": [
        { name: "Milano", coords: { x: 205, y: 135 } },
        { name: "Brescia", coords: { x: 235, y: 130 } },
        { name: "Como", coords: { x: 200, y: 115 } },
    ],
    "Lazio": [
        { name: "Roma", coords: { x: 320, y: 360 } },
        { name: "Latina", coords: { x: 335, y: 380 } },
    ],
    "Toscana": [
        { name: "Firenze", coords: { x: 260, y: 240 } },
        { name: "Siena", coords: { x: 265, y: 265 } },
        { name: "Pisa", coords: { x: 235, y: 245 } },
    ],
    "Sicilia": [
        { name: "Palermo", coords: { x: 350, y: 550 } },
        { name: "Catania", coords: { x: 420, y: 560 } },
    ],
    "Campania": [
        { name: "Napoli", coords: { x: 395, y: 410 } },
        { name: "Salerno", coords: { x: 410, y: 420 } },
    ],
    "Veneto": [
        { name: "Venezia", coords: { x: 310, y: 155 } },
        { name: "Verona", coords: { x: 270, y: 155 } },
    ],
    "Piemonte": [
        { name: "Torino", coords: { x: 140, y: 150 } },
    ],
    "Emilia-Romagna": [
        { name: "Bologna", coords: { x: 275, y: 200 } },
    ],
    "Liguria": [
        { name: "Genova", coords: { x: 190, y: 195 } },
        { name: "Portofino", coords: { x: 200, y: 200 } }
    ]
};