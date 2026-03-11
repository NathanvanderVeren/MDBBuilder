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
  loading: boolean;
  signInWithMicrosoft: () => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function mapSupabaseUser(supabaseUser: SupabaseUser): User {
  return {
    id: supabaseUser.id,
    name: supabaseUser.user_metadata?.name ?? supabaseUser.email?.split("@")[0] ?? "",
    email: supabaseUser.email ?? "",
    company: supabaseUser.user_metadata?.company ?? "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
      options: { redirectTo: `${window.location.origin}/builder` },
    });
    return { error: error?.message ?? null };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, signInWithMicrosoft, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
