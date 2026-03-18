import { useEffect, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

const EMAIL_OTP_TYPES = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
] as const satisfies readonly EmailOtpType[];

function isEmailOtpType(value: string): value is EmailOtpType {
  return EMAIL_OTP_TYPES.includes(value as EmailOtpType);
}

export default function AuthCallback() {
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace("#", ""));

    const errorParam = params.get("error") ?? hash.get("error");
    if (errorParam) {
      const desc = params.get("error_description") ?? hash.get("error_description");
      setError(desc ? decodeURIComponent(desc) : errorParam);
      return;
    }

    // PKCE flow: code in query string
    const code = params.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) setError(error.message);
        else window.location.href = "/";
      });
      return;
    }

    // Email verification flow: token_hash + type (signup confirmation, magic link, recovery, etc.)
    const token_hash = params.get("token_hash");
    const type = params.get("type");
    if (token_hash && type) {
      if (!isEmailOtpType(type)) {
        setError(`Unsupported auth callback type: ${type}`);
        return;
      }

      supabase.auth.verifyOtp({ token_hash, type }).then(({ error }) => {
        if (error) setError(error.message);
        else if (type === "recovery") window.location.href = "/auth/reset-password";
        else window.location.href = "/";
      });
      return;
    }

    // Implicit flow: tokens in URL hash (used by Supabase Azure provider)
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    const hashType = hash.get("type");
    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
        if (error) setError(error.message);
        else if (hashType === "recovery") window.location.href = "/auth/reset-password";
        else window.location.href = "/";
      });
      return;
    }

    navigate("/");
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
