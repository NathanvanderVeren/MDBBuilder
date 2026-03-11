/**
 * LoginDialog — Simulated Microsoft OAuth login
 * Industrial Blueprint design with GDPR-compliant opt-in
 */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValid = name.trim() && email.trim() && email.includes("@") && consent;

  const handleLogin = () => {
    if (!isValid) return;
    setLoading(true);
    // Simulate OAuth delay
    setTimeout(() => {
      login({ name: name.trim(), email: email.trim(), company: company.trim() });
      setLoading(false);
      onOpenChange(false);
      toast.success("Welcome to MDB Builder!", {
        description: `Signed in as ${email.trim()}`,
      });
      navigate("/builder");
    }, 800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="h-10 w-10 rounded-lg bg-[#00A4EF]/10 flex items-center justify-center">
              <svg className="h-5 w-5" viewBox="0 0 21 21" fill="none">
                <rect width="10" height="10" fill="#F25022" />
                <rect x="11" width="10" height="10" fill="#7FBA00" />
                <rect y="11" width="10" height="10" fill="#00A4EF" />
                <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
              </svg>
            </div>
            Sign in with Microsoft
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <p className="text-sm text-muted-foreground">
            Use your work email to get started. No password needed — we use
            Microsoft single sign-on for a seamless experience.
          </p>

          <div className="space-y-3">
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
              <Label htmlFor="email" className="text-sm mb-1.5 block">Work Email</Label>
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
          </div>

          {/* GDPR Consent — subtle but compliant */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
            <Checkbox
              id="consent"
              checked={consent}
              onCheckedChange={(c) => setConsent(c === true)}
              className="mt-0.5"
            />
            <label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
              I agree to the{" "}
              <span className="text-foreground underline underline-offset-2">
                Terms of Service
              </span>{" "}
              and give BizzBit permission to occasionally send me relevant tips
              about quality management and MDB best practices. You can
              unsubscribe at any time.
            </label>
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={!isValid || loading}
            onClick={handleLogin}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              "Continue"
            )}
          </Button>

          <p className="text-[11px] text-muted-foreground/50 text-center">
            This tool generates document structure only. No project data,
            certificates, or sensitive information is processed or stored.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
