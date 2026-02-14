import { useState, useEffect, FC, FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Loader2, Mail, Lock, ArrowRight, User, Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface AuthModalProps {
    onClose: () => void;
    initialMode?: 'login' | 'signup' | 'forgot';
}

export const AuthModal: FC<AuthModalProps> = ({ onClose, initialMode = 'login' }) => {
    const { t } = useLanguage();
    const [isLogin, setIsLogin] = useState(initialMode === 'login');
    const [isForgotPassword, setIsForgotPassword] = useState(initialMode === 'forgot');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Auth Status States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(0);

    // OTP Specific States
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [verificationType, setVerificationType] = useState<'signup' | 'recovery'>('signup');

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleAuth = async (e: FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        const redirectTo = window.location.origin;

        try {
            if (isForgotPassword) {
                const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
                if (error) {
                    if (error.status === 429 || error.message.includes('rate limit')) {
                        throw new Error(t('tooManyRequests'));
                    }
                    throw error;
                }
                setSuccessMsg(t('recoveryCodeSent'));
                setIsVerifyingOtp(true);
                setVerificationType('recovery');
                setCooldown(120);
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
                        throw new Error(t('invalidLogin'));
                    }
                    if (error.status === 429) {
                        throw new Error(t('tooManyRequests'));
                    }
                    throw error;
                }
                onClose();
            } else {
                if (password !== confirmPassword) {
                    throw new Error(t('passwordsDoNotMatch'));
                }

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: redirectTo,
                        data: {
                            first_name: firstName,
                            last_name: lastName,
                            full_name: `${firstName} ${lastName}`.trim(),
                        }
                    }
                });

                if (error) {
                    if (error.status === 429) {
                        throw new Error(t('tooManyRequests'));
                    }
                    throw error;
                }

                if (data.session) {
                    onClose();
                } else {
                    setSuccessMsg(t('verificationCodeSent'));
                    setIsVerifyingOtp(true);
                    setVerificationType('signup');
                    setCooldown(120);
                    setLoading(false);
                }
            }
        } catch (err: any) {
            setError(err.message || t('authFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: otpCode,
                type: verificationType === 'signup' ? 'signup' : 'recovery'
            });

            if (error) throw error;

            if (verificationType === 'signup') {
                await supabase.auth.signOut();
                setSuccessMsg(t('emailVerifiedSuccess'));
                setIsVerifyingOtp(false);
                setIsLogin(true);
                setIsForgotPassword(false);
                setOtpCode('');
            } else {
                setIsVerifyingOtp(false);
                setIsResettingPassword(true);
                setConfirmPassword('');
            }
        } catch (err: any) {
            setError(err.message || t('verificationFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (newPassword !== confirmPassword) {
                throw new Error(t('passwordsDoNotMatch'));
            }

            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            await supabase.auth.signOut();
            setSuccessMsg(t('passwordUpdatedSuccess'));
            setIsResettingPassword(false);
            setIsLogin(true);
            setIsForgotPassword(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.message || t('passwordUpdateFailed'));
        } finally {
            setLoading(false);
        }
    };

    const isLocked = isVerifyingOtp || isResettingPassword;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl w-full max-w-[440px] overflow-hidden relative">
                {!isLocked && (
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors z-20"
                    >
                        <X size={20} />
                    </button>
                )}

                <div className="p-10">
                    <div className="text-center mb-10 flex flex-col items-center">
                        <div className="mb-6 w-14 h-14 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center shadow-inner group">
                            {isVerifyingOtp ? (
                                <Mail className="text-teal-400 group-hover:scale-110 transition-transform" size={28} />
                            ) : isResettingPassword ? (
                                <Lock className="text-teal-400 group-hover:scale-110 transition-transform" size={28} />
                            ) : isForgotPassword ? (
                                <KeyRound className="text-teal-400 group-hover:scale-110 transition-transform" size={28} />
                            ) : (
                                <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" />
                            )}
                        </div>

                        <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">
                            {isVerifyingOtp ? t('checkYourEmail') :
                                isResettingPassword ? t('updateYourPassword') :
                                    isForgotPassword ? t('resetPassword') :
                                        isLogin ? t('signInToDashboard') : t('createYourAccount')}
                        </h2>
                        <p className="text-slate-400 text-sm max-w-[280px] mx-auto leading-relaxed">
                            {isVerifyingOtp
                                ? t('sentOtpCode', { email })
                                : isResettingPassword
                                    ? t('setStrongPassword')
                                    : isForgotPassword
                                        ? t('enterEmailRecovery')
                                        : isLogin ? t('enterCredentials') : t('joinHorecaDescription')}
                        </p>
                    </div>

                    <form
                        onSubmit={
                            isVerifyingOtp ? handleVerifyOtp :
                                isResettingPassword ? handleUpdatePassword :
                                    handleAuth
                        }
                        className="space-y-5"
                    >
                        {isVerifyingOtp ? (
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            required
                                            maxLength={6}
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 text-white text-center text-2xl font-bold tracking-[0.5em] placeholder:text-slate-800 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all shadow-inner"
                                            placeholder="000000"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="text-center">
                                        <button
                                            type="button"
                                            onClick={() => setIsVerifyingOtp(false)}
                                            className="text-xs text-slate-500 hover:text-teal-400 transition-colors"
                                        >
                                            {t('wrongEmailEdit').split('?')[0]}? <span className="underline underline-offset-4">{t('wrongEmailEdit').split('?')[1].trim()}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : isResettingPassword ? (
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">{t('newPassword')}</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all"
                                            placeholder={t('passwordPlaceholder')}
                                            minLength={8}
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">{t('confirmNewPassword')}</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={`w-full bg-slate-950 border rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all ${confirmPassword && newPassword !== confirmPassword ? 'border-red-500/50' : 'border-slate-800'
                                                }`}
                                            placeholder={t('passwordMatchPlaceholder')}
                                            minLength={8}
                                        />
                                    </div>
                                    {confirmPassword && newPassword !== confirmPassword && (
                                        <p className="text-[10px] text-red-500 text-center font-medium mt-1">{t('passwordsDoNotMatch')}</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
                                {!isLogin && !isForgotPassword && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">{t('firstName')}</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                                <input
                                                    type="text"
                                                    required
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all"
                                                    placeholder={t('firstNamePlaceholder')}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">{t('lastName')}</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    required
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 px-5 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all"
                                                    placeholder={t('lastNamePlaceholder')}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">{t('emailAddress')}</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all"
                                            placeholder={t('emailPlaceholder')}
                                        />
                                    </div>
                                </div>

                                {!isForgotPassword && (
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('password')}</label>
                                                {isLogin && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsForgotPassword(true)}
                                                        className="text-[10px] text-teal-500 hover:text-teal-400 font-bold uppercase tracking-wider transition-colors"
                                                    >
                                                        {t('forgotPassword')}
                                                    </button>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    required
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all"
                                                    placeholder="••••••••"
                                                    minLength={8}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        {!isLogin && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">{t('confirmNewPassword')}</label>
                                                <div className="relative">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        required
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        className={`w-full bg-slate-950 border rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all ${confirmPassword && password !== confirmPassword ? 'border-red-500/50' : 'border-slate-800'
                                                            }`}
                                                        placeholder="••••••••"
                                                        minLength={8}
                                                    />
                                                </div>
                                                {confirmPassword && password !== confirmPassword && (
                                                    <p className="text-[10px] text-red-500 text-center font-medium mt-1">{t('passwordsDoNotMatch')}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-medium animate-in slide-in-from-top-2 duration-300">
                                {error}
                            </div>
                        )}

                        {successMsg && (
                            <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl text-sm flex flex-col items-center gap-4 animate-in zoom-in duration-500">
                                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="text-emerald-500" size={24} />
                                </div>
                                <span className="text-center font-medium leading-relaxed max-w-[240px]">{successMsg}</span>
                                {cooldown === 0 && !isLocked && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSuccessMsg(null);
                                            handleAuth({ preventDefault: () => { } } as any);
                                        }}
                                        className="text-teal-400 hover:text-teal-300 font-bold underline decoration-2 underline-offset-8 text-xs transition-all"
                                    >
                                        {t('resendVerification')}
                                    </button>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || (cooldown > 0 && !isVerifyingOtp && !successMsg && !isResettingPassword)}
                            className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold py-4 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-xl shadow-teal-500/20 hover:shadow-teal-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                <>
                                    <span>
                                        {cooldown > 0 && !isVerifyingOtp && !isResettingPassword && !successMsg ? (
                                            t('waitCooldown', { seconds: cooldown })
                                        ) : (
                                            isVerifyingOtp ? t('verifyIdentification') :
                                                isResettingPassword ? t('confirmNewPasswordBtn') :
                                                    isForgotPassword ? t('sendRecoveryCode') :
                                                        isLogin ? t('signIn') : t('signUp')
                                        )}
                                    </span>
                                    {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                                </>
                            )}
                        </button>
                    </form>

                    {!isLocked && (
                        <div className="mt-8 text-center border-t border-slate-800/50 pt-8">
                            <p className="text-slate-500 text-sm">
                                {isForgotPassword ? t('rememberPassword') + " " : (isLogin ? t('dontHaveAccount') + " " : t('alreadyHaveAccount') + " ")}
                                <button
                                    onClick={() => {
                                        if (isForgotPassword) setIsForgotPassword(false);
                                        else setIsLogin(!isLogin);
                                        setError(null);
                                        setSuccessMsg(null);
                                        setConfirmPassword('');
                                    }}
                                    className="text-teal-400 hover:text-teal-300 font-bold transition-colors ml-1"
                                >
                                    {isForgotPassword ? t('backToSignIn') : (isLogin ? t('signUp') : t('signIn'))}
                                </button>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
