import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RegisterPage = () => {
    const { register, googleSignIn } = useAuth();
    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    const handleClose = () => navigate(-1);

    const passwordStrength = () => {
        if (!password) return { level: 0, label: "", color: "" };
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        if (score <= 1) return { level: 1, label: "Weak", color: "bg-red-500" };
        if (score === 2) return { level: 2, label: "Fair", color: "bg-amber-500" };
        if (score === 3) return { level: 3, label: "Good", color: "bg-brand-green" };
        return { level: 4, label: "Strong", color: "bg-emerald-500" };
    };
    const strength = passwordStrength();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        if (!fullName.trim()) return setError("Please enter your full name.");
        if (!email.trim()) return setError("Please enter your email address.");
        if (password.length < 6) return setError("Password must be at least 6 characters.");
        if (password !== confirmPassword) return setError("Passwords do not match.");
        if (!agreeTerms) return setError("Please agree to the Terms of Service.");

        setIsLoading(true);
        try {
            await register(email, password, fullName.trim());
            navigate("/");
        } catch (err) {
            const code = err.code;
            if (code === "auth/email-already-in-use") setError("This email is already registered. Try signing in instead.");
            else if (code === "auth/invalid-email") setError("Please enter a valid email address.");
            else if (code === "auth/weak-password") setError("Password is too weak. Use at least 6 characters.");
            else setError("Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        setError("");
        setIsGoogleLoading(true);
        try {
            await googleSignIn();
            navigate("/");
        } catch (err) {
            if (err.code !== "auth/popup-closed-by-user") setError("Google sign-up failed. Please try again.");
        } finally {
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

            <div className="relative z-10 w-[95vw] max-w-[440px] max-h-[90vh] bg-white rounded-lg shadow-2xl animate-fade-in overflow-y-auto">
                {/* Close */}
                <button onClick={handleClose} className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors" aria-label="Close">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /></svg>
                </button>

                {/* Header */}
                <div className="border-b border-stone-200 px-6 py-4 sm:px-8">
                    <h2 className="text-lg font-bold text-navy-950">Create Account</h2>
                    <p className="mt-1 text-xs text-stone-400">
                        Already have an account?{" "}
                        <Link to="/login" className="font-semibold text-brand-gold-dark hover:text-brand-gold transition-colors">Sign in</Link>
                    </p>
                </div>

                <div className="px-6 pt-4 pb-6 sm:px-8">
                    {error && (
                        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-xs text-red-600">
                            <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-3.5">
                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" autoComplete="name" className="w-full h-11 rounded-md border border-stone-300 bg-white px-3.5 text-sm text-navy-950 placeholder:text-stone-400 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold/30" />

                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" autoComplete="email" className="w-full h-11 rounded-md border border-stone-300 bg-white px-3.5 text-sm text-navy-950 placeholder:text-stone-400 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold/30" />

                        <div className="relative">
                            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min. 6 characters)" autoComplete="new-password" className="w-full h-11 rounded-md border border-stone-300 bg-white px-3.5 pr-11 text-sm text-navy-950 placeholder:text-stone-400 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold/30" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
                                {showPassword ? (<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" /></svg>) : (<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>)}
                            </button>
                        </div>

                        {password && (
                            <div className="flex items-center gap-2">
                                <div className="flex flex-1 gap-1">{[1,2,3,4].map((i) => (<div key={i} className={"h-1 flex-1 rounded-full transition-colors " + (i <= strength.level ? strength.color : "bg-stone-200")} />))}</div>
                                <span className={"text-[11px] font-medium " + (strength.level <= 1 ? "text-red-500" : strength.level === 2 ? "text-amber-500" : "text-emerald-600")}>{strength.label}</span>
                            </div>
                        )}

                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" autoComplete="new-password" className={"w-full h-11 rounded-md border bg-white px-3.5 text-sm text-navy-950 placeholder:text-stone-400 focus:outline-none focus:ring-1 " + (confirmPassword && confirmPassword !== password ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-stone-300 focus:border-brand-gold focus:ring-brand-gold/30")} />
                        {confirmPassword && confirmPassword !== password && (<p className="text-xs text-red-500 -mt-1">Passwords do not match</p>)}

                        <label className="flex items-start gap-2.5 cursor-pointer">
                            <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-stone-300 text-brand-gold focus:ring-brand-gold/30" />
                            <span className="text-xs text-stone-500 leading-relaxed">I agree to the <button type="button" className="font-medium text-stone-700 hover:text-navy-950">Terms</button> and <button type="button" className="font-medium text-stone-700 hover:text-navy-950">Privacy Policy</button></span>
                        </label>

                        <button type="submit" disabled={isLoading} className="w-full h-11 rounded-md bg-brand-gold hover:bg-brand-gold-dark text-navy-950 text-sm font-bold transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {isLoading ? (<div className="h-4 w-4 animate-spin rounded-full border-2 border-navy-950/30 border-t-navy-950" />) : "SIGN UP"}
                        </button>
                    </form>

                    <div className="my-4 flex items-center gap-3">
                        <div className="h-px flex-1 bg-stone-200" />
                        <span className="text-xs text-stone-400">Or, sign up with</span>
                        <div className="h-px flex-1 bg-stone-200" />
                    </div>

                    <div className="flex items-center justify-center gap-4">
                        <button onClick={handleGoogleRegister} disabled={isGoogleLoading} className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-600 hover:border-stone-300 hover:shadow-sm disabled:opacity-60 transition-all">
                            {isGoogleLoading ? (<div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-navy-950" />) : (<svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>)}
                            Google
                        </button>
                        <button className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-600 hover:border-stone-300 hover:shadow-sm transition-all">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            Facebook
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
