import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ThemePref = "light" | "dark" | "system";
export const THEME_KEY = "psi-theme";

interface ThemeValue {
  theme: ThemePref;
  resolved: "light" | "dark";
  setTheme: (t: ThemePref) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

function systemDark(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Runs before paint in the document head so the app never flashes the wrong theme. */
export const THEME_BOOT_SCRIPT = `(function(){try{var p=localStorage.getItem(${JSON.stringify(THEME_KEY)});var d=p==="dark"||((!p||p==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-theme",d?"dark":"light");}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePref>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("dark");

  const apply = useCallback((pref: ThemePref) => {
    const dark = pref === "dark" || (pref === "system" && systemDark());
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    setResolved(dark ? "dark" : "light");
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY) as ThemePref | null;
    const pref: ThemePref =
      stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    setThemeState(pref);
    apply(pref);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((window.localStorage.getItem(THEME_KEY) ?? "system") === "system") {
        apply("system");
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [apply]);

  const setTheme = useCallback(
    (next: ThemePref) => {
      setThemeState(next);
      window.localStorage.setItem(THEME_KEY, next);
      apply(next);
    },
    [apply],
  );

  const toggle = useCallback(() => {
    setTheme(resolved === "dark" ? "light" : "dark");
  }, [resolved, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
