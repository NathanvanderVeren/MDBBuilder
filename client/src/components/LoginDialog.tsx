import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { signIn, signUp } = useAuth();
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid =
    email.trim() &&
    email.includes("@") &&
    password.length >= 6 &&
    (mode === "signin" || name.trim());

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          toast.error("Sign in failed", { description: error });
          return;
        }
        toast.success("Welcome back!");
        onOpenChange(false);
        navigate("/builder");
      } else {
        const { error } = await signUp(email.trim(), password, name.trim(), company.trim());
        if (error) {
          toast.error("Sign up failed", { description: error });
          return;
        }
        toast.success("Account created!", {
          description: "Check your email to confirm your account, then sign in.",
        });
        setMode("signin");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {mode === "signin" ? "Sign in to MDB Builder" : "Create an account"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2" onKeyDown={handleKeyDown}>
          {mode === "signup" && (
            <>
              <div>
                <Label htmlFor="name" className="text-sm mb-1.5 block">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John van der Berg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-input/50"
                />
              </div>
              <div>
                <Label htmlFor="company" className="text-sm mb-1.5 block">
                  Company <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="company"
                  placeholder="Your company name"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="bg-input/50"
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email" className="text-sm mb-1.5 block">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="j.vanderberg@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-input/50"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-sm mb-1.5 block">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-input/50"
            />
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={!isValid || loading}
            onClick={handleSubmit}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                {mode === "signin" ? "Signing in..." : "Creating account..."}
              </span>
            ) : (
              mode === "signin" ? "Sign in" : "Create account"
            )}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            {mode === "signin" ? (
              <>
                No account yet?{" "}
                <button
                  className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                  onClick={() => setMode("signup")}
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                  onClick={() => setMode("signin")}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
