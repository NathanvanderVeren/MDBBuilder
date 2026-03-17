import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface User {
  id: string;
  name: string;
  email: string;
  company: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  requiresEmailVerification: boolean;
  loading: boolean;
  signInWithMicrosoft: () => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ error: string | null; needsVerification: boolean }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  requestEmailVerification: (email: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  refreshUser: () => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function mapSupabaseUser(supabaseUser: SupabaseUser): User {
  // Keep email strict: this should reflect the auth user's verified email field only.
  // We use metadata fallbacks for display name, not for email presence checks.
  const email = supabaseUser.email ?? "";
  const identityHint =
    supabaseUser.user_metadata?.name ??
    supabaseUser.user_metadata?.preferred_username ??
    supabaseUser.user_metadata?.email ??
    supabaseUser.phone ??
    supabaseUser.id.slice(0, 8);
  const name = identityHint.includes("@") ? identityHint.split("@")[0] : identityHint;

  return {
    id: supabaseUser.id,
    name,
    email,
    company: supabaseUser.user_metadata?.company ?? "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();
    const mapped = supabaseUser ? mapSupabaseUser(supabaseUser) : null;
    setUser(mapped);
    return mapped;
  }, []);

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION once auth state is fully resolved,
    // including after OAuth redirects — more reliable than getSession() alone.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
      if (event === "INITIAL_SESSION") {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithMicrosoft = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "openid profile email",
        queryParams: {
          prompt: "select_account",
        },
      },
    });
    return { error: error?.message ?? null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    return { error: error?.message ?? null };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) return { error: error.message, needsVerification: false };
    // If identities array is empty the email already exists (Supabase returns fake success)
    if (data.user && data.user.identities?.length === 0) {
      return { error: "An account with this email already exists. Please sign in instead.", needsVerification: false };
    }
    const needsVerification = !data.session; // session is null when email confirmation is required
    return { error: null, needsVerification };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const requestEmailVerification = useCallback(async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.updateUser(
      { email: normalizedEmail },
      { emailRedirectTo: `${window.location.origin}/auth/callback` }
    );

    if (error) return { error: error.message };

    // Some projects/providers do not dispatch the initial change-email message reliably.
    // Explicitly resend the verification mail to the pending email change target.
    const { error: resendError } = await supabase.auth.resend({
      type: "email_change",
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    return { error: resendError?.message ?? null };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    return { error: error?.message ?? null };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error?.message ?? null };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        requiresEmailVerification: !!user && !user.email,
        loading,
        signInWithMicrosoft,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        requestEmailVerification,
        resetPassword,
        updatePassword,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
