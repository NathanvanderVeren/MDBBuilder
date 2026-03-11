import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { signInWithMicrosoft } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleMicrosoft = async () => {
    setLoading(true);
    const { error } = await signInWithMicrosoft();
    if (error) {
      toast.error("Sign in failed", { description: error });
      setLoading(false);
    }
    // On success the browser redirects to Microsoft — no need to close dialog
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">Sign in to MDB Builder</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Use your Microsoft account to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <Button
            className="w-full flex items-center gap-3"
            size="lg"
            variant="outline"
            disabled={loading}
            onClick={handleMicrosoft}
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin shrink-0" />
            ) : (
              <svg viewBox="0 0 21 21" className="h-5 w-5 shrink-0" aria-hidden="true">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
            )}
            {loading ? "Redirecting..." : "Sign in with Microsoft"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
