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
  const { signInWithMicrosoft, signInWithGoogle } = useAuth();
  const [loadingProvider, setLoadingProvider] = useState<"microsoft" | "google" | null>(null);

  const handleMicrosoft = async () => {
    setLoadingProvider("microsoft");
    const { error } = await signInWithMicrosoft();
    if (error) {
      toast.error("Sign in failed", { description: error });
      setLoadingProvider(null);
    }
    // On success the browser redirects to Microsoft — no need to close dialog
  };

  const handleGoogle = async () => {
    setLoadingProvider("google");
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error("Sign in failed", { description: error });
      setLoadingProvider(null);
    }
    // On success the browser redirects to Google — no need to close dialog
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">Sign in to MDB Builder</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Use your Microsoft or Google account to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <Button
            className="w-full flex items-center gap-3"
            size="lg"
            variant="outline"
            disabled={loadingProvider !== null}
            onClick={handleMicrosoft}
          >
            {loadingProvider === "microsoft" ? (
              <span className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin shrink-0" />
            ) : (
              <svg viewBox="0 0 21 21" className="h-5 w-5 shrink-0" aria-hidden="true">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
            )}
            {loadingProvider === "microsoft" ? "Redirecting..." : "Sign in with Microsoft"}
          </Button>

          <Button
            className="w-full flex items-center gap-3"
            size="lg"
            variant="outline"
            disabled={loadingProvider !== null}
            onClick={handleGoogle}
          >
            {loadingProvider === "google" ? (
              <span className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin shrink-0" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.86c2.26-2.08 3.58-5.14 3.58-8.64z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.86-3c-1.07.72-2.44 1.14-4.07 1.14-3.13 0-5.78-2.11-6.73-4.95H1.28v3.11A12 12 0 0 0 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.55.37-2.28V6.61H1.28A12 12 0 0 0 0 12c0 1.93.46 3.76 1.28 5.39l3.99-3.11z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.77c1.76 0 3.34.61 4.58 1.81l3.43-3.43C17.95 1.2 15.24 0 12 0A12 12 0 0 0 1.28 6.61l3.99 3.11c.95-2.84 3.6-4.95 6.73-4.95z"
                />
              </svg>
            )}
            {loadingProvider === "google" ? "Redirecting..." : "Sign in with Google"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
