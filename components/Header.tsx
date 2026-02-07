import { LogOut, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Header = () => {
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
                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">Market Analysis Platform</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white text-sm font-medium transition-all"
                    >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                    </button>

                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-teal-500/20">
                        <User size={20} />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
