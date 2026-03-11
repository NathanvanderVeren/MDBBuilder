import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <h1 className="text-6xl font-bold font-[var(--font-heading)] text-foreground mb-2">404</h1>
        <p className="text-muted-foreground text-lg mb-8">
          This page doesn't exist or has been moved.
        </p>
        <Button onClick={() => setLocation("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </div>
    </div>
  );
}
