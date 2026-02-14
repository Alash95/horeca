
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

export const getDashboardInsights = async (filteredData: MenuItem[], allContextData: MenuItem[], language: 'en' | 'it' = 'it'): Promise<string> => {
  if (filteredData.length === 0) {
    return Promise.resolve(language === 'it' ? "Nessun dato disponibile per l'analisi. Regola i filtri." : "No data available for analysis. Adjust filters.");
  }

  const ai = getAIClient();

  // For competitive intelligence, we need to know what else is in the market
  // We take a sample of the overall data to provide context even if filters are applied
  const contextSample = allContextData.slice(0, 150);
  const selectionSample = filteredData.slice(0, 100);

  const prompt = `
    As a senior market analyst for the beverage industry, analyze the following menu data from Italian venues.
    
    DATA SCHEMA NOTE: 
    The data provided is a JSON list of products found on menus. Each object contains:
    - "insegna": The name of the venue (bar/restaurant/hotel).
    - "brandOwner": The company owning the spirit/beverage brand.
    - "brand": The specific brand name.
    - "nomeCocktail": The name of the cocktail or item as listed on the menu.
    - "citta": The city where the venue is located.
    - "regione": The Italian region.
    - "prezzo": The price in Euros.
    - "macroCategoria": Category (e.g., Spirits, Wine, Beer).
    - "tipologiaCliente": Venue type.

    Provide a professional strategic report. Use a direct and action-oriented tone.
    
    Structure the response exactly into these 7 sections, using [SECTION_X] markers for parsing:

    [SECTION_1] Executive Snapshot: 
    3 concise blocks. "BOX: Category | Summary | Data". 
    CRITICAL: You MUST include exactly one connectivity line with a traffic light emoji indicating Market Sentiment:
    "Traffic Light: 🟢 (Positive) | 🟡 (Neutral) | 🔴 (Negative)"

    [SECTION_2] Market Map (Where to compete): 
    Markdown Table: Area, Category, Brand Presence, Intensity, Opportunity (Green/Yellow/Red).

    [SECTION_3] Top Insights (Location Specific): 
    Maximum 3 for major cities. Format: "City: Insight → Impact: Business Value".

    [SECTION_4] SWOT Analysis Grid: 
    Structured for a 2x2 grid. 
    Format: "STRENGTH: Description", "WEAKNESS: Description", "OPPORTUNITY: Description", "THREAT: Description".

    [SECTION_5] Action Plan (Priorities): 
    Markdown Table: Priority, Channel, Action, Why. High focus on ROI.

    [SECTION_6] Competitive Intelligence: 
    Bullet points only. Analyze competitor positioning relative to current selection. Highlight empty spaces (white spots) and competitor moves.

    [SECTION_7] Data Reliability: 
    Metric: % Coverage, Confidence (0-100), Suggestion for next analysis.

    Golden Rule: If it's not actionable, don't write it. Be brutal in summary. 
    
    CRITICAL: YOU MUST RESPOND ENTIRELY IN ${language === 'it' ? 'ITALIAN' : 'ENGLISH'}.

    SELECTED DATA (Applied Filters):
    \`\`\`json
    ${JSON.stringify(selectionSample, null, 2)}
    \`\`\`

    MARKET CONTEXT (General data for competitor analysis):
    \`\`\`json
    ${JSON.stringify(contextSample, null, 2)}
    \`\`\`
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
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
        return language === 'it' ? "Errore: La chiave API Gemini non è configurata o è non valida. Verifica le variabili d'ambiente." : "Error: Gemini API key is not configured or invalid. Check environment variables.";
      }
      return language === 'it' ? `Si è verificato un errore durante la generazione degli insight: ${error.message}` : `An error occurred during insight generation: ${error.message}`;
    }
    return language === 'it' ? "Si è verificato un errore sconosciuto durante la generazione degli insight." : "An unknown error occurred during insight generation.";
  }
};

export const getAnswerForQuestion = async (question: string, filteredData: MenuItem[], allContextData: MenuItem[], language: 'en' | 'it' = 'it'): Promise<string> => {
  if (filteredData.length === 0) {
    return Promise.resolve(language === 'it' ? "Nessun dato disponibile per rispondere a questa domanda." : "No data available to answer this question.");
  }

  const ai = getAIClient();
  const contextSample = allContextData.slice(0, 150);
  const selectionSample = filteredData.slice(0, 100);

  const prompt = `
    As a senior market analyst for the beverage industry, answer the following strategic question based on the provided data.
    
    DATA SCHEMA NOTE: 
    The data provided is a JSON list of products found on menus. Each object contains:
    - "insegna": The name of the venue (bar/restaurant/hotel).
    - "brandOwner": The company owning the spirit/beverage brand.
    - "brand": The specific brand name.
    - "nomeCocktail": The name of the cocktail or item as listed on the menu.
    - "citta": The city where the venue is located.
    - "regione": The Italian region.
    - "prezzo": The price in Euros.
    - "macroCategoria": Category (e.g., Spirits, Wine, Beer).
    - "tipologiaCliente": Venue type.

    QUESTION: "${question}"

    Provide an analytical, data-driven, and action-oriented response. 
    Use the "MARKET CONTEXT" for comparison if the question is about competitors.
    If it concerns specific venues, highlight the names (insegna).

    STRUCTURE YOUR RESPONSE EXACTLY AS FOLLOWS (Markdown):

    ### ⚡ Direct Answer
    (A concise 2-sentence direct answer to the question).

    ### 📊 Key Findings
    (Bulleted list of data points supporting the answer. Cite specific numbers from the data).
    *   **Finding 1:** ...
    *   **Finding 2:** ...

    ### 🚀 Strategic Recommendation
    (Specific action the user should take based on this finding).

    CRITICAL: YOU MUST RESPOND ENTIRELY IN ${language === 'it' ? 'ITALIAN' : 'ENGLISH'}.

    SELECTED DATA (Applied Filters):
    \`\`\`json
    ${JSON.stringify(selectionSample, null, 2)}
    \`\`\`

    MARKET CONTEXT (General data for comparison):
    \`\`\`json
    ${JSON.stringify(contextSample, null, 2)}
    \`\`\`
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
    return language === 'it' ? "Si è verificato un errore durante la generazione della risposta." : "An error occurred during response generation.";
  }
};

// FIX: Add missing getRecipeAnalysis function to resolve import error.
export const getRecipeAnalysis = async (cocktailName: string, data: MenuItem[], language: 'en' | 'it' = 'it'): Promise<string> => {
  if (data.length === 0) {
    return Promise.resolve(language === 'it' ? `Nessun dato disponibile per analizzare ${cocktailName}.` : `No data available for ${cocktailName} to analyze.`);
  }

  const prompt = `
    As a beverage industry analyst, analyze the following menu data for the cocktail "${cocktailName}".
    Focus on brand usage and pricing strategy.

    DATA SCHEMA NOTE: 
    The data provided is a JSON list of products found on menus. Each object contains:
    - "insegna": The name of the venue (bar/restaurant/hotel).
    - "brandOwner": The company owning the spirit/beverage brand.
    - "brand": The specific brand name.
    - "nomeCocktail": The name of the cocktail or item as listed on the menu.
    - "prezzo": The price in Euros.
    - "macroCategoria": Category (e.g., Spirits, Wine, Beer).

    1.  **Brand Dominance:** Which brand is most frequently used for this cocktail? Calculate its "share of recipe" as a percentage of all listings for this cocktail.
    2.  **Competitor Landscape:** List the other brands used for this cocktail and their respective shares.
    3.  **Pricing Analysis:** What is the average price of a "${cocktailName}" using the dominant brand versus other brands? Is there a premium or discount associated with the main brand?
    4.  **Strategic Insight:** Based on the data, what is a key strategic insight for a brand manager of a competing spirit? For example, is there an opportunity to target a different price point or venue type?

    CRITICAL: YOU MUST RESPOND ENTIRELY IN ${language === 'it' ? 'ITALIAN' : 'ENGLISH'}.

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
