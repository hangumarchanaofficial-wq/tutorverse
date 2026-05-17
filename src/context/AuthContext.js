import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
    auth,
    googleProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    onAuthStateChanged,
} from "../firebase";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            (async () => {
                if (!authUser) {
                    if (!cancelled) {
                        setUser(null);
                        setLoading(false);
                    }
                    return;
                }
                if (!cancelled) setLoading(true);
                let role = "customer";
                let fullName = "";
                try {
                    const { data } = await supabase
                        .from("profiles")
                        .select("role,full_name")
                        .eq("id", authUser.id)
                        .maybeSingle();
                    role = data?.role || "customer";
                    fullName = data?.full_name || "";
                } catch {
                    /* profile fetch optional */
                }
                if (cancelled) return;
                setUser({
                    uid: authUser.id,
                    email: authUser.email,
                    displayName:
                        fullName ||
                        authUser.user_metadata?.displayName ||
                        authUser.user_metadata?.full_name ||
                        "",
                    photoURL: authUser.user_metadata?.avatar_url || null,
                    role,
                });
                setLoading(false);
            })();
        });
        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, []);

    const register = useCallback(async (email, password, displayName) => {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (result.user) {
            await updateProfile(result.user, { displayName });
        }
        setUser({
            uid: result.user?.id,
            email: result.user.email,
            displayName: displayName,
            photoURL: null,
            role: "customer",
        });
        return result.user;
    }, []);

    const login = useCallback(async (email, password) => {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    }, []);

    const googleSignIn = useCallback(async () => {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    }, []);

    const logout = useCallback(async () => {
        await signOut(auth);
        setUser(null);
    }, []);

    const adminBypass =
        String(process.env.REACT_APP_ADMIN_BYPASS || "").toLowerCase() === "true";

    const value = useMemo(
        () => ({
            user,
            loading,
            adminBypass,
            isAdmin: adminBypass || (!!user && user.role === "admin"),
            register,
            login,
            googleSignIn,
            logout,
        }),
        [user, loading, adminBypass, register, login, googleSignIn, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
