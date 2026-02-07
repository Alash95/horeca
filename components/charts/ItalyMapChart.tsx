import { useMemo, useState, useRef, FC, MouseEvent as ReactMouseEvent } from 'react';
import type { MenuItem, Filters, TimeSelection } from '../../types';
import { formatPeriod } from '../../utils/timeUtils';
import ChartContainer from './ChartContainer';
import { CITY_COORDS } from '../../constants';
import { formatNumber } from '../../utils/formatters';

interface ItalyMapChartProps {
    allData: MenuItem[];
    filteredData: MenuItem[];
    filters: Filters;
    timeSelection: TimeSelection;
    onRegionFilter: (region: string | null) => void;
    onCityFilter: (city: string | null) => void;
    activeRegion: string | null;
    activeCity: string | null;
}

const regions = [
    { id: "Abruzzo", name: "Abruzzo", d: "M368.5,296.4l-2.1,1.4l-1.4,4.3l-5,0.7l-2.8,2.8l-0.7,5.7l2.8,4.3l-0.7,2.8l-4.3,2.8l-2.1,3.6l-2.8,0.7l-2.1,2.8l-1.4,5l-4.3,2.8l-2.1-0.7l-0.7-2.1l-2.1-0.7l-2.1-2.8l-3.6,0.7l-0.7-2.1l-2.8-0.7l-2.8,0.7l-1.4-2.1l-2.8,0.7l-3.6-2.1l-0.7-3.6l1.4-2.8l-0.7-2.1l-2.8-1.4l-2.1-2.8l0.7-2.8l2.8-2.1l0.7-4.3l2.8-2.1l5-0.7l0.7-2.1l4.3-2.1l2.1-2.8l4.3-1.4l2.8-2.8l2.1-0.7l2.1,0.7l1.4,2.8l2.1,0.7l0.7,2.1l2.8,0.7l2.8-0.7l2.1,1.4l3.6-0.7l2.8,2.1l1.4,3.6l3.6,1.4L368.5,296.4z" },
    { id: "Basilicata", name: "Basilicata", d: "M426.1,399.6l-2.1,2.1l-2.8,0.7l-2.1,2.8l-0.7,3.6l-3.6,2.1l-2.8,0.7l-2.1,2.8l-2.1-0.7l-2.8,1.4l-2.8,2.8l-2.8,0.7l-2.1,2.1l-2.8,0.7l-0.7,2.1l-2.8,0.7l-2.1,2.1l-2.8,0.7l-2.1,2.1l-2.8,0.7l-2.1-0.7l-2.8-2.1l-2.1-0.7l-2.8-2.1l-0.7-2.8l2.1-2.1l0.7-3.6l-0.7-2.8l-2.1-2.8l-0.7-2.8l2.1-2.1l0.7-2.8l2.1-1.4l2.8-0.7l2.1-2.1l2.8-0.7l0.7-2.8l2.1-2.1l2.8-0.7l2.1-2.1l2.8-0.7l2.1-2.1l2.8,0.7l2.1-0.7l2.8,0.7l2.1,1.4l2.8,0.7l2.1,2.1l2.8,0.7l2.1,2.1l0.7,2.8l-0.7,2.8L426.1,399.6z" },
    { id: "Calabria", name: "Calabria", d: "M451.7,467.9l-2.1,2.8l-2.8,0.7l-2.1,2.8l-0.7,3.6l-2.8,2.1l-2.1,2.8l-2.8,0.7l-2.1,2.8l-0.7,2.8l-2.8,2.1l-2.1,2.8l-0.7,3.6l-2.8,2.1l-2.1,2.8l-0.7,2.8l2.1,2.1l2.8,0.7l2.1-0.7l2.8-2.1l2.1-0.7l2.8-2.1l2.1-2.8l2.8-0.7l2.1-2.8l0.7-2.8l2.8-2.1l2.1-2.8l2.8-0.7l2.1-2.8l0.7-3.6l-0.7-2.8l-2.1-2.8l-2.8-0.7l-2.1-2.8l-0.7-2.8L451.7,467.9z" },
    { id: "Campania", name: "Campania", d: "M389.1,381.1l-2.1,2.1l-2.8,0.7l-2.1,2.8l-0.7,3.6l-2.8,2.1l-2.1,2.8l-2.8,0.7l-2.1,2.8l-0.7,2.8l-2.8,2.1l-2.1,2.8l-0.7,3.6l-2.8,2.1l-2.1,2.8l-0.7,2.8l2.1,2.1l2.8,0.7l2.1-0.7l2.8-2.1l2.1-0.7l2.8-2.1l2.1-2.8l2.8-0.7l2.1-2.8l0.7-2.8l2.8-2.1l2.1-2.8l2.8-0.7l2.1-2.8l0.7-3.6l-0.7-2.8l-2.1-2.8l-2.8-0.7l-2.1-2.8l-0.7-2.8L389.1,381.1z" },
    { id: "Emilia-Romagna", name: "Emilia-Romagna", d: "M281.2,189.6l-2.1,1.4l-1.4,4.3l-5,0.7l-2.8,2.8l-0.7,5.7l2.8,4.3l-0.7,2.8l-4.3,2.8l-2.1,3.6l-2.8,0.7l-2.1,2.8l-1.4,5l-4.3,2.8l-2.1-0.7l-0.7-2.1l-2.1-0.7l-2.1-2.8l-3.6,0.7l-0.7-2.1l-2.8-0.7l-2.8,0.7l-1.4-2.1l-2.8,0.7l-3.6-2.1l-0.7-3.6l1.4-2.8l-0.7-2.1l-2.8-1.4l-2.1-2.8l0.7-2.8l2.8-2.1l0.7-4.3l2.8-2.1l5-0.7l0.7-2.1l4.3-2.1l2.1-2.8l4.3-1.4l2.8-2.8l2.1-0.7l2.1,0.7l1.4,2.8l2.1,0.7l0.7,2.1l2.8,0.7l2.8-0.7l2.1,1.4l3.6-0.7l2.8,2.1l1.4,3.6l3.6,1.4L281.2,189.6z" },
    { id: "Friuli-Venezia Giulia", name: "Friuli-Venezia Giulia", d: "M328.8,112.8l-2.1,1.4l-1.4,4.3l-5,0.7l-2.8,2.8l-0.7,5.7l2.8,4.3l-0.7,2.8l-4.3,2.8l-2.1,3.6l-2.8,0.7l-2.1,2.8l-1.4,5l-4.3,2.8l-2.1-0.7l-0.7-2.1l-2.1-0.7l-2.1-2.8l-3.6,0.7l-0.7-2.1l-2.8-0.7l-2.8,0.7l-1.4-2.1l-2.8,0.7l-3.6-2.1l-0.7-3.6l1.4-2.8l-0.7-2.1l-2.8-1.4l-2.1-2.8l0.7-2.8l2.8-2.1l0.7-4.3l2.8-2.1l5-0.7l0.7-2.1l4.3-2.1l2.1-2.8l4.3-1.4l2.8-2.8l2.1-0.7l2.1,0.7l1.4,2.8l2.1,0.7l0.7,2.1l2.8,0.7l2.8-0.7l2.1,1.4l3.6-0.7l2.8,2.1l1.4,3.6l3.6,1.4L328.8,112.8z" },
    { id: "Lazio", name: "Lazio", d: "M318.1,339.1l-2.1,2.1l-2.8,0.7l-2.1,2.8l-0.7,3.6l-2.8,2.1l-2.1,2.8l-2.8,0.7l-2.1,2.8l-0.7,2.8l-2.8,2.1l-2.1,2.8l-0.7,3.6l-2.8,2.1l-2.1,2.8l-0.7,2.8l2.1,2.1l2.8,0.7l2.1-0.7l2.8-2.1l2.1-0.7l2.8-2.1l2.1-2.8l2.8-0.7l2.1-2.8l0.7-2.8l2.8-2.1l2.1-2.8l2.8-0.7l2.1-2.8l0.7-3.6l-0.7-2.8l-2.1-2.8l-2.8-0.7l-2.1-2.8l-0.7-2.8L318.1,339.1z" },
    { id: "Liguria", name: "Liguria", d: "M158.3,189.6l-2.1,1.4l-1.4,4.3l-5,0.7l-2.8,2.8l-0.7,5.7l2.8,4.3l-0.7,2.8l-4.3,2.8l-2.1,3.6l-2.8,0.7l-2.1,2.8l-1.4,5l-4.3,2.8l-2.1-0.7l-0.7-2.1l-2.1-0.7l-2.1-2.8l-3.6,0.7l-0.7-2.1l-2.8-0.7l-2.8,0.7l-1.4-2.1l-2.8,0.7l-3.6-2.1l-0.7-3.6l1.4-2.8l-0.7-2.1l-2.8-1.4l-2.1-2.8l0.7-2.8l2.8-2.1l0.7-4.3l2.8-2.1l5-0.7l0.7-2.1l4.3-2.1l2.1-2.8l4.3-1.4l2.8-2.8l2.1-0.7l2.1,0.7l1.4,2.8l2.1,0.7l0.7,2.1l2.8,0.7l2.8-0.7l2.1,1.4l3.6-0.7l2.8,2.1l1.4,3.6l3.6,1.4L158.3,189.6z" },
    { id: "Lombardia", name: "Lombardia", d: "M201.7,112.8l-2.1,1.4l-1.4,4.3l-5,0.7l-2.8,2.8l-0.7,5.7l2.8,4.3l-0.7,2.8l-4.3,2.8l-2.1,3.6l-2.8,0.7l-2.1,2.8l-1.4,5l-4.3,2.8l-2.1-0.7l-0.7-2.1l-2.1-0.7l-2.1-2.8l-3.6,0.7l-0.7-2.1l-2.8-0.7l-2.8,0.7l-1.4-2.1l-2.8,0.7l-3.6-2.1l-0.7-3.6l1.4-2.8l-0.7-2.1l-2.8-1.4l-2.1-2.8l0.7-2.8l2.8-2.1l0.7-4.3l2.8-2.1l5-0.7l0.7-2.1l4.3-2.1l2.1-2.8l4.3-1.4l2.8-2.8l2.1-0.7l2.1,0.7l1.4,2.8l2.1,0.7l0.7,2.1l2.8,0.7l2.8-0.7l2.1,1.4l3.6-0.7l2.8,2.1l1.4,3.6l3.6,1.4L201.7,112.8z" },
    { id: "Marche", name: "Marche", d: "M328.8,253.9l-2.1,1.4l-1.4,4.3l-5,0.7l-2.8,2.8l-0.7,5.7l2.8,4.3l-0.7,2.8l-4.3,2.8l-2.1,3.6l-2.8,0.7l-2.1,2.8l-1.4,5l-4.3,2.8l-2.1-0.7l-0.7-2.1l-2.1-0.7l-2.1-2.8l-3.6,0.7l-0.7-2.1l-2.8-0.7l-2.8,0.7l-1.4-2.1l-2.8,0.7l-3.6-2.1l-0.7-3.6l1.4-2.8l-0.7-2.1l-2.8-1.4l-2.1-2.8l0.7-2.8l2.8-2.1l0.7-4.3l2.8-2.1l5-0.7l0.7-2.1l4.3-2.1l2.1-2.8l4.3-1.4l2.8-2.8l2.1-0.7l2.1,0.7l1.4,2.8l2.1,0.7l0.7,2.1l2.8,0.7l2.8-0.7l2.1,1.4l3.6-0.7l2.8,2.1l1.4,3.6l3.6,1.4L328.8,253.9z" },
    { id: "Molise", name: "Molise", d: "M379.2,339.1l-2.1,2.1l-2.8,0.7l-2.1,2.8l-0.7,3.6l-2.8,2.1l-2.1,2.8l-2.8,0.7l-2.1,2.8l-0.7,2.8l-2.8,2.1l-2.1,2.8l-0.7,3.6l-2.8,2.1l-2.1,2.8l-0.7,2.8l2.1,2.1l2.8,0.7l2.1-0.7l2.8-2.1l2.1-0.7l2.8-2.1l2.1-2.8l2.8-0.7l2.1-2.8l0.7-2.8l2.8-2.1l2.1-2.8l2.8-0.7l2.1-2.8l0.7-3.6l-0.7-2.8l-2.1-2.8l-2.8-0.7l-2.1-2.8l-0.7-2.8L379.2,339.1z" },
    { id: "Piemonte", name: "Piemonte", d: "M130.5,134.1l-2.1,1.4l-1.4,4.3l-5,0.7l-2.8,2.8l-0.7,5.7l2.8,4.3l-0.7,2.8l-4.3,2.8l-2.1,3.6l-2.8,0.7l-2.1,2.8l-1.4,5l-4.3,2.8l-2.1-0.7l-0.7-2.1l-2.1-0.7l-2.1-2.8l-3.6,0.7l-0.7-2.1l-2.8-0.7l-2.8,0.7l-1.4-2.1l-2.8,0.7l-3.6-2.1l-0.7-3.6l1.4-2.8l-0.7-2.1l-2.8-1.4l-2.1-2.8l0.7-2.8l2.8-2.1l0.7-4.3l2.8-2.1l5-0.7l0.7-2.1l4.3-2.1l2.1-2.8l4.3-1.4l2.8-2.8l2.1-0.7l2.1,0.7l1.4,2.8l2.1,0.7l0.7,2.1l2.8,0.7l2.8-0.7l2.1,1.4l3.6-0.7l2.8,2.1l1.4,3.6l3.6,1.4L130.5,134.1z" },
    { id: "Puglia", name: "Puglia", d: "M451.7,381.1l-2.1,2.1l-2.8,0.7l-2.1,2.8l-0.7,3.6l-2.8,2.1l-2.1,2.8l-2.8,0.7l-2.1,2.8l-0.7,2.8l-2.8,2.1l-2.1,2.8l-0.7,3.6l-2.8,2.1l-2.1,2.8l-0.7,2.8l2.1,2.1l2.8,0.7l2.1-0.7l2.8-2.1l2.1-0.7l2.8-2.1l2.1-2.8l2.8-0.7l2.1-2.8l0.7-2.8l2.8-2.1l2.1-2.8l2.8-0.7l2.1-2.8l0.7-3.6l-0.7-2.8l-2.1-2.8l-2.8-0.7l-2.1-2.8l-0.7-2.8L451.7,381.1z" },
    { id: "Sardegna", name: "Sardegna", d: "M142.6,423.8l-2.1,2.1l-2.8,0.7l-2.1,2.8l-0.7,3.6l-2.8,2.1l-2.1,2.8l-2.8,0.7l-2.1,2.8l-0.7,2.8l-2.8,2.1l-2.1,2.8l-0.7,3.6l-2.8,2.1l-2.1,2.8l-0.7,2.8l2.1,2.1l2.8,0.7l2.1-0.7l2.8-2.1l2.1-0.7l2.8-2.1l2.1-2.8l2.8-0.7l2.1-2.8l0.7-2.8l2.8-2.1l2.1-2.8l2.8-0.7l2.1-2.8l0.7-3.6l-0.7-2.8l-2.1-2.8l-2.8-0.7l-2.1-2.8l-0.7-2.8L142.6,423.8z" },
    { id: "Sicilia", name: "Sicilia", d: "M368.5,530.4l-2.1,2.1l-2.8,0.7l-2.1,2.8l-0.7,3.6l-2.8,2.1l-2.1,2.8l-2.8,0.7l-2.1,2.8l-0.7,2.8l-2.8,2.1l-2.1,2.8l-0.7,3.6l-2.8,2.1l-2.1,2.8l-0.7,2.8l2.1,2.1l2.8,0.7l2.1-0.7l2.8-2.1l2.1-0.7l2.8-2.1l2.1-2.8l2.8-0.7l2.1-2.8l0.7-2.8l2.8-2.1l2.1-2.8l2.8-0.7l2.1-2.8l0.7-3.6l-0.7-2.8l-2.1-2.8l-2.8-0.7l-2.1-2.8l-0.7-2.8L368.5,530.4z" },
    { id: "Toscana", name: "Toscana", d: "M242.4,232.6l-2.1,1.4l-1.4,4.3l-5,0.7l-2.8,2.8l-0.7,5.7l2.8,4.3l-0.7,2.8l-4.3,2.8l-2.1,3.6l-2.8,0.7l-2.1,2.8l-1.4,5l-4.3,2.8l-2.1-0.7l-0.7-2.1l-2.1-0.7l-2.1-2.8l-3.6,0.7l-0.7-2.1l-2.8-0.7l-2.8,0.7l-1.4-2.1l-2.8,0.7l-3.6-2.1l-0.7-3.6l1.4-2.8l-0.7-2.1l-2.8-1.4l-2.1-2.8l0.7-2.8l2.8-2.1l0.7-4.3l2.8-2.1l5-0.7l0.7-2.1l4.3-2.1l2.1-2.8l4.3-1.4l2.8-2.8l2.1-0.7l2.1,0.7l1.4,2.8l2.1,0.7l0.7,2.1l2.8,0.7l2.8-0.7l2.1,1.4l3.6-0.7l2.8,2.1l1.4,3.6l3.6,1.4L242.4,232.6z" },
    { id: "Trentino-Alto Adige", name: "Trentino-Alto Adige", d: "M266.2,70.2l-2.1,1.4l-1.4,4.3l-5,0.7l-2.8,2.8l-0.7,5.7l2.8,4.3l-0.7,2.8l-4.3,2.8l-2.1,3.6l-2.8,0.7l-2.1,2.8l-1.4,5l-4.3,2.8l-2.1-0.7l-0.7-2.1l-2.1-0.7l-2.1-2.8l-3.6,0.7l-0.7-2.1l-2.8-0.7l-2.8,0.7l-1.4-2.1l-2.8,0.7l-3.6-2.1l-0.7-3.6l1.4-2.8l-0.7-2.1l-2.8-1.4l-2.1-2.8l0.7-2.8l2.8-2.1l0.7-4.3l2.8-2.1l5-0.7l0.7-2.1l4.3-2.1l2.1-2.8l4.3-1.4l2.8-2.8l2.1-0.7l2.1,0.7l1.4,2.8l2.1,0.7l0.7,2.1l2.8,0.7l2.8-0.7l2.1,1.4l3.6-0.7l2.8,2.1l1.4,3.6l3.6,1.4L266.2,70.2z" },
    { id: "Umbria", name: "Umbria", d: "M296.7,275.2l-2.1,1.4l-1.4,4.3l-5,0.7l-2.8,2.8l-0.7,5.7l2.8,4.3l-0.7,2.8l-4.3,2.8l-2.1,3.6l-2.8,0.7l-2.1,2.8l-1.4,5l-4.3,2.8l-2.1-0.7l-0.7-2.1l-2.1-0.7l-2.1-2.8l-3.6,0.7l-0.7-2.1l-2.8-0.7l-2.8,0.7l-1.4-2.1l-2.8,0.7l-3.6-2.1l-0.7-3.6l1.4-2.8l-0.7-2.1l-2.8-1.4l-2.1-2.8l0.7-2.8l2.8-2.1l0.7-4.3l2.8-2.1l5-0.7l0.7-2.1l4.3-2.1l2.1-2.8l4.3-1.4l2.8-2.8l2.1-0.7l2.1,0.7l1.4,2.8l2.1,0.7l0.7,2.1l2.8,0.7l2.8-0.7l2.1,1.4l3.6-0.7l2.8,2.1l1.4,3.6l3.6,1.4L296.7,275.2z" },
    { id: "Valle d'Aosta", name: "Valle d'Aosta", d: "M94.8,91.5l-2.1,1.4l-1.4,4.3l-5,0.7l-2.8,2.8l-0.7,5.7l2.8,4.3l-0.7,2.8l-4.3,2.8l-2.1,3.6l-2.8,0.7l-2.1,2.8l-1.4,5l-4.3,2.8l-2.1-0.7l-0.7-2.1l-2.1-0.7l-2.1-2.8l-3.6,0.7l-0.7-2.1l-2.8-0.7l-2.8,0.7l-1.4-2.1l-2.8,0.7l-3.6-2.1l-0.7-3.6l1.4-2.8l-0.7-2.1l-2.8-1.4l-2.1-2.8l0.7-2.8l2.8-2.1l0.7-4.3l2.8-2.1l5-0.7l0.7-2.1l4.3-2.1l2.1-2.8l4.3-1.4l2.8-2.8l2.1-0.7l2.1,0.7l1.4,2.8l2.1,0.7l0.7,2.1l2.8,0.7l2.8-0.7l2.1,1.4l3.6-0.7l2.8,2.1l1.4,3.6l3.6,1.4L94.8,91.5z" },
    { id: "Veneto", name: "Veneto", d: "M287.6,144.7l-2.1,1.4l-1.4,4.3l-5,0.7l-2.8,2.8l-0.7,5.7l2.8,4.3l-0.7,2.8l-4.3,2.8l-2.1,3.6l-2.8,0.7l-2.1,2.8l-1.4,5l-4.3,2.8l-2.1-0.7l-0.7-2.1l-2.1-0.7l-2.1-2.8l-3.6,0.7l-0.7-2.1l-2.8-0.7l-2.8,0.7l-1.4-2.1l-2.8,0.7l-3.6-2.1l-0.7-3.6l1.4-2.8l-0.7-2.1l-2.8-1.4l-2.1-2.8l0.7-2.8l2.8-2.1l0.7-4.3l2.8-2.1l5-0.7l0.7-2.1l4.3-2.1l2.1-2.8l4.3-1.4l2.8-2.8l2.1-0.7l2.1,0.7l1.4,2.8l2.1,0.7l0.7,2.1l2.8,0.7l2.8-0.7l2.1,1.4l3.6-0.7l2.8,2.1l1.4,3.6l3.6,1.4L287.6,144.7z" }
];

