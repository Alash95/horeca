export interface MenuItem {
  // 📸 Exact Headers from Supabase Screenshot (Mixed English/Italian)
  "Menu ID"?: string;
  NomeLocale?: string;
  TipologiaLocale?: string;
  Città?: string;
  venue_address?: string;
  venue_city?: string;
  venue_country?: string;
  venue_state?: string;
  venue_rating?: number;
  Sezione_drink_list?: string;
  "Category Name"?: string;
  Item_Name?: string;
  Description?: string;
  Price?: number;
  ingredients_brand_owner?: string;
  ingredients_brand?: string;
  Broad_category?: string;
  ingredients_categoria?: string;
  Sub_Category?: string;
  Ranking_Top4?: string;
  Date?: string;
  "Item Date"?: string;
  RegionMatch?: string;

  // 🌉 Legacy Bridge Fields (Mapped for Dashboard Logic)
  insegna?: string;
  via?: string;
  citta?: string;
  regione?: string;
  tipologiaCliente?: string;
  brandOwner?: string;
  brand?: string;
  macroCategoria?: string;
  categoriaProdotto?: string;
  nomeCocktail?: string;
  categoryName?: string;
  subCategory?: string;
  prezzo?: number;
  data?: string;
  venueId?: string;
}

export interface ProductMasterItem {
  brand: string;
  brandOwner: string;
  macroCategoria: "Spirits" | "Wine" | "Champagne" | "Beer" | "Soft Drink";
  categoriaProdotto: string;
  aliases?: string[];
}

export interface Filters {
  regione: string[];
  citta: string[];
  tipologiaCliente: string[];
  brandOwner: string[];
  brand: string[];
  macroCategoria: string[];
  categoriaProdotto: string[];
  cocktail: string[];
  insegna: string[];
  venueId: string[];
}

export interface ChartDataItem {
  name: string;
  value: number;
  // For comparison charts
  primary?: number;
  comparison?: number;
  [key: string]: any;
}


export interface MarketUniverseItem {
  regione: string;
  citta: string;
  tipologia_cliente: string;
  venue_count: number;
}

export interface MarketBenchmarkItem {
  macro_categoria: string;
  categoria_prodotto: string;
  listing_count: number;
  venue_count: number;
}

export interface TimeSelection {
  mode: 'none' | 'YoY' | 'QoQ';
  periodA: { year: number; quarter?: number };
  periodB: { year: number; quarter?: number };
}