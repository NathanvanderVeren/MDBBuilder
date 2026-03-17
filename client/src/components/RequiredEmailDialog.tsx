import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function RequiredEmailDialog() {
  const { requiresEmailVerification, requestEmailVerification, refreshUser, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const normalizedEmail = useMemo(() => email.trim(), [email]);

  const handleSendVerification = async () => {
    if (!normalizedEmail) {
      toast.error("Email is required");
      return;
    }

    setSending(true);
    const { error } = await requestEmailVerification(normalizedEmail);
    setSending(false);

    if (error) {
      toast.error("Failed to send verification", { description: error });
      return;
    }

    setSentTo(normalizedEmail);
    toast.success("Verification email sent", {
      description: "Please check your inbox and verify your email address.",
    });
  };

  const handleCheckVerification = async () => {
    setChecking(true);
    const refreshedUser = await refreshUser();
    setChecking(false);

    if (!refreshedUser?.email) {
      toast.message("Email not verified yet", {
        description: "After clicking the verification link, return here and check again.",
      });
      return;
    }

    toast.success("Email verified");
  };

  return (
    <Dialog open={requiresEmailVerification} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-card border-border" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Email address required</DialogTitle>
          <DialogDescription>
            Your Microsoft account did not provide an email address. Enter your email to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="required-email">Email address</Label>
            <Input
              id="required-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
            />
          </div>

          {sentTo && (
            <p className="text-xs text-muted-foreground">
              Verification sent to <span className="font-medium text-foreground">{sentTo}</span>.
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => void logout()} disabled={sending || checking}>
              Sign out
            </Button>
            <Button variant="outline" onClick={handleCheckVerification} disabled={sending || checking}>
              {checking ? "Checking..." : "I've verified"}
            </Button>
            <Button onClick={handleSendVerification} disabled={sending || checking || !normalizedEmail}>
              {sending ? "Sending..." : sentTo ? "Resend verification" : "Send verification"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
