import * as React from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

function getSystemPreference(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "urbanbloom-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);

  const applyThemeClass = React.useCallback((nextTheme: Theme) => {
    const root = document.documentElement;
    const resolved = nextTheme === "system" ? getSystemPreference() : nextTheme;
    if (resolved === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  const setTheme = React.useCallback(
    (next: Theme) => {
      setThemeState(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {}
      if (typeof document !== "undefined") {
        applyThemeClass(next);
      }
    },
    [applyThemeClass, storageKey]
  );

  React.useEffect(() => {
    // Initialize from storage or default
    try {
      const stored = localStorage.getItem(storageKey) as Theme | null;
      const initial = stored ?? defaultTheme;
      setThemeState(initial);
      applyThemeClass(initial);
    } catch {
      applyThemeClass(defaultTheme);
    }

    // Listen for system changes when in system mode
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      setThemeState((current) => {
        if (current === "system") {
          applyThemeClass("system");
        }
        return current;
      });
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [applyThemeClass, defaultTheme, storageKey]);

  const value = React.useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