const FULL_VIEWBOX = "0 0 600 700";

type Metric = 'listings' | 'share' | 'numericDistribution';

const ItalyMapChart: FC<ItalyMapChartProps> = ({ allData, filteredData, filters, timeSelection, onRegionFilter, onCityFilter, activeRegion, activeCity }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [viewBox, setViewBox] = useState(FULL_VIEWBOX);
    const [metric, setMetric] = useState<Metric>('numericDistribution');

    const { dataByRegion, maxListings, maxShare } = useMemo(() => {
        const dataByRegion: Record<string, { listings: number; share: number; numericDistribution: number }> = {};

        const sourceDataForListings = (filters.brand || filters.brandOwner || filters.regione || filters.citta || filters.categoriaProdotto) ? filteredData : allData;

        const totalListingsInFilterContext = filteredData.length > 0 ? filteredData.length : 1;

        regions.forEach(r => {
            const regionListings = sourceDataForListings.filter(item => item.regione === r.id);
            const filteredRegionListings = filteredData.filter(item => item.regione === r.id);

            // Calculate Numeric Distribution
            // 1. Total venues in this region (from allData, to get the universe of venues)
            const allVenuesInRegion = new Set(allData.filter(i => i.regione === r.id).map(i => `${i.insegna}|${i.citta}`));
            const totalVenuesCount = allVenuesInRegion.size;

            // 2. Venues selling the selected Brand Owner's products (from filteredData)
            const ownerVenuesInRegion = new Set(filteredData.filter(i => i.regione === r.id).map(i => `${i.insegna}|${i.citta}`));
            const ownerVenuesCount = ownerVenuesInRegion.size;

            const numericDist = totalVenuesCount > 0 ? (ownerVenuesCount / totalVenuesCount) * 100 : 0;

            dataByRegion[r.id] = {
                listings: regionListings.length,
                share: (filteredRegionListings.length / totalListingsInFilterContext) * 100,
                numericDistribution: numericDist
            };
        });

        const maxListings = Math.max(...Object.values(dataByRegion).map(d => d.listings), 1);
        const maxShare = Math.max(...Object.values(dataByRegion).map(d => d.share), 1);

        return { dataByRegion, maxListings, maxShare };
    }, [allData, filteredData, filters]);

    const handleRegionClick = (regionId: string) => {
        const newActiveRegion = activeRegion === regionId ? null : regionId;
        onRegionFilter(newActiveRegion);
        // Zooming disabled for now as we don't have individual viewboxes for the new paths
        setViewBox(FULL_VIEWBOX);
    };

    const handleCityClick = (e: ReactMouseEvent, city: string) => {
        e.stopPropagation();
        onCityFilter(activeCity === city ? null : city);
    };

    const handleReset = () => {
        onRegionFilter(null);
        onCityFilter(null);
        setViewBox(FULL_VIEWBOX);
    };

    const getColor = (value: number, maxValue: number, type: 'stroke' | 'fill' = 'stroke') => {
        if (value === 0) {
            return type === 'stroke' ? '#374151' : '#1f2937'; // gray-700 stroke, gray-800 fill
        }

        const effectiveMax = metric === 'numericDistribution' ? 100 : maxValue;
        const intensity = Math.max(0, Math.min(1, value / effectiveMax)); // Clamp between 0 and 1

        // Use a Teal gradient: Dark Teal -> Bright Teal
        // Hue: 170 (Teal)
        // Saturation: 70% - 100%
        // Lightness: 20% - 60%

        const h = 170;
        const s = 50 + intensity * 50;
        const l = 20 + intensity * 40;

        return `hsl(${h}, ${s}%, ${l}%)`;
    };

    const maxValue = metric === 'listings' ? maxListings : (metric === 'share' ? maxShare : 100);
    const subtitle = timeSelection.mode !== 'none' ? `Data for ${formatPeriod(timeSelection.periodA, timeSelection.mode)}` : undefined;

    return (
        <ChartContainer title="Geographic Distribution" subtitle={subtitle} isEmpty={false}>
            <div className="absolute top-4 right-6 flex items-center gap-4 z-10">
                <div className="flex items-center gap-2 p-1 bg-gray-900/50 rounded-lg">
                    <button onClick={() => setMetric('numericDistribution')} className={`px-3 py-1 text-xs rounded-md ${metric === 'numericDistribution' ? 'bg-teal-500 text-white' : 'text-gray-300'}`}>Numeric Dist.</button>
                    <button onClick={() => setMetric('listings')} className={`px-3 py-1 text-xs rounded-md ${metric === 'listings' ? 'bg-teal-500 text-white' : 'text-gray-300'}`}>Listings</button>
                    <button onClick={() => setMetric('share')} className={`px-3 py-1 text-xs rounded-md ${metric === 'share' ? 'bg-teal-500 text-white' : 'text-gray-300'}`}>Share</button>
                </div>
                {activeRegion && (
                    <button onClick={handleReset} className="px-3 py-1 text-xs rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors">
                        Reset View
                    </button>
                )}
            </div>
            <div className="w-full h-full" aria-label="Map of Italy showing data distribution by region">
                <svg
                    ref={svgRef}
                    preserveAspectRatio="xMidYMid meet"
                    viewBox={viewBox}
                    className="w-full h-full transition-all duration-500 ease-in-out"
                >
                    <defs>
                        <filter id="neon-glow" x="-100%" y="-100%" width="300%" height="300%">
                            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <g>
                        {regions.map((region) => {
                            const regionData = dataByRegion[region.id];
                            const value = regionData ? (metric === 'listings' ? regionData.listings : (metric === 'share' ? regionData.share : regionData.numericDistribution)) : 0;
                            const isSelected = activeRegion === region.id;
                            const hasActiveRegion = !!activeRegion;
                            const strokeColor = getColor(value, maxValue, 'stroke');

                            return (
                                <g
                                    key={region.id}
                                    onClick={() => handleRegionClick(region.id)}
                                    className="cursor-pointer group"
                                >
                                    <path
                                        d={region.d}
                                        fill={getColor(value, maxValue, 'fill')}
                                        stroke={isSelected ? '#ffffff' : '#1f2937'} // white if selected, gray-800 if not
                                        strokeWidth={isSelected ? 2 : 1}
                                        className="transition-all duration-300 hover:brightness-110"
                                        style={{
                                            opacity: (hasActiveRegion && !isSelected) ? 0.3 : 1
                                        }}
                                    >
                                        <title>{region.name}: {metric === 'listings' ? formatNumber(value, 0) : value.toFixed(1)}{metric === 'listings' ? ' listings' : '%'}</title>
                                    </path>
                                </g>
                            );
                        })}
                    </g>

                    {activeRegion && CITY_COORDS[activeRegion]?.map(city => (
                        <g key={city.name} className="cursor-pointer group" onClick={(e) => handleCityClick(e, city.name)}>
                            <circle
                                cx={city.coords.x}
                                cy={city.coords.y}
                                r={activeCity === city.name ? 1.5 : 1}
                                className="fill-amber-300 group-hover:fill-amber-200 transition-all"
                                style={{ filter: 'url(#neon-glow)' }}
                                strokeWidth="0.3"
                            />
                            <text
                                x={city.coords.x}
                                y={city.coords.y - 1.5}
                                className="text-[1px] font-semibold fill-white"
                                textAnchor="middle"
                                style={{ textShadow: '0 0 3px black, 0 0 3px black' }}
                            >
                                {city.name}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>
            <div className="absolute bottom-4 left-6 bg-gray-900/50 p-2 rounded-lg text-xs text-gray-300">
                <div className="flex items-center gap-2">
                    <span>Dim</span>
                    <div className="w-24 h-3 bg-gradient-to-r from-[hsl(175,90%,59%)] to-[hsl(175,90%,80%)] rounded-sm" />
                    <span>Bright</span>
                </div>
            </div>
        </ChartContainer>
    );
};

export default ItalyMapChart;
