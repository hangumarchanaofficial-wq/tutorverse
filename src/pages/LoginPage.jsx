import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
    const { login, googleSignIn } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("password");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    /* lock body scroll while modal is open */
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    const handleClose = () => navigate(-1);

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setError("");
        const identifier = activeTab === "password" ? email : phone;
        if (!identifier.trim()) return setError(activeTab === "password" ? "Please enter your Phone or Email." : "Please enter your phone number.");
        if (activeTab === "password" && !password) return setError("Please enter your password.");

        setIsLoading(true);
        try {
            await login(identifier, password);
            navigate("/");
        } catch (err) {
            const code = err.code;
            if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
                setError("Invalid email or password. Please try again.");
            } else if (code === "auth/too-many-requests") {
                setError("Too many attempts. Please try again later.");
            } else if (code === "auth/invalid-email") {
                setError("Please enter a valid email address.");
            } else {
                setError("Something went wrong. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        setIsGoogleLoading(true);
        try {
            await googleSignIn();
            navigate("/");
        } catch (err) {
            if (err.code !== "auth/popup-closed-by-user") {
                setError("Google sign-in failed. Please try again.");
            }
        } finally {
            setIsGoogleLoading(false);
        }
    };

    return (
        <>
            {/* ─── Dark overlay backdrop ─── */}
            <div className="fixed inset-0 z-[100] flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

                {/* ─── Modal card ─── */}
                <div className="relative z-10 w-[95vw] max-w-[420px] bg-white rounded-lg shadow-2xl animate-fade-in overflow-hidden">

                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
                        aria-label="Close"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                        </svg>
                    </button>

                    {/* ─── Tab headers (Password | Phone Number) ─── */}
                    <div className="flex border-b border-stone-200">
                        <button
                            onClick={() => { setActiveTab("password"); setError(""); }}
                            className={"flex-1 py-4 text-sm font-semibold text-center transition-colors relative " +
                                (activeTab === "password"
                                    ? "text-navy-950"
                                    : "text-stone-400 hover:text-stone-600")}
                        >
                            Password
                            {activeTab === "password" && (
                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-16 bg-brand-gold rounded-full" />
                            )}
                        </button>
                        <div className="w-px bg-stone-200 my-3" />
                        <button
                            onClick={() => { setActiveTab("phone"); setError(""); }}
                            className={"flex-1 py-4 text-sm font-semibold text-center transition-colors relative " +
                                (activeTab === "phone"
                                    ? "text-navy-950"
                                    : "text-stone-400 hover:text-stone-600")}
                        >
                            Phone Number
                            {activeTab === "phone" && (
                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-16 bg-brand-gold rounded-full" />
                            )}
                        </button>
                    </div>

                    {/* ─── Form body ─── */}
                    <div className="px-6 pt-5 pb-6 sm:px-8">
                        {/* Error */}
                        {error && (
                            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-xs text-red-600">
                                <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            {activeTab === "password" ? (
                                <>
                                    {/* Email / Phone field */}
                                    <input
                                        type="text"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Please enter your Phone or Email"
                                        autoComplete="email"
                                        className="w-full h-11 rounded-md border border-stone-300 bg-white px-3.5 text-sm text-navy-950 placeholder:text-stone-400 transition-all focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold/30"
                                    />

                                    {/* Password field */}
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Please enter your password"
                                            autoComplete="current-password"
                                            className="w-full h-11 rounded-md border border-stone-300 bg-white px-3.5 pr-11 text-sm text-navy-950 placeholder:text-stone-400 transition-all focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold/30"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                                        >
                                            {showPassword ? (
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                            ) : (
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            )}
                                        </button>
                                    </div>

                                    {/* Forgot password */}
                                    <div className="text-right">
                                        <button type="button" className="text-xs text-brand-gold-dark hover:text-brand-gold transition-colors font-medium">
                                            Forgot password?
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Phone Number tab */}
                                    <div className="flex gap-2">
                                        <div className="flex h-11 items-center rounded-md border border-stone-300 bg-stone-50 px-3 text-sm text-stone-500 flex-shrink-0">
                                            +94
                                            <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="m6 9 6 6 6-6"/></svg>
                                        </div>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="Enter your phone number"
                                            className="w-full h-11 rounded-md border border-stone-300 bg-white px-3.5 text-sm text-navy-950 placeholder:text-stone-400 transition-all focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold/30"
                                        />
                                    </div>
                                    <p className="text-[11px] text-stone-400">We'll send you a verification code via SMS.</p>
                                </>
                            )}

                            {/* Login button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-11 rounded-md bg-brand-gold hover:bg-brand-gold-dark text-navy-950 text-sm font-bold transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-navy-950/30 border-t-navy-950" />
                                ) : (
                                    "LOGIN"
                                )}
                            </button>
                        </form>

                        {/* Sign up link */}
                        <p className="mt-4 text-center text-sm text-stone-500">
                            Don't have an account?{" "}
                            <Link to="/register" className="font-semibold text-brand-gold-dark hover:text-brand-gold transition-colors">
                                Sign up
                            </Link>
                        </p>

                        {/* Social divider */}
                        <div className="my-5 flex items-center gap-3">
                            <div className="h-px flex-1 bg-stone-200" />
                            <span className="text-xs text-stone-400">Or, login with</span>
                            <div className="h-px flex-1 bg-stone-200" />
                        </div>

                        {/* Social buttons row */}
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={handleGoogleLogin}
                                disabled={isGoogleLoading}
                                className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-600 transition-all hover:border-stone-300 hover:shadow-sm disabled:opacity-60"
                            >
                                {isGoogleLoading ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-navy-950" />
                                ) : (
                                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                )}
                                Google
                            </button>
                            <button
                                className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-600 transition-all hover:border-stone-300 hover:shadow-sm"
                            >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                Facebook
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginPage;
