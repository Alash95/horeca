
import { GoogleGenAI } from "@google/genai";
import type { MenuItem } from "../types";

// Per guidelines, API key is assumed to be in process.env.API_KEY or NEXT_PUBLIC_GEMINI_API_KEY
// The SDK will handle the case where the key is missing.

const getAIClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured. Please check your .env.local file and ensure VITE_GEMINI_API_KEY is set.");
  }
  return new GoogleGenAI({ apiKey });
};

export const getDashboardInsights = async (filteredData: MenuItem[], allContextData: MenuItem[]): Promise<string> => {
  if (filteredData.length === 0) {
    return Promise.resolve("Nessun dato disponibile per l'analisi. Regola i filtri.");
  }

  const ai = getAIClient();

  // For competitive intelligence, we need to know what else is in the market
  // We take a sample of the overall data to provide context even if filters are applied
  const contextSample = allContextData.slice(0, 150);
  const selectionSample = filteredData.slice(0, 100);

  const prompt = `
    In qualità di senior market analyst per l'industria del beverage, analizza i seguenti dati JSON provenienti dai menu dei locali italiani.
    Fornisci un report strategico professionale. Usa un tono diretto e orientato all'azione.
    
    Struttura la risposta esattamente in queste 7 sezioni, utilizzando i marcatori [SECTION_X] per il parsing:

    [SECTION_1] Executive Snapshot: 
    3 blocchi coincisi. "BOX: Categoria | Sintesi | Dato". Focus sul Market Sentiment (Semaforo: 🟢/🟡/🔴).

    [SECTION_2] Market Map (Dove competere): 
    Tabella Markdown: Area, Categoria, Presenza Brand, Intensità, Opportunità (Verde/Giallo/Rosso).

    [SECTION_3] Top Insights (Specifici per Località): 
    Massimo 3 per le città principali. Formato: "Città: Insight → Impatto: Valore di Business".

    [SECTION_4] Griglia SWOT Analysis: 
    Strutturata per una griglia 2x2. 
    Formato: "STRENGTH: Descrizione", "WEAKNESS: Descrizione", "OPPORTUNITY: Descrizione", "THREAT: Descrizione".

    [SECTION_5] Action Plan (Priorità): 
    Tabella Markdown: Priorità, Canale, Azione, Perché. Focus elevato sul ROI.

    [SECTION_6] Competitive Intelligence: 
    Solo punti elenco. Analizza il posizionamento dei competitor rispetto alla selezione corrente. Evidenzia spazi vuoti (whitespace) e mosse della concorrenza.

    [SECTION_7] Affidabilità dei Dati: 
    Metrica: % Copertura, Confidence (0-100), Suggerimento per prossima analisi.

    Regola Oro: Se non è azionabile, non scriverlo. Sii brutale nella sintesi. Usa sempre l'italiano.

    DATI SELEZIONATI (Filtri applicati):
    \`\`\`json
    ${JSON.stringify(selectionSample, null, 2)}
    \`\`\`

    CONTESTO DI MERCATO (Dati generali per analisi concorrenza):
    \`\`\`json
    ${JSON.stringify(contextSample, null, 2)}
    \`\`\`
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", // Reverting to stable flash model if 2.5 is not confirmed, or keeping if standard
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error fetching insights from Gemini:", error);
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return "Errore: La chiave API Gemini non è configurata o è non valida. Verifica le variabili d'ambiente.";
      }
      return `Si è verificato un errore durante la generazione degli insight: ${error.message}`;
    }
    return "Si è verificato un errore sconosciuto durante la generazione degli insight.";
  }
};

export const getAnswerForQuestion = async (question: string, filteredData: MenuItem[], allContextData: MenuItem[]): Promise<string> => {
  if (filteredData.length === 0) {
    return Promise.resolve("Nessun dato disponibile per rispondere a questa domanda.");
  }

  const ai = getAIClient();
  const contextSample = allContextData.slice(0, 150);
  const selectionSample = filteredData.slice(0, 100);

  const prompt = `
    In qualità di senior market analyst per l'industria del beverage, rispondi alla seguente domanda strategica basandoti sui dati forniti.
    
    DOMANDA: "${question}"

    Fornisci una risposta analitica, basata sui dati e orientata all'azione. Usa l'italiano.
    Se la domanda riguarda i competitor, usa il "CONTESTO DI MERCATO" per il confronto.
    Se riguarda locali specifici, evidenzia i nomi (Insegna).

    DATI SELEZIONATI (Filtri applicati):
    \`\`\`json
    ${JSON.stringify(selectionSample, null, 2)}
    \`\`\`

    CONTESTO DI MERCATO (Dati generali per confronto):
    \`\`\`json
    ${JSON.stringify(contextSample, null, 2)}
    \`\`\`
    
    Rispondi in formato Markdown, usando grassetti per i punti chiave e tabelle se necessario.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        temperature: 0.2,
      },
    });

    return response.text;
  } catch (error) {
    console.error(`Error fetching answer for question "${question}":`, error);
    return "Si è verificato un errore durante la generazione della risposta.";
  }
};

// FIX: Add missing getRecipeAnalysis function to resolve import error.
export const getRecipeAnalysis = async (cocktailName: string, data: MenuItem[]): Promise<string> => {
  if (data.length === 0) {
    return Promise.resolve(`No data available for ${cocktailName} to analyze.`);
  }

  const prompt = `
    As a beverage industry analyst, analyze the following menu data for the cocktail "${cocktailName}".
    Focus on brand usage and pricing strategy.

    1.  **Brand Dominance:** Which brand is most frequently used for this cocktail? Calculate its "share of recipe" as a percentage of all listings for this cocktail.
    2.  **Competitor Landscape:** List the other brands used for this cocktail and their respective shares.
    3.  **Pricing Analysis:** What is the average price of a "${cocktailName}" using the dominant brand versus other brands? Is there a premium or discount associated with the main brand?
    4.  **Strategic Insight:** Based on the data, what is a key strategic insight for a brand manager of a competing spirit? For example, is there an opportunity to target a different price point or venue type?

    Here is the data for "${cocktailName}":
    \`\`\`json
    ${JSON.stringify(data, null, 2)}
    \`\`\`
  `;

  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    return response.text;
  } catch (error) {
    console.error(`Error fetching recipe analysis for ${cocktailName} from Gemini:`, error);
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return "Error: Gemini API key is not configured or invalid. Please check your environment variables.";
      }
      return `An error occurred while generating analysis: ${error.message}`;
    }
    return "An unknown error occurred while generating analysis.";
  }
};

// FIX: Add missing generateImage function to resolve import error.
export const generateImage = async (prompt: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    if (response.generatedImages?.[0]?.image?.imageBytes) {
      return response.generatedImages[0].image.imageBytes;
    }

    throw new Error('No image was generated or returned from the API.');
  } catch (error) {
    console.error('Error generating image from Gemini:', error);
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error(
          'Error: Gemini API key is not configured or invalid. Please check your environment variables.',
        );
      }
      throw new Error(`An error occurred while generating the image: ${error.message}`);
    }
    throw new Error('An unknown error occurred while generating the image.');
  }
};
