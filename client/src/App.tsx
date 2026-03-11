import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { MdbProvider } from "./contexts/MdbContext";
import Landing from "./pages/Landing";
import Builder from "./pages/Builder";
import AuthCallback from "./pages/AuthCallback";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/builder" component={Builder} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <MdbProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </MdbProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
