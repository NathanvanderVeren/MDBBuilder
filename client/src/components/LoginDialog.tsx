import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, Eye, EyeOff, ArrowLeft, MailCheck, KeyRound } from "lucide-react";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Mode = "oauth" | "signin" | "signup" | "forgot";

const MicrosoftIcon = () => (
  <svg viewBox="0 0 21 21" className="h-5 w-5 shrink-0" aria-hidden="true">
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.86c2.26-2.08 3.58-5.14 3.58-8.64z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.86-3c-1.07.72-2.44 1.14-4.07 1.14-3.13 0-5.78-2.11-6.73-4.95H1.28v3.11A12 12 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.55.37-2.28V6.61H1.28A12 12 0 0 0 0 12c0 1.93.46 3.76 1.28 5.39l3.99-3.11z" />
    <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.81l3.43-3.43C17.95 1.2 15.24 0 12 0A12 12 0 0 0 1.28 6.61l3.99 3.11c.95-2.84 3.6-4.95 6.73-4.95z" />
  </svg>
);

export default function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { signInWithMicrosoft, signInWithGoogle, signUpWithEmail, signInWithEmail, resetPassword } = useAuth();

  const [mode, setMode] = useState<Mode>("oauth");
  const [checkEmail, setCheckEmail] = useState(false);
  const [checkResetEmail, setCheckResetEmail] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<"microsoft" | "google" | "email" | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function resetForm() {
    setName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setCheckEmail(false);
    setCheckResetEmail(false);
  }

  function switchMode(next: Mode) {
    resetForm();
    setMode(next);
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) switchMode("oauth");
    onOpenChange(isOpen);
  }

  const handleMicrosoft = async () => {
    setLoadingProvider("microsoft");
    const { error } = await signInWithMicrosoft();
    if (error) { toast.error("Sign in failed", { description: error }); setLoadingProvider(null); }
  };

  const handleGoogle = async () => {
    setLoadingProvider("google");
    const { error } = await signInWithGoogle();
    if (error) { toast.error("Sign in failed", { description: error }); setLoadingProvider(null); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProvider("email");
    const { error } = await resetPassword(email.trim());
    setLoadingProvider(null);
    if (error) {
      toast.error("Failed to send reset link", { description: error });
    } else {
      setCheckResetEmail(true);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProvider("email");
    const { error } = await signInWithEmail(email.trim(), password);
    setLoadingProvider(null);
    if (error) {
      const isUnconfirmed = error.toLowerCase().includes("email not confirmed") || error.toLowerCase().includes("not confirmed");
      if (isUnconfirmed) {
        toast.error("Email not verified", {
          description: "Please check your inbox and click the verification link we sent you before signing in.",
        });
      } else {
        toast.error("Sign in failed", { description: error });
      }
    }
    // On success Supabase fires onAuthStateChange; dialog will close via parent
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProvider("email");
    const { error, needsVerification } = await signUpWithEmail(email.trim(), password, name.trim());
    setLoadingProvider(null);
    if (error) { toast.error("Sign up failed", { description: error }); return; }
    if (needsVerification) setCheckEmail(true);
  };

  const oauthBusy = loadingProvider !== null;
  const emailBusy = loadingProvider === "email";

  // ── Password-reset email sent screen ────────────────────────────────────
  if (checkResetEmail) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1">Check your email</h2>
              <p className="text-sm text-muted-foreground">
                We sent a password reset link to{" "}
                <span className="font-medium text-foreground">{email}</span>.
                Click the link to set a new password.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Didn't receive anything? Check your spam folder.</p>
            <Button variant="outline" className="w-full" onClick={() => switchMode("signin")}>
              Back to sign in
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Check-your-email success screen ──────────────────────────────────────
  if (checkEmail) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <MailCheck className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1">Check your email</h2>
              <p className="text-sm text-muted-foreground">
                We sent a verification link to{" "}
                <span className="font-medium text-foreground">{email}</span>.
                Click the link to activate your account, then sign in.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Didn't receive anything? Check your spam folder.</p>
            <Button variant="outline" className="w-full" onClick={() => switchMode("signin")}>
              Back to sign in
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm bg-card border-border">
        <DialogHeader>
          {mode !== "oauth" && (
            <button
              type="button"
              onClick={() => switchMode(mode === "forgot" ? "signin" : "oauth")}
              className="absolute top-4 left-4 rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <DialogTitle className="text-xl">
            {mode === "oauth" ? "Sign in to MDB Builder" : mode === "signin" ? "Sign in with email" : mode === "forgot" ? "Reset your password" : "Create an account"}
          </DialogTitle>
          <DialogDescription>
            {mode === "oauth"
              ? "Use your Microsoft, Google, or email account to continue."
              : mode === "signin"
              ? "Enter your email and password to sign in."
              : mode === "forgot"
              ? "Enter your email and we'll send you a reset link."
              : "Create a free account. We'll send a verification email."}
          </DialogDescription>
        </DialogHeader>

        {/* ── OAuth buttons ─────────────────────────────────────────────── */}
        {mode === "oauth" && (
          <div className="mt-4 space-y-3">
            <Button className="w-full flex items-center gap-3" size="lg" variant="outline" disabled={oauthBusy} onClick={handleMicrosoft}>
              {loadingProvider === "microsoft"
                ? <span className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin shrink-0" />
                : <MicrosoftIcon />}
              {loadingProvider === "microsoft" ? "Redirecting…" : "Sign in with Microsoft"}
            </Button>

            <Button className="w-full flex items-center gap-3" size="lg" variant="outline" disabled={oauthBusy} onClick={handleGoogle}>
              {loadingProvider === "google"
                ? <span className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin shrink-0" />
                : <GoogleIcon />}
              {loadingProvider === "google" ? "Redirecting…" : "Sign in with Google"}
            </Button>

            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or</span></div>
            </div>

            <Button className="w-full flex items-center gap-3" size="lg" variant="outline" disabled={oauthBusy} onClick={() => switchMode("signin")}>
              <Mail className="h-5 w-5 shrink-0" />
              Sign in with email
            </Button>

            <p className="text-center text-sm text-muted-foreground pt-1">
              No account yet?{" "}
              <button type="button" onClick={() => switchMode("signup")} className="text-primary hover:underline font-medium">
                Create account
              </button>
            </p>
          </div>
        )}

        {/* ── Email sign-in form ─────────────────────────────────────────── */}
        {mode === "signin" && (
          <form onSubmit={handleSignIn} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required autoFocus autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={emailBusy}>
              {emailBusy ? "Signing in…" : "Sign in"}
            </Button>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <button type="button" onClick={() => switchMode("forgot")} className="hover:text-foreground hover:underline">
                Forgot password?
              </button>
              <button type="button" onClick={() => switchMode("signup")} className="text-primary hover:underline font-medium">
                Create account
              </button>
            </div>
          </form>
        )}

        {/* ── Forgot password form ───────────────────────────────────────── */}
        {mode === "forgot" && (
          <form onSubmit={handleForgotPassword} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="forgot-email">Email</Label>
              <Input id="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required autoFocus autoComplete="email" />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={emailBusy}>
              {emailBusy ? "Sending…" : "Send reset link"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Remembered it?{" "}
              <button type="button" onClick={() => switchMode("signin")} className="text-primary hover:underline font-medium">
                Sign in
              </button>
            </p>
          </form>
        )}

        {/* ── Email sign-up form ─────────────────────────────────────────── */}
        {mode === "signup" && (
          <form onSubmit={handleSignUp} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe" autoFocus autoComplete="name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-email">Email</Label>
              <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-password">Password <span className="text-muted-foreground font-normal">(min. 8 characters)</span></Label>
              <div className="relative">
                <Input id="signup-password" type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="" required minLength={8} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={emailBusy}>
              {emailBusy ? "Creating account…" : "Create account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button type="button" onClick={() => switchMode("signin")} className="text-primary hover:underline font-medium">
                Sign in
              </button>
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
