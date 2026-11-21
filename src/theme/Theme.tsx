import {
  createContext,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Check, ChevronDown, Palette } from "lucide-react";
import { useLanguage } from "../i18n/Language.tsx";

// The original C logo's three blues are #659AD2, #00599C, and #004482.
// Each palette has three related tones; the neutral UI is colored via --theme-hue.
export const ACCENT_THEMES = {
  blue:   { hue: 210, light: "#659AD2", main: "#00599C", dark: "#004482", onLight: "#102C49" },
  green:  { hue: 102, light: "#83CD48", main: "#56B436", dark: "#348E38", onLight: "#19320F" },
  yellow: { hue: 49,  light: "#F0FB43", main: "#FFE600", dark: "#FFBC00", onLight: "#393000" },
  orange: { hue: 29,  light: "#FFAB00", main: "#FF8800", dark: "#FF5B00", onLight: "#392100" },
  red:    { hue: 359, light: "#FF5859", main: "#FD2F30", dark: "#991212", onLight: "#400B10" },
  pink:   { hue: 349, light: "#FFBBBB", main: "#DF8A8A", dark: "#E06773", onLight: "#4B1D30" },
  purple: { hue: 317, light: "#D98AB5", main: "#975D8E", dark: "#873B70", onLight: "#32152C" },
  maroon: { hue: 322, light: "#AF1F72", main: "#7A1354", dark: "#4D0834", onLight: "#FFFFFF" },
  gray:   { hue: 230, light: "#707891", main: "#51587B", dark: "#414359", onLight: "#FFFFFF" },
} as const;

export type AccentTheme = keyof typeof ACCENT_THEMES;
const choices = Object.keys(ACCENT_THEMES) as AccentTheme[];
const preference = "codex-c:accent-theme";
const isAccentTheme = (value: unknown): value is AccentTheme =>
  typeof value === "string" && Object.hasOwn(ACCENT_THEMES, value);

function initialTheme(): AccentTheme {
  try {
    const saved = localStorage.getItem(preference);
    if (isAccentTheme(saved)) return saved;
  } catch {
    // The chooser remains usable even if storage is unavailable.
  }
  return "blue";
}

const ThemeContext = createContext<{
  theme: AccentTheme;
  setTheme: (theme: AccentTheme) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setCurrent] = useState<AccentTheme>(initialTheme);

  useEffect(() => {
    const root = document.documentElement;
    const colors = ACCENT_THEMES[theme];
    root.dataset.accentTheme = theme;
    root.style.setProperty("--theme-hue", String(colors.hue));
    root.style.setProperty("--accent-light", colors.light);
    root.style.setProperty("--accent-main", colors.main);
    root.style.setProperty("--accent-dark", colors.dark);
    root.style.setProperty("--accent-on-light", colors.onLight);
  }, [theme]);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === preference)
        setCurrent(isAccentTheme(event.newValue) ? event.newValue : "blue");
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  function setTheme(value: AccentTheme) {
    setCurrent(value);
    try {
      localStorage.setItem(preference, value);
    } catch {
      // In-tab selection still works.
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAccentTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("ThemeProvider is required");
  return context;
}

export function ThemeSwitch() {
  const { t } = useLanguage();
  const { theme, setTheme } = useAccentTheme();
  return (
    <label className="theme-switch">
      <Palette size={15} aria-hidden="true" />
      <span
        className="theme-switch-dot"
        style={{ background: ACCENT_THEMES[theme].light }}
        aria-hidden="true"
      />
      <span className="theme-switch-text">{t(theme[0].toUpperCase() + theme.slice(1))}</span>
      <ChevronDown size={13} aria-hidden="true" />
      <select
        aria-label={t("Website accent color")}
        value={theme}
        onChange={(event) => {
          if (isAccentTheme(event.target.value)) setTheme(event.target.value);
        }}
      >
        {choices.map((choice) => (
          <option key={choice} value={choice}>
            {t(choice[0].toUpperCase() + choice.slice(1))}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ThemePalette() {
  const { t } = useLanguage();
  const { theme, setTheme } = useAccentTheme();
  return (
    <fieldset className="theme-picker">
      <legend>{t("Website accent color")}</legend>
      <div className="theme-options">
        {choices.map((choice) => {
          const colors = ACCENT_THEMES[choice];
          const label = t(choice[0].toUpperCase() + choice.slice(1));
          return (
            <button
              type="button"
              className={"theme-option" + (theme === choice ? " selected" : "")}
              key={choice}
              aria-label={label}
              aria-pressed={theme === choice}
              onClick={() => setTheme(choice)}
              style={
                {
                  "--swatch-light": colors.light,
                  "--swatch-main": colors.main,
                  "--swatch-dark": colors.dark,
                } as CSSProperties
              }
            >
              <span className="theme-option-preview" aria-hidden="true" />
              <span className="theme-option-label">
                {label}
                {theme === choice && <Check size={16} aria-hidden="true" />}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
