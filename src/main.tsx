import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles.css";
import { LanguageProvider } from "./i18n/Language.tsx";
createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>,
);
