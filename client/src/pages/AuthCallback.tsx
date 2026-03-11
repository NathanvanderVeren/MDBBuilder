import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const errorParam = params.get("error");
    const errorDescription = params.get("error_description");

    if (errorParam) {
      const msg = errorDescription
        ? decodeURIComponent(errorDescription)
        : errorParam;
      console.log("[callback] error from Supabase:", msg);
      setError(msg);
      return;
    }

    if (!code) {
      console.log("[callback] no code in URL, redirecting home");
      navigate("/");
      return;
    }

    console.log("[callback] exchanging code...");
    supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
      if (error) {
        console.log("[callback] exchange failed:", error.message);
        setError(error.message);
      } else {
        console.log("[callback] exchange succeeded, session user:", data.session?.user?.id ?? "none");
        window.location.href = "/";
      }
    });
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground">
        <p className="text-destructive font-medium">Sign-in failed: {error}</p>
        <button
          className="underline text-sm text-muted-foreground"
          onClick={() => navigate("/")}
        >
          Back to home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <span className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}
