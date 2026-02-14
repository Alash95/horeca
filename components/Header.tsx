import { LogOut, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import { useLanguage } from '../context/LanguageContext';

const Header = () => {
    const { t } = useLanguage();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    return (
        <header className="bg-slate-950/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
            <div className="px-8 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">
                        Horeca <span className="text-teal-400">Intelligence</span>
                    </h1>
                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">{t('marketAnalysisPlatform')}</p>
                </div>

                <div className="flex items-center gap-6">
                    {/* Language Switcher Removed */}

                    <div className="flex items-center gap-4">
                        <Link
                            to="/dashboard/profile"
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg transition-all hover:scale-110 active:scale-95 ${window.location.pathname.includes('/profile')
                                ? 'bg-teal-500 text-slate-950 shadow-teal-500/40'
                                : 'bg-slate-900 border border-slate-800 text-teal-500 shadow-black/20 hover:border-teal-500/50'
                                }`}
                            title={t('yourAccount')}
                        >
                            <User size={20} />
                        </Link>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-full text-slate-400 hover:text-red-400 text-sm font-medium transition-all group"
                            title={t('signOut')}
                        >
                            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span>{t('signOut')}</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
