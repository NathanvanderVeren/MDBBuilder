/**
 * Landing Page — Industrial Blueprint Design
 * Deep navy background, dot-grid pattern, BizzBit blue accents
 * Split hero: left text + right MDB mockup image
 */
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  FileText,
  Layers,
  Download,
  Shield,
  Zap,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import LoginDialog from "@/components/LoginDialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/109618846/j2CceLNvy3BzdkKcwBZVT6/mdb-preview-mockup-bu2sriEjQDjc3bPUT3wTMk.webp";
const FEATURE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/109618846/j2CceLNvy3BzdkKcwBZVT6/feature-sections-Em7wVMXftxJxiqWD28x568.webp";
const LOGO_PNG = "https://d2xsxph8kpxj0f.cloudfront.net/109618846/j2CceLNvy3BzdkKcwBZVT6/BizzBit%20Logo%20large_88d9f1c2.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0, 0, 0.2, 1] as const },
  }),
};

const features = [
  {
    icon: Layers,
    title: "Industry Templates",
    desc: "Start with pre-built MDB structures for Pressure Vessels, Offshore, Piping, and more.",
  },
  {
    icon: FileText,
    title: "Drag & Drop Builder",
    desc: "Add, remove, and reorder sections with an intuitive drag-and-drop interface.",
  },
  {
    icon: Download,
    title: "PDF Export with Bookmarks",
    desc: "Generate a professional PDF with cover page, table of contents, and clickable bookmarks.",
  },
  {
    icon: Shield,
    title: "No Data Required",
    desc: "This tool generates structure only. No project data, certificates, or sensitive information needed.",
  },
  {
    icon: Zap,
    title: "Completeness Checker",
    desc: "Real-time audit score that suggests missing sections to make your MDB audit-proof.",
  },
  {
    icon: CheckCircle,
    title: "Custom Branding",
    desc: "Upload your logo and choose your brand color for a fully branded MDB document.",
  },
];

export default function Landing() {
  const { isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [loginOpen, setLoginOpen] = useState(false);

  // Handle OAuth code landing on root URL (fallback if /auth/callback redirect fails)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const errorParam = params.get("error");

    if (errorParam) {
      const desc = params.get("error_description");
      toast.error("Sign-in failed", { description: desc ? decodeURIComponent(desc) : errorParam });
      window.history.replaceState({}, "", "/");
      return;
    }

    if (code) {
      window.history.replaceState({}, "", "/");
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) toast.error("Sign-in failed", { description: error.message });
        // On success, onAuthStateChange fires → isAuthenticated becomes true → redirects below
      });
    }
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/projects");
    }
  }, [loading, isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_PNG} alt="BizzBit" className="h-7" />
            <span className="text-muted-foreground text-sm font-[var(--font-mono)] tracking-wide">
              MDB Builder
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button asChild>
                  <a href="/projects">My Projects <ArrowRight className="ml-2 h-4 w-4" /></a>
                </Button>
                <Button variant="outline" onClick={logout}>Sign out</Button>
              </>
            ) : (
              <Button onClick={() => setLoginOpen(true)}>
                Sign in with Microsoft <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        {/* Dot grid background */}
        <div className="absolute inset-0 dot-grid opacity-40" />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text */}
            <div>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6"
              >
                <Zap className="h-3.5 w-3.5" />
                Free Tool — No credit card required
              </motion.div>

              <motion.h1
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={1}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6"
              >
                Build your{" "}
                <span className="text-primary">MDB structure</span>{" "}
                in minutes
              </motion.h1>

              <motion.p
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={2}
                className="text-lg text-muted-foreground leading-relaxed max-w-xl mb-8"
              >
                Create a professional Manufacturing Data Book format with
                industry-standard templates, drag-and-drop sections, and
                instant PDF export. Designed by QC engineers, for QC engineers.
              </motion.p>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={3}
                className="flex flex-col sm:flex-row gap-4"
              >
                {isAuthenticated ? (
                  <Button size="lg" asChild className="text-base px-8">
                    <a href="/projects">
                      My Projects <ArrowRight className="ml-2 h-5 w-5" />
                    </a>
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={() => setLoginOpen(true)}
                    className="text-base px-8"
                  >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 21 21" fill="none">
                      <rect width="10" height="10" fill="#F25022" />
                      <rect x="11" width="10" height="10" fill="#7FBA00" />
                      <rect y="11" width="10" height="10" fill="#00A4EF" />
                      <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
                    </svg>
                    Sign in with Microsoft
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 bg-transparent"
                  onClick={() =>
                    document
                      .getElementById("features")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  See how it works
                </Button>
              </motion.div>

              <motion.p
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={4}
                className="mt-6 text-sm text-muted-foreground/70 flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                No project data required. Structure only. 100% safe.
              </motion.p>
            </div>

            {/* Right: MDB Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 40, rotateY: -8 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Glow behind image */}
                <div className="absolute -inset-4 bg-primary/10 rounded-2xl blur-3xl" />
                <img
                  src={HERO_IMG}
                  alt="Manufacturing Data Book Preview"
                  className="relative rounded-lg shadow-2xl shadow-primary/10 border border-border/50 w-full max-w-md mx-auto"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything you need to structure your MDB
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built with input from QC managers and document controllers across
              the engineering and manufacturing industry.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                custom={i}
                className="group relative p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:bg-card transition-all duration-300"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-28 relative">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <img
                src={FEATURE_IMG}
                alt="Modular MDB sections"
                className="rounded-xl border border-border/30 shadow-xl"
              />
            </motion.div>
            <div>
              <motion.h2
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={0}
                className="text-3xl sm:text-4xl font-bold mb-8"
              >
                Three steps to a professional MDB
              </motion.h2>
              {[
                {
                  step: "01",
                  title: "Choose a template",
                  desc: "Select an industry-specific template or start from scratch. Templates include all standard sections for your equipment type.",
                },
                {
                  step: "02",
                  title: "Customize your structure",
                  desc: "Add, remove, and reorder sections. Upload your logo and pick your brand color. The completeness checker guides you.",
                },
                {
                  step: "03",
                  title: "Export your MDB",
                  desc: "Download a professional PDF with cover page, table of contents, and bookmarks. Ready to share with your team or client.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i + 1}
                  className="flex gap-5 mb-8 last:mb-0"
                >
                  <div className="shrink-0 h-12 w-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-primary font-[var(--font-mono)] font-semibold text-sm">
                      {item.step}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 relative">
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to build your MDB?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Sign in with your Microsoft account and create a professional
              Manufacturing Data Book structure in minutes. Completely free.
            </p>
            {isAuthenticated ? (
              <Button size="lg" asChild className="text-base px-10">
                <a href="/projects">
                  My Projects <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => setLoginOpen(true)}
                className="text-base px-10"
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 21 21" fill="none">
                  <rect width="10" height="10" fill="#F25022" />
                  <rect x="11" width="10" height="10" fill="#7FBA00" />
                  <rect y="11" width="10" height="10" fill="#00A4EF" />
                  <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
                </svg>
                Get Started Free
              </Button>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={LOGO_PNG} alt="BizzBit" className="h-6" />
            <span className="text-muted-foreground text-sm">
              MDB Builder — A free tool by BizzBit
            </span>
          </div>
          <p className="text-muted-foreground/60 text-xs">
            &copy; {new Date().getFullYear()} BizzBit Development B.V. All rights reserved.
          </p>
        </div>
      </footer>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}
