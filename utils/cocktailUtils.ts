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

export const isStrictCocktail = (item: any): boolean => {
    const category = (item.categoriaProdotto || '').toLowerCase();
    const macro = (item.macroCategoria || '').toLowerCase();
    const catName = (item.categoryName || '').toLowerCase();
    const subCat = (item.subCategory || '').toLowerCase();

    // User Requirement: "only item name... with a category name with any thing labeled with or that has a LIKE cocktail"
    const isCocktailCategory =
        category.includes('cocktail') ||
        macro.includes('cocktail') ||
        catName.includes('cocktail') ||
        subCat.includes('cocktail');

    // Hardened Exclusion: Ensure it's not Wine/Beer even if it mentions cocktail
    const isExcludedMacro = macro.includes('wine') || macro.includes('vine') || macro.includes('beer') || macro.includes('birra');

    return isCocktailCategory && !isExcludedMacro;
};
