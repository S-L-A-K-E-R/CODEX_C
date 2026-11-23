import { Component, type ErrorInfo, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { useLanguage } from "../i18n/Language.tsx";
import { AsciiCMark } from "./shared.tsx";

type StatusKind = "loading" | "error";

export function reloadLatestVersion() {
  const address = new URL(window.location.href);
  address.searchParams.set("refresh", String(Date.now()));
  window.location.replace(address.toString());
}

export function SiteStatus({
  kind,
  title,
  message,
}: {
  kind: StatusKind;
  title: string;
  message: string;
}) {
  const { t } = useLanguage();

  return (
    <div className={"site-status site-status-" + kind} role={kind === "error" ? "alert" : "status"} aria-live="polite">
      <section className="site-status-card" aria-label="CODEX C">
        <header className="site-status-header">
          <span>CODEX <b>C</b></span>
          <small>LEARN BY MAKING</small>
        </header>
        <div className="site-status-body">
          <div className="site-status-art" aria-hidden="true">
            <AsciiCMark />
            <span>+ write<br />+ run<br />+ learn</span>
          </div>
          <div className="site-status-kicker">
            <span className="site-status-light" aria-hidden="true" />
            {kind === "loading" ? t("GETTING THINGS READY") : t("LOADING INTERRUPTED")}
          </div>
          <h1>{title}</h1>
          <p>{message}</p>
          {kind === "loading" ? (
            <div className="site-status-progress" role="progressbar" aria-label={t("Loading CODEX C")}>
              <span />
            </div>
          ) : (
            <button type="button" className="site-status-retry" onClick={reloadLatestVersion}>
              <RotateCcw size={16} aria-hidden="true" />
              {t("Reload the latest version")}
            </button>
          )}
          <p className="site-status-hint">
            {kind === "loading"
              ? t("Your lessons and progress will be here shortly.")
              : t("Reloading won't erase progress saved in this browser.")}
          </p>
        </div>
        <footer className="site-status-footer">
          <span>{"{ hello_world.c }"}</span>
          <span>CODEX C / 01</span>
        </footer>
      </section>
    </div>
  );
}

function AppFailureScreen() {
  const { t } = useLanguage();
  return (
    <SiteStatus
      kind="error"
      title={t("A little detour on the way.")}
      message={t("Something went wrong while opening this page. Reload to try again.")}
    />
  );
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("CODEX C: unexpected rendering error", error, info.componentStack);
  }

  render() {
    return this.state.failed ? <AppFailureScreen /> : this.props.children;
  }
}
