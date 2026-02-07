import { useState, useEffect, FC, FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Loader2, Mail, Lock, ArrowRight, User, Eye, EyeOff, KeyRound } from 'lucide-react';

interface AuthModalProps {
    onClose: () => void;
}

export const AuthModal: FC<AuthModalProps> = ({ onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleAuth = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            if (isForgotPassword) {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/dashboard`,
                });
                if (error) {
                    if (error.message.includes('rate limit')) {
                        throw new Error('Too many requests. Please wait a minute before trying again.');
                    }
                    throw error;
                }
                setSuccessMsg('Reset link sent! Please check your email.');
                setCooldown(60); // 60 second cooldown
                setLoading(false);
                return;
            }

            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) {
                    if (error.message.includes('Invalid login credentials')) {
                        throw new Error('User not found or incorrect password');
                    }
                    throw error;
                }
                // Success - Auth state listener in App will handle redirect
                onClose();
            } else {
                // Signup with first/last name merged in metadata
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            first_name: firstName,
                            last_name: lastName,
                            full_name: `${firstName} ${lastName}`.trim(),
                        }
                    }
                });
                if (error) throw error;

                const { data: sessionData } = await supabase.auth.getSession();
                if (sessionData.session) {
                    onClose();
                } else {
                    setSuccessMsg('Signup successful! Please check your email to confirm your account.');
                    setLoading(false);
                    return;
                }
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            if (!error && !successMsg) setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {isForgotPassword ? 'Reset Password' : (isLogin ? 'Welcome Back' : 'Create Account')}
                        </h2>
                        <p className="text-slate-400 text-sm">
                            {isForgotPassword
                                ? 'Enter your email to receive a recovery link.'
                                : (isLogin ? 'Enter your credentials to access the dashboard.' : 'Sign up to start analyzing HORECA trends.')}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        {/* Name Fields - Only show on signup */}
                        {!isLogin && !isForgotPassword && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-300 ml-1">First Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="text"
                                            required
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all"
                                            placeholder="John"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-300 ml-1">Last Name</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            required
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all"
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-300 ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        {!isForgotPassword && (
                            <div className="space-y-1">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-xs font-medium text-slate-300">Password</label>
                                    {isLogin && (
                                        <button
                                            type="button"
                                            onClick={() => setIsForgotPassword(true)}
                                            className="text-[10px] text-teal-500 hover:text-teal-400 font-medium"
                                        >
                                            Forgot Password?
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-12 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all"
                                        placeholder="••••••••"
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                                {error}
                            </div>
                        )}

                        {successMsg && (
                            <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg text-teal-400 text-xs text-center font-medium">
                                {successMsg}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || (isForgotPassword && cooldown > 0)}
                            className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                <>
                                    {isForgotPassword
                                        ? (cooldown > 0 ? `Wait ${cooldown}s` : 'Send Recovery Link')
                                        : (isLogin ? 'Sign In' : 'Create Account')}
                                    {isForgotPassword ? <KeyRound size={18} /> : <ArrowRight size={18} />}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-slate-500 text-sm">
                            {isForgotPassword ? "Remembered your password? " : (isLogin ? "Don't have an account? " : "Already have an account? ")}
                            <button
                                onClick={() => {
                                    if (isForgotPassword) setIsForgotPassword(false);
                                    else setIsLogin(!isLogin);
                                    setError(null);
                                    setSuccessMsg(null);
                                }}
                                className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
                            >
                                {isForgotPassword ? 'Back to Login' : (isLogin ? 'Sign up' : 'Log in')}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
