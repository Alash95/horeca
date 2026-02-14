import { useState, useEffect, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, Wine, MapPin, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AuthModal } from '../components/auth/AuthModal';

export const LandingPage = () => {
    const navigate = useNavigate();
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isDemoOpen, setIsDemoOpen] = useState(false);
    const [verificationSuccess, setVerificationSuccess] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');

    useEffect(() => {
        // Check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session && !verificationSuccess) navigate('/dashboard');
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // 🛡️ SECURITY: If user just verified their email, show success but sign them out
            // so they have to login manually as requested.
            if (event === 'SIGNED_IN' && !session?.user.last_sign_in_at) {
                // This usually happens on first email confirmation
                setVerificationSuccess(true);
                await supabase.auth.signOut();
            } else if (session && event !== 'SIGNED_OUT' && event !== 'PASSWORD_RECOVERY') {
                // Only redirect if not in recovery or signout
                navigate('/dashboard');
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate, verificationSuccess]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('auth') === 'recovery') {
            setAuthMode('forgot');
            setIsAuthOpen(true);
        }
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 font-sans selection:bg-teal-500/30 text-slate-100 overflow-x-hidden">

            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[0%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px]" />
                <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[100px]" />
            </div>

            {/* Navbar */}
            <nav className="relative z-50 flex items-center justify-between px-6 py-8 max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Horeca Logo" className="h-10 w-auto" />
                </div>
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setIsAuthOpen(true)}
                        className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                    >
                        Log in
                    </button>
                    <button
                        onClick={() => setIsAuthOpen(true)}
                        className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-full text-sm transition-all shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40"
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 pt-12 pb-32 px-6 max-w-7xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    {/* 🛡️ Verification Success Banner */}
                    {verificationSuccess && (
                        <div className="mb-8 p-4 bg-teal-500/10 border border-teal-500/20 rounded-2xl max-w-md mx-auto animate-in zoom-in duration-300">
                            <h3 className="text-teal-400 font-bold mb-1">Email Verified Successfully! ✅</h3>
                            <p className="text-slate-400 text-sm">Your account is ready. Please sign in to continue.</p>
                        </div>
                    )}

                    <div className="space-y-6 mb-12">
                        <h1 className="text-teal-400 font-black text-5xl md:text-7xl tracking-tighter leading-tight">
                            Horeca Intelligence.
                        </h1>
                        <h2 className="text-2xl md:text-4xl font-extrabold text-white max-w-4xl mx-auto leading-tight">
                            You're already paying for distribution. <br />
                            <span className="text-slate-400">We show you what's actually on their menus.</span>
                        </h2>
                    </div>

                    <h3 className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
                        The intelligence platform for Wine & Spirits companies and decision makers.
                        Track brand menu presence, cocktail features, and competitor gaps across top Italian premium accounts.
                    </h3>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24">
                        <button
                            onClick={() => setIsAuthOpen(true)}
                            className="px-10 py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-full text-lg transition-all shadow-xl shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-105 flex items-center gap-3 group"
                        >
                            Start Analysis <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={() => setIsDemoOpen(true)}
                            className="px-10 py-4 bg-slate-900/50 hover:bg-slate-800 text-white font-bold rounded-full text-lg border border-slate-800 transition-all flex items-center gap-3 backdrop-blur-sm group"
                        >
                            View Demo <ChevronRight size={22} className="text-slate-500 group-hover:text-white transition-colors" />
                        </button>
                    </div>

                    {/* Main Headline in Visual Style */}
                    <div className="mb-20">
                        <h3 className="text-5xl md:text-8xl font-black tracking-tighter text-white">
                            Unlocking the Value of <br />
                            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">Italian HORECA</span>
                        </h3>
                    </div>
                </motion.div>

                {/* Dashboard Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="relative mx-auto max-w-6xl"
                >
                    <div className="absolute -inset-4 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 rounded-[2.5rem] blur-2xl opacity-30"></div>
                    <div className="relative rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden aspect-[16/10] flex items-center justify-center group ring-1 ring-white/5">
                        <img
                            src="/dashboard_overview_clean.png"
                            alt="HORECA Intelligence Dashboard Overview"
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-950 to-transparent"></div>
                        <div className="absolute top-8 left-8 z-20">
                            <span className="px-4 py-2 rounded-xl bg-slate-900/90 border border-white/5 text-teal-400 text-[10px] uppercase font-black tracking-widest shadow-2xl backdrop-blur-md">
                                Platform Analytics 2.0
                            </span>
                        </div>
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20">
                            <h4 className="text-white/40 text-sm font-black uppercase tracking-[0.5em]">Advanced Analytics</h4>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section className="relative z-10 py-40 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="mb-24">
                        <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">From Drink Menus to <br /><span className="text-teal-400">Commercial Decisions</span></h2>
                        <p className="text-slate-400 text-xl max-w-3xl mx-auto font-medium leading-relaxed">
                            Real market data from Italian top accounts, built for Wine & Spirits companies.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Wine className="text-teal-400" size={32} />}
                            title="Find wasted distribution"
                            description="You distributed 12 SKU, only 5 made the menu. Track which products accounts buy but never feature—and fix it."
                        />
                        <FeatureCard
                            icon={<BarChart3 className="text-teal-400" size={32} />}
                            title="Spot competitor threats early"
                            description="Competitor just launched a new signature cocktail in Milano’s 20 bars. You have zero. See where competitors are winning menu space."
                        />
                        <FeatureCard
                            icon={<MapPin className="text-teal-400" size={32} />}
                            title="Prove activation ROI"
                            description="You spent €50K on a Negroni Week activation. Did it work? Track menu changes before and after. Prove which accounts adopted your drinks."
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-900 bg-slate-950 py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">H</div>
                        <span className="text-slate-300 font-semibold">Horeca Intelligence</span>
                    </div>
                    <div className="text-slate-600 text-sm uppercase tracking-widest font-bold">
                        &copy; 2026 HORECA INTELLIGENCE SYSTEMS. ALL RIGHTS RESERVED.
                    </div>
                </div>
            </footer>

            {/* Auth Modal */}
            {isAuthOpen && (
                <AuthModal
                    onClose={() => setIsAuthOpen(false)}
                    initialMode={authMode}
                />
            )}

            {/* Demo Video Modal */}
            {isDemoOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={() => setIsDemoOpen(false)}
                >
                    <div
                        className="relative w-[90vw] max-w-6xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setIsDemoOpen(false)}
                            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white transition-colors"
                            aria-label="Close demo video"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Video Container */}
                        <div className="relative aspect-video bg-black">
                            <video
                                className="w-full h-full"
                                controls
                                autoPlay
                                src="/dashboard_demo.mp4"
                            >
                                Your browser does not support the video tag.
                            </video>
                        </div>

                        {/* Video Title */}
                        <div className="p-6 border-t border-slate-800">
                            <h3 className="text-xl font-semibold text-white mb-2">Dashboard Demo</h3>
                            <p className="text-slate-400 text-sm">
                                Watch how the HORECA Intelligence Dashboard helps you analyze market trends, track brand performance, and make data-driven decisions.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const FeatureCard = ({ icon, title, description }: { icon: ReactNode, title: string, description: string }) => (
    <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-teal-500/30 transition-all hover:-translate-y-1 group">
        <div className="mb-6 p-4 rounded-2xl bg-slate-950 border border-slate-800 inline-block group-hover:bg-teal-500/10 transition-colors">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-slate-400 leading-relaxed">
            {description}
        </p>
    </div>
);
