import { Clock, ShieldCheck, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';

export const PendingAccess = () => {
    const { t } = useLanguage();
    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-teal-500/20 blur-3xl rounded-full"></div>
                <div className="relative w-24 h-24 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center shadow-inner">
                    <Clock className="text-teal-400 animate-pulse" size={48} />
                </div>
            </div>

            <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight leading-tight max-w-md">
                {t('applicationUnderReview').split(' ')[0]} <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">{t('applicationUnderReview').split(' ').slice(1).join(' ')}</span>
            </h1>

            <p className="text-slate-400 text-lg max-w-lg mb-10 leading-relaxed">
                {t('thankYouReview')}
                {t('fullAccessWait')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
                <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col items-center text-center">
                    <ShieldCheck className="text-teal-500 mb-3" size={24} />
                    <h3 className="text-white font-bold mb-1">{t('status')}</h3>
                    <p className="text-slate-500 text-sm">{t('pendingVerification')}</p>
                </div>
                <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col items-center text-center">
                    <Clock className="text-teal-500 mb-3" size={24} />
                    <h3 className="text-white font-bold mb-1">{t('timeline')}</h3>
                    <p className="text-slate-500 text-sm">{t('usually24h')}</p>
                </div>
            </div>

            <button
                onClick={handleSignOut}
                className="mt-12 group flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-medium"
            >
                <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                {t('signoutAndReturn')}
            </button>
        </div>
    );
}; 
