export const isCocktailMatch = (itemCocktail: string | undefined, targetCocktail: string): boolean => {
    if (!itemCocktail) return false;
    const lowerItem = itemCocktail.toLowerCase();
    const lowerTarget = targetCocktail.toLowerCase();

    if (lowerItem === lowerTarget) return true;

    // Specific fix for Gin&Tonic variations
    if (targetCocktail === 'Gin&Tonic') {
        return (lowerItem.includes('gin') && lowerItem.includes('tonic')) || lowerItem.includes(' gt');
    }

    // Normalization should handle others (Negroni etc), but we can add more heuristics here if needed
    // e.g. for "Martini Dry" vs "Cocktail Martini"
    if (targetCocktail === 'Cocktail Martini') {
        return lowerItem.includes('martini') && (lowerItem.includes('dry') || lowerItem.includes('white'));
    }

    return false;
};

export const TARGET_COCKTAILS = [
    'Paloma',
    'Negroni',
    'Americano',
    'Spritz',
    'Boulevardier',
    'Gin&Tonic',
    'Cocktail Martini'
];
