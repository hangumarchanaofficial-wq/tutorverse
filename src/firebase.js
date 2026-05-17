import { supabase } from "./lib/supabaseClient";

export const auth = supabase.auth;
export const googleProvider = { provider: "google" };

export async function signInWithPopup(_auth, provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider.provider || "google",
        options: {
            redirectTo: window.location.origin,
        },
    });
    if (error) throw error;
    return { user: data.user || null };
}

export async function signInWithEmailAndPassword(_auth, email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { user: data.user };
}

export async function createUserWithEmailAndPassword(_auth, email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return { user: data.user };
}

export async function signOut(_auth) {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function updateProfile(user, attrs) {
    const { data, error } = await supabase.auth.updateUser({
        data: { displayName: attrs.displayName || user?.user_metadata?.displayName || "" },
    });
    if (error) throw error;
    return data.user;
}

export function onAuthStateChanged(_auth, callback) {
    const {
        data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => callback(session?.user || null));
    supabase.auth.getUser().then(({ data }) => callback(data.user || null));
    return () => subscription.unsubscribe();
}
