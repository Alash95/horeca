import { useState, useEffect, useCallback, FC } from 'react';
import { generateImage } from '../services/geminiService';

interface ImageGeneratorProps {
    selectedBrand: string | null;
    selectedCategory: string | null;
}

const ImageGenerator: FC<ImageGeneratorProps> = ({ selectedBrand, selectedCategory }) => {
    const [prompt, setPrompt] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const defaultPrompt = `A photorealistic lifestyle advertisement for ${selectedBrand || 'a popular drink brand'}, a premium ${selectedCategory || 'beverage'}. The image should feature a sophisticated bar setting with elegant lighting. Show people enjoying the drink. Minimalist branding.`;
        setPrompt(defaultPrompt);
    }, [selectedBrand, selectedCategory]);

    const handleGenerate = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setImageUrl(null);
        try {
            const base64Data = await generateImage(prompt);
            setImageUrl(`data:image/jpeg;base64,${base64Data}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [prompt]);

    return (
        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Creative Asset Generator</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-400 mb-1">Prompt</label>
                    <textarea
                        id="prompt"
                        rows={6}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm p-2 text-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                        placeholder="Describe the image you want to generate..."
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !prompt}
                        className="mt-4 w-full px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-800 text-sm font-medium"
                    >
                        {isLoading ? 'Generating...' : 'Generate Image'}
                    </button>
                </div>
                <div className="flex items-center justify-center bg-gray-900/50 rounded-lg min-h-[300px] aspect-square">
                    {isLoading && (
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
                    )}
                    {error && <p className="text-red-400 p-4 text-center">Error: {error}</p>}
                    {!isLoading && !error && imageUrl && (
                        <div className="relative group w-full h-full flex items-center justify-center">
                            <img src={imageUrl} alt="Generated asset" className="rounded-lg object-contain max-h-full max-w-full" />
                            <a
                                href={imageUrl}
                                download="generated-asset.jpg"
                                className="absolute bottom-2 right-2 bg-gray-900/80 text-white px-3 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                Download
                            </a>
                        </div>
                    )}
                    {!isLoading && !error && !imageUrl && (
                        <div className="text-center text-gray-500 p-4">
                            <p>Describe an image and click "Generate Image" to create a new creative asset.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageGenerator;
