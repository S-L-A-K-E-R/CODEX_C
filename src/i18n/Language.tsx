import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ChevronDown } from "lucide-react";
import { courses } from "../data/curriculum.ts";
import { translate, type Language, type Values } from "./messages.ts";

const preference = "codex-c:language";
const isLanguage = (value: unknown): value is Language =>
  value === "en" || value === "fr";

function initialLanguage(): Language {
  try {
    const saved = localStorage.getItem(preference);
    if (isLanguage(saved)) return saved;
  } catch {
    /* The selector still works when browser storage is disabled. */
  }
  return (
    (navigator.languages || [navigator.language])
      .map((tag) => tag.split("-")[0])
      .find(isLanguage) ?? "en"
  );
}

const Context = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
  t: (message: string, values?: Values) => string;
  course: typeof courses.en;
} | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setCurrent] = useState(initialLanguage);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  useEffect(() => {
    const sync = (e: StorageEvent) => {
      if (e.key === preference && isLanguage(e.newValue))
        setCurrent(e.newValue);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const t = useCallback(
    (message: string, values?: Values) => translate(language, message, values),
    [language],
  );
  function setLanguage(value: Language) {
    setCurrent(value);
    try {
      localStorage.setItem(preference, value);
    } catch {
      /* Keep the in-tab selection. */
    }
  }
  return (
    <Context.Provider
      value={{ language, setLanguage, t, course: courses[language] }}
    >
      {children}
    </Context.Provider>
  );
}

export function useLanguage() {
  const context = useContext(Context);
  if (!context) throw new Error("Missing language provider");
  return context;
}

export function LanguageSwitch() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <label className="language-switch">
      <span className={"language-flag " + language} aria-hidden="true" />
      <span aria-hidden="true">{language.toUpperCase()}</span>
      <ChevronDown size={13} aria-hidden="true" />
      <select
        aria-label={t("Interface language")}
        value={language}
        onChange={(e) => {
          if (isLanguage(e.target.value)) setLanguage(e.target.value);
        }}
      >
        <option value="en" lang="en">
          English
        </option>
        <option value="fr" lang="fr">
          Français
        </option>
      </select>
    </label>
  );
}
