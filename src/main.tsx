import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles.css";
import { LanguageProvider } from "./i18n/Language.tsx";
import { ThemeProvider } from "./theme/Theme.tsx";
createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </LanguageProvider>,
);
