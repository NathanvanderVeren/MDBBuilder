import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
const STORAGE_KEY = "theme";

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;

    if (switchable) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") return stored;
      return getSystemTheme();
    }
    return defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (switchable) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        localStorage.setItem(STORAGE_KEY, theme);
      }
    }
  }, [theme, switchable]);

  useEffect(() => {
    if (!switchable) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setTheme(media.matches ? "dark" : "light");

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [switchable]);

  const toggleTheme = switchable
    ? () => {
        const nextTheme = theme === "light" ? "dark" : "light";
        localStorage.setItem(STORAGE_KEY, nextTheme);
        setTheme(nextTheme);
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
