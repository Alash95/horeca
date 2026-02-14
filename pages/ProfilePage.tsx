import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Mail, Shield, Key, Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useData } from '../context/DataProvider';
import { useLanguage } from '../context/LanguageContext';

export const ProfilePage = () => {
    const { userPermissions } = useData();
    const { t } = useLanguage();
    const [user, setUser] = useState<any>(null);
    const [dbUser, setDbUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUser(user);
            const { data: dbData } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();
            setDbUser(dbData);
        }
        setLoading(false);
    };

    const handlePasswordResetRequest = async () => {
        setUpdating(true);
        setMsg(null);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: `${window.location.origin}/dashboard`
            });
            if (error) throw error;

            // 🛡️ SECURITY & UX: Log out and take user to landing page recovery tab as requested
            await supabase.auth.signOut();
            window.location.href = '/?auth=recovery';

        } catch (err: any) {
            setMsg({ type: 'error', text: err.message || t('failedSendReset') });
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-teal-500" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                    {t('accountSettings').split(' ')[0]} <span className="text-teal-400">{t('accountSettings').split(' ')[1]}</span>
                </h1>
                <p className="text-slate-400 mt-2 text-lg">{t('manageProfileDesc')}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Overview Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                        <div className="relative w-24 h-24 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl flex items-center justify-center text-slate-950 shadow-xl shadow-teal-500/20 mb-6 transform group-hover:scale-105 transition-transform duration-500">
                            <User size={48} />
                        </div>

                        <h2 className="text-xl font-bold text-white mb-1">{dbUser?.name || 'User'}</h2>
                        <p className="text-slate-500 text-sm font-medium mb-6 uppercase tracking-widest">{userPermissions.role}</p>

                        <div className="w-full pt-6 border-t border-slate-800 space-y-4">
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] text-slate-600 uppercase font-bold tracking-widest mb-1">{t('assignedPortfolio')}</span>
                                <span className="text-teal-400 font-mono text-xs bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20 truncate max-w-full">
                                    {userPermissions.brand}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details and Security */}
                <div className="md:col-span-2 space-y-8">
                    {/* Account Details */}
                    <section className="bg-slate-900 border border-slate-800 rounded-[2rem] p-10 shadow-xl relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center">
                                <Mail className="text-teal-500" size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-white">{t('accountDetails')}</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{t('emailAddress')}</label>
                                <div className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 flex items-center justify-between group transition-colors hover:border-slate-700">
                                    <span className="text-slate-200 font-medium">{user?.email}</span>
                                    <Shield className="text-emerald-500/40 group-hover:text-emerald-500 transition-colors" size={18} />
                                </div>
                                <p className="text-[10px] text-slate-600 mt-2 ml-1 italic">{t('verifiedVia')}</p>
                            </div>
                        </div>
                    </section>

                    {/* Security Actions */}
                    <section className="bg-slate-900 border border-slate-800 rounded-[2rem] p-10 shadow-xl relative overflow-hidden group">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center">
                                <Key className="text-teal-500" size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-white">{t('security')}</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl">
                                <h4 className="text-white font-bold mb-2">{t('changePassword')}</h4>
                                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                    {t('changePasswordDesc')}
                                </p>

                                <button
                                    onClick={handlePasswordResetRequest}
                                    disabled={updating}
                                    className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-xl flex items-center gap-3 transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-teal-500/20"
                                >
                                    {updating ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                                    {t('sendResetLink')}
                                </button>
                            </div>

                            {msg && (
                                <div className={`p-6 rounded-2xl flex items-center gap-4 animate-in zoom-in duration-300 ${msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                                    }`}>
                                    {msg.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                    <p className="text-sm font-medium">{msg.text}</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
