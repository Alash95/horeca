import { useState, useEffect, useCallback, FC } from 'react';
import type { MenuItem, Filters, TimeSelection } from '../../types';
import { getDashboardInsights, getAnswerForQuestion } from '../../services/geminiService';
import { useLanguage } from '../../context/LanguageContext';

interface InsightsSheetProps {
    primaryPeriodData: MenuItem[];
    allData: MenuItem[]; // Context for competitor analysis
    filters: Filters;
    timeSelection: TimeSelection;
}

const InsightsSheet: FC<InsightsSheetProps> = ({ primaryPeriodData, allData, filters, timeSelection }) => {
    const { language, t } = useLanguage();
    const [insights, setInsights] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Smart Questions state
    const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
    const [questionAnswer, setQuestionAnswer] = useState<string | null>(null);
    const [isQuestionLoading, setIsQuestionLoading] = useState(false);

    const fetchInsights = useCallback(async () => {
        if (primaryPeriodData.length === 0) {
            setInsights(t('noDataAvailable'));
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const result = await getDashboardInsights(primaryPeriodData, allData, language);
            setInsights(result);
        } catch (err) {
            console.error("Error fetching insights:", err);
            setError(language === 'it' ? "Generazione approfondimenti fallita. Verifica la connessione." : "Insight generation failed. Please check your connection.");
        } finally {
            setIsLoading(false);
        }
    }, [primaryPeriodData, language, t]);

    useEffect(() => {
        fetchInsights();
    }, [fetchInsights]);

    const handleSmartQuestion = async (question: string) => {
        setActiveQuestion(question);
        setIsQuestionLoading(true);
        setQuestionAnswer(null);
        try {
            const answer = await getAnswerForQuestion(question, primaryPeriodData, allData, language);
            setQuestionAnswer(answer);
        } catch (err) {
            console.error("Error asking smart question:", err);
            setQuestionAnswer(language === 'it' ? "Scusa, non siamo riusciti a generare una risposta." : "Sorry, we couldn't generate an answer to this question.");
        } finally {
            setIsQuestionLoading(false);
        }
    };

    const smartQuestions = [
        t('q1'),
        t('q2'),
        t('q3'),
        t('q4'),
        t('q5')
    ];

    const [activeTab, setActiveTab] = useState<'snapshot' | 'intel' | 'plan'>('snapshot');

    const parseSections = (text: string) => {
        const result: Record<string, string[]> = {};
        for (let i = 1; i <= 7; i++) {
            const regex = new RegExp(`\\[SECTION_${i}\\](.*?)(?=\\[SECTION_${i + 1}\\]|$)`, 's');
            const match = text.match(regex);
            if (match) {
                result[`section_${i}`] = match[1].trim().split('\n').filter(l => l.trim());
            }
        }
        return result;
    };

    const renderSnapshot = (sections: Record<string, string[]>) => {
        const execLines = sections['section_1'] || [];
        const qualityLines = sections['section_7'] || [];

        // Extract "Traffic Light" icon
        const trafficLightLine = execLines.find(l => l.includes('🟢') || l.includes('🟡') || l.includes('🔴'));
        const trafficLightIcon = trafficLightLine ? (trafficLightLine.match(/🟢|🟡|🔴/)?.[0] || '✨') : '✨';

        return (
            <div className="space-y-8">
                {/* Market Weather Header */}
                <div className="flex items-center gap-6 bg-gray-700/20 p-6 rounded-2xl border border-gray-600/30">
                    <div className="text-5xl">{trafficLightIcon}</div>
                    <div>
                        <div className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-1">{t('marketSentiment')}</div>
                        <div className="text-xl text-white font-semibold">
                            {trafficLightLine?.replace(trafficLightIcon, '').replace(/.*Traffic Light:\s*/, '').replace(/.*Semaforo:\s*/, '').trim() || t('noSentimentData')}
                        </div>
                    </div>
                </div>

                {/* Info Boxes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {execLines.filter(l => l.includes('BOX:')).map((box, bIdx) => {
                        const parts = box.replace(/^[-\*\s]*BOX:\s*/, '').split('|').map(p => p.trim());
                        const [title, phrase, data] = parts;
                        return (
                            <div key={bIdx} className="bg-gray-800/40 p-5 rounded-2xl border border-gray-700/50 shadow-lg">
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">{title}</div>
                                <div className="text-base text-gray-100 font-medium mb-3 leading-tight">{phrase}</div>
                                <div className="text-xs text-teal-400/80 font-mono bg-teal-400/5 px-2 py-1 rounded inline-block">
                                    {data}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Data Quality Footer */}
                <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-5 flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">{t('reliabilityScore')}</div>
                        <div className="text-sm text-gray-300">{qualityLines.find(l => l.includes('Confidence')) || qualityLines.find(l => l.includes('Fiducia')) || "Confidence: 85%"}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('dataProbeSuggestion')}</div>
                        <div className="text-sm text-gray-400 italic">{qualityLines.find(l => l.includes('Probe'))?.replace(/.*Probe:\s*/, '') || qualityLines.find(l => l.includes('Sondaggio'))?.replace(/.*Sondaggio:\s*/, '') || "N/A"}</div>
                    </div>
                </div>
            </div>
        );
    };

    const renderMarketIntel = (sections: Record<string, string[]>) => {
        const swotLines = sections['section_4'] || [];
        const mapLines = sections['section_2'] || [];
        const compLines = sections['section_6'] || [];

        return (
            <div className="space-y-10">
                {/* Visual SWOT Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { key: 'STRENGTH', label: t('strengths'), color: 'green', icon: '💪' },
                        { key: 'WEAKNESS', label: t('weaknesses'), color: 'red', icon: '⚠️' },
                        { key: 'OPPORTUNITY', label: t('opportunities'), color: 'teal', icon: '🚀' },
                        { key: 'THREAT', label: t('threats'), color: 'orange', icon: '🔥' }
                    ].map(card => (
                        <div key={card.key} className={`bg-gray-800/40 p-5 rounded-2xl border border-${card.color}-500/20 shadow-lg relative overflow-hidden group`}>
                            <div className={`absolute top-0 right-0 p-4 text-3xl opacity-10 group-hover:opacity-30 transition-opacity`}>{card.icon}</div>
                            <div className={`text-xs font-black text-${card.color}-400 uppercase tracking-widest mb-3`}>{card.label}</div>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {swotLines.find(l => l.includes(card.key))?.replace(`${card.key}:`, '').trim() ||
                                    swotLines.find(l => l.includes(t(card.key).toUpperCase()))?.replace(`${t(card.key).toUpperCase()}:`, '').trim() ||
                                    t('noData')}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Market Map Table */}
                <div className="rounded-2xl border border-gray-700/50 bg-gray-900/40 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-700/50 bg-gray-800/50 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {t('competitiveMarketMap')}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-800/20">
                                    {mapLines[0]?.split('|').filter(c => c.trim()).map((h, i) => (
                                        <th key={i} className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{h.trim()}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/40">
                                {mapLines.slice(2).filter(l => l.includes('|')).map((row, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-white/[0.02]">
                                        {row.split('|').filter((_, cIdx, arr) => cIdx > 0 && cIdx < arr.length - 1).map((cell, cIdx) => {
                                            const val = cell.trim();
                                            if (val === 'Verde' || val === 'Green' || val === 'Alto' || val === 'High') return <td key={cIdx} className="px-5 py-4"><span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-[9px] font-bold uppercase border border-green-500/20">High</span></td>;
                                            if (val === 'Giallo' || val === 'Yellow' || val === 'Difesa' || val === 'Defense') return <td key={cIdx} className="px-5 py-4"><span className="px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-[9px] font-bold uppercase border border-yellow-500/20">Defense</span></td>;
                                            if (val === 'Rosso' || val === 'Red' || val === 'Pieno' || val === 'Full') return <td key={cIdx} className="px-5 py-4"><span className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-[9px] font-bold uppercase border border-red-500/20">Full</span></td>;
                                            return <td key={cIdx} className="px-5 py-4 text-sm text-gray-300">{val}</td>;
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Competitive Bullets */}
                <div className="bg-gray-800/20 p-6 rounded-2xl border border-gray-700/30">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{t('competitorWhitespaceAlerts')}</h4>
                    <ul className="space-y-3">
                        {compLines.map((line, lIdx) => (
                            <li key={lIdx} className="flex gap-3 text-sm text-gray-400 group">
                                <span className="text-teal-500/40 group-hover:text-teal-500 transition-colors">•</span>
                                {line.replace(/^[-*]\s*/, '')}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    };

    const renderActionPlan = (sections: Record<string, string[]>) => {
        const insightLines = sections['section_3'] || [];
        const actionLines = sections['section_5'] || [];

        return (
            <div className="space-y-10">
                {/* Strategy Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {insightLines.map((line, lIdx) => {
                        const [location, rest] = line.split(':');
                        const [insight, impact] = rest?.split('→') || [rest, ''];
                        return (
                            <div key={lIdx} className="bg-gray-800/40 p-6 rounded-2xl border border-gray-700/50 shadow-xl relative overflow-hidden group hover:border-teal-500/30 transition-all">
                                <div className="absolute left-0 top-0 w-1.5 h-full bg-teal-500/20 group-hover:bg-teal-500 transition-colors"></div>
                                <div className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-1">{location?.trim()}</div>
                                <div className="text-base text-white font-medium mb-4">{insight?.trim()}</div>
                                <div className="flex items-center gap-3">
                                    <span className="bg-teal-500/10 text-teal-400 text-[8px] px-2 py-0.5 rounded font-black tracking-tighter uppercase border border-teal-500/20">{t('businessImpact')}</span>
                                    <span className="text-sm text-gray-400 font-medium italic">{impact?.replace(/Impatto:\s*/, '').replace(/Impact:\s*/, '').trim()}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Priority Table Card */}
                <div className="bg-teal-500/5 p-8 rounded-3xl border border-teal-500/10 shadow-inner">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center text-white text-xl">🎯</div>
                        <div>
                            <h3 className="text-lg font-bold text-white leading-none">{t('operationalPriorities')}</h3>
                            <p className="text-xs text-teal-400 mt-1 uppercase tracking-widest font-bold">{t('actionableRoi')}</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl bg-gray-900/60 p-2">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-800">
                                    {actionLines[0]?.split('|').filter(c => c.trim()).map((h, i) => (
                                        <th key={i} className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">{h.trim()}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {actionLines.slice(2).filter(l => l.includes('|')).map((row, rIdx) => (
                                    <tr key={rIdx} className="border-b border-gray-800/30 last:border-0">
                                        {row.split('|').filter((_, cIdx, arr) => cIdx > 0 && cIdx < arr.length - 1).map((cell, cIdx) => (
                                            <td key={cIdx} className="px-4 py-4 text-sm text-gray-300 font-medium">
                                                {cIdx === 0 ? <span className="bg-gray-700 px-2 py-1 rounded text-[10px] font-mono">{cell.trim()}</span> : cell.trim()}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const parsedSections = insights ? parseSections(insights) : {};

    return (
        <div className="space-y-6 animate-fadeIn pb-20">
            {/* Main Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="relative">
                            <span className="w-10 h-10 bg-teal-500/20 text-teal-400 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-teal-500/10">✨</span>
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-teal-400 rounded-full border-2 border-gray-900 animate-pulse"></span>
                        </div>
                        {t('aiStrategicDashboard')}
                    </h2>
                    <p className="text-sm text-gray-500 mt-2 font-medium">{t('predictiveAnalysis')}</p>
                </div>

                <div className="flex items-center gap-3 bg-gray-800 p-1 rounded-xl border border-gray-700/50">
                    <button
                        onClick={() => setActiveTab('snapshot')}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'snapshot' ? 'bg-teal-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        {t('snapshot')}
                    </button>
                    <button
                        onClick={() => setActiveTab('intel')}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'intel' ? 'bg-teal-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        {t('marketIntel')}
                    </button>
                    <button
                        onClick={() => setActiveTab('plan')}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'plan' ? 'bg-teal-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        {t('actionPlan')}
                    </button>
                    <div className="w-px h-6 bg-gray-700 mx-1"></div>
                    <button
                        onClick={fetchInsights}
                        disabled={isLoading}
                        className="p-2 text-gray-400 hover:text-teal-400 transition-colors disabled:opacity-30"
                        title="Reload analysis"
                    >
                        🔄
                    </button>
                </div>
            </div>

            {/* Smart Questions Section */}
            <div className="bg-gray-800/40 border border-teal-500/20 rounded-3xl p-6 shadow-xl mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl">💡</span>
                    <div>
                        <h3 className="text-lg font-bold text-white">{t('strategicQuestions')}</h3>
                        <p className="text-xs text-teal-400 uppercase tracking-widest font-bold">{t('quickTargetedAnalysis')}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 mb-6">
                    {smartQuestions.map((q, i) => (
                        <button
                            key={i}
                            onClick={() => handleSmartQuestion(q)}
                            disabled={isQuestionLoading}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${activeQuestion === q
                                ? 'bg-teal-500 border-teal-400 text-white shadow-lg'
                                : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-teal-500/50'
                                } disabled:opacity-50`}
                        >
                            {q}
                        </button>
                    ))}
                </div>

                {activeQuestion && (
                    <div className="bg-gray-900/60 rounded-2xl p-6 border border-gray-700/50 animate-fadeIn shadow-2xl">
                        {isQuestionLoading ? (
                            <div className="flex items-center gap-4 py-4">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-400"></div>
                                <span className="text-sm text-gray-400 italic">{t('processing')}</span>
                            </div>
                        ) : questionAnswer ? (
                            <div className="prose prose-invert prose-sm max-w-none">
                                <div className="flex justify-between items-start mb-4 border-b border-gray-700/50 pb-2">
                                    <h4 className="text-teal-400 font-bold m-0 italic flex items-center gap-2">
                                        <span>🤖</span> {t('aiResponse')}
                                    </h4>
                                    <button
                                        onClick={() => { setActiveQuestion(null); setQuestionAnswer(null); }}
                                        className="text-gray-500 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 rounded-full p-1"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="text-gray-200 leading-relaxed space-y-4">
                                    {questionAnswer.split('\n').map((line, idx) => {
                                        // Headers
                                        if (line.trim().startsWith('###')) {
                                            return <h3 key={idx} className="text-lg font-bold text-teal-400 mt-4 mb-2">{line.replace(/^###\s*/, '')}</h3>;
                                        }
                                        if (line.trim().startsWith('##')) {
                                            return <h2 key={idx} className="text-xl font-bold text-white mt-5 mb-3 border-b border-gray-700 pb-1">{line.replace(/^##\s*/, '')}</h2>;
                                        }
                                        // Bullet points
                                        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
                                            const content = line.trim().replace(/^[\*\-]\s*/, '');
                                            const bolded = content.split(/(\*\*.*?\*\*)/).map((part, i) =>
                                                part.startsWith('**') && part.endsWith('**') ? <strong key={i} className="text-white">{part.slice(2, -2)}</strong> : part
                                            );
                                            return (
                                                <div key={idx} className="flex gap-2 ml-4">
                                                    <span className="text-teal-500 mt-1.5">•</span>
                                                    <span className="text-gray-300">{bolded}</span>
                                                </div>
                                            );
                                        }
                                        // Normal text with bolding
                                        if (line.trim().length > 0) {
                                            const bolded = line.split(/(\*\*.*?\*\*)/).map((part, i) =>
                                                part.startsWith('**') && part.endsWith('**') ? <strong key={i} className="text-white">{part.slice(2, -2)}</strong> : part
                                            );
                                            return <p key={idx} className="text-gray-300">{bolded}</p>;
                                        }
                                        return <div key={idx} className="h-2"></div>;
                                    })}
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-gray-400 space-y-6">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-400"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl">🧠</div>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-white mb-1">{t('processing')}</p>
                            <p className="text-xs uppercase tracking-widest text-teal-400/60 font-black">{t('geminiAnalyzing')}</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-red-900/20 border border-red-500/30 p-8 rounded-3xl text-center">
                        <div className="text-4xl mb-4">⚠️</div>
                        <h3 className="text-xl font-bold text-white mb-2">Error</h3>
                        <p className="text-gray-400 mb-6 max-w-md mx-auto">{error}</p>
                        <button onClick={fetchInsights} className="px-6 py-3 bg-red-600/80 text-white rounded-xl font-bold hover:bg-red-600 transition-all">Try Again Now</button>
                    </div>
                ) : insights ? (
                    <div className="animate-fadeIn">
                        {activeTab === 'snapshot' && renderSnapshot(parsedSections)}
                        {activeTab === 'intel' && renderMarketIntel(parsedSections)}
                        {activeTab === 'plan' && renderActionPlan(parsedSections)}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 bg-gray-800/20 rounded-3xl border-2 border-dashed border-gray-700/50">
                        <div className="text-6xl mb-6 opacity-20">📊</div>
                        <p className="text-gray-500 text-lg font-medium">{t('noData')}</p>
                        <p className="text-gray-600 text-sm mt-1">{t('applyFilters')}</p>
                    </div>
                )}
            </div>

            {/* Global Disclaimer */}
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5 flex items-start gap-4 mb-10">
                <span className="text-xl">🛡️</span>
                <p className="text-[11px] text-gray-500 leading-relaxed italic">
                    <strong className="text-gray-400 uppercase tracking-tighter not-italic mr-2">AI Disclaimer:</strong>
                    {t('aiDisclaimer')}
                </p>
            </div>
        </div>
    );
};

export default InsightsSheet;
