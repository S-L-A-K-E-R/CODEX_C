import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppErrorBoundary } from "./components/SiteStatus.tsx";
import "./styles.css";
import { LanguageProvider } from "./i18n/Language.tsx";
import { ThemeProvider } from "./theme/Theme.tsx";
createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <ThemeProvider>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </ThemeProvider>
  </LanguageProvider>,
);
