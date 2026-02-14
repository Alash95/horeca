import { useState, useCallback, FC, ReactNode, Fragment } from 'react';
import { getRecipeAnalysis } from '../services/geminiService';
import type { MenuItem } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface RecipeAnalysisProps {
  cocktailName: string;
  data: MenuItem[];
}

const RecipeAnalysis: FC<RecipeAnalysisProps> = ({ cocktailName, data }) => {
  const { t, language } = useLanguage();
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setAnalysis('');
    try {
      const result = await getRecipeAnalysis(cocktailName, data, language);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : (language === 'it' ? 'Si è verificato un errore imprevisto.' : 'An unexpected error occurred.'));
    } finally {
      setIsLoading(false);
    }
  }, [cocktailName, data, language]);

  // A simple formatter for bold text and lists
  const formattedAnalysis = analysis.split('**').map((part, index) => {
    if (index % 2 === 1) { // Bold text
      return <strong key={index} className="text-teal-400">{part}</strong>;
    }
    return part;
  }).reduce((acc: ReactNode[], part, index) => {
    if (typeof part === 'string') {
      const partWithBreaks = part.split('\n').map((line, i) => <Fragment key={i}>{line}{i < part.split('\n').length - 1 && <br />}</Fragment>);
      const listItems = part.split('\n').filter(line => line.trim().match(/^\d+\.\s/)).map((line, i) => (
        <li key={`li-${index}-${i}`} className="ml-4 my-1 list-decimal">{line.trim().substring(line.indexOf(' '))}</li>
      ));

      if (listItems.length > 0) {
        return [...acc, <ul key={`ul-${index}`}>{listItems}</ul>];
      }

      if (part.trim().length > 0) {
        return [...acc, <p key={index}>{partWithBreaks}</p>];
      }
    }
    return [...acc, part];
  }, []);

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-200">{t('aiRecipeAnalysis', { cocktailName })}</h3>
        <button
          onClick={handleGenerateAnalysis}
          disabled={isLoading || !cocktailName}
          className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed text-sm font-medium"
        >
          {isLoading ? t('analyzing') : t('analyzeRecipe')}
        </button>
      </div>
      <div className="flex-grow overflow-y-auto prose prose-invert prose-sm max-w-none prose-p:text-gray-300">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-400"></div>
          </div>
        )}
        {error && <p className="text-red-400">Error: {error}</p>}
        {!isLoading && !analysis && !error && (
          <div className="flex items-center justify-center h-full text-center text-gray-500">
            <p>{t('recipeAnalysisPlaceholder')}</p>
          </div>
        )}
        {analysis && <div className="space-y-2 whitespace-pre-wrap">{formattedAnalysis}</div>}
      </div>
    </div>
  );
};

export default RecipeAnalysis;
