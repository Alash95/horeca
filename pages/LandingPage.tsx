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

    useEffect(() => {
        // Check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) navigate('/dashboard');
        });

        // Listen for auth changes (e.g. after email confirmation link redirect)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) navigate('/dashboard');
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-slate-950 font-sans selection:bg-teal-500/30 text-slate-100 overflow-x-hidden">

            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[0%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px]" />
                <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[100px]" />
            </div>

            {/* Navbar */}
            <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Horeca Logo" className="h-10 w-auto" />
                </div>
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setIsAuthOpen(true)}
                        className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                    >
                        Log in
                    </button>
                    <button
                        onClick={() => setIsAuthOpen(true)}
                        className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-full text-sm transition-all shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40"
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 pt-20 pb-32 px-6 max-w-7xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-800 text-teal-400 text-xs font-medium mb-6">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                        </span>
                        Live Market Data 2024-2025
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
                        Unlocking the Value of <br />
                        <span className="text-teal-400">Italian HORECA</span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        The ultimate intelligence platform for Italian Fine Wines & F&B.
                        Track menu trends, pricing strategies, and brand performance across Italy's top venues.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => setIsAuthOpen(true)}
                            className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-full text-lg transition-all shadow-xl shadow-teal-500/20 hover:shadow-teal-500/40 hover:scale-105 flex items-center gap-2"
                        >
                            Start Analysis <ArrowRight size={20} />
                        </button>
                        <button
                            onClick={() => setIsDemoOpen(true)}
                            className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-full text-lg border border-slate-800 transition-all flex items-center gap-2"
                        >
                            View Demo <ChevronRight size={20} className="text-slate-500" />
                        </button>
                    </div>
                </motion.div>

                {/* Dashboard Preview "Blend" */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="mt-20 relative mx-auto max-w-7xl"
                >
                    <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/30 to-emerald-500/30 rounded-2xl blur-lg opacity-40"></div>
                    <div className="relative rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden aspect-[16/9] flex items-center justify-center group">
                        <img
                            src="/dashboard_overview_clean.png"
                            alt="HORECA Intelligence Dashboard Overview"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                        />
                        <div className="absolute inset-0 bg-slate-950/5 pointer-events-none"></div>
                        <div className="absolute bottom-6 left-8 z-20">
                            <span className="px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-teal-400 text-xs font-bold shadow-lg backdrop-blur-sm">
                                Live Platform Interface
                            </span>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section className="relative z-10 py-32 bg-slate-950">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Italian Excellence Data</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            Comprehensive data coverage of the Italian food and beverage sector.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Wine className="text-teal-400" size={32} />}
                            title="Wine Trends"
                            description="Deep dive into wine lists across regions. Analyze pricing, varietals, and brand presence in top Italian restaurants."
                        />
                        <FeatureCard
                            icon={<BarChart3 className="text-teal-400" size={32} />}
                            title="Competitor Analysis"
                            description="Track your Share of Listings against key competitors. Identify white spaces in menus and optimize your portfolio."
                        />
                        <FeatureCard
                            icon={<MapPin className="text-teal-400" size={32} />}
                            title="Regional Focus"
                            description="Granular data from Milan to Sicily. Understand regional preferences and tailor your distribution strategy."
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
                    <div className="text-slate-600 text-sm">
                        &copy; {new Date().getFullYear()} HORECA Studio. All rights reserved.
                    </div>
                </div>
            </footer>

            {/* Auth Modal */}
            {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} />}

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
