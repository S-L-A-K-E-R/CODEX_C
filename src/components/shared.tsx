import { useEffect, useRef, type ReactNode } from "react";
import { X, Check, ArrowUpRight, Code2 } from "lucide-react";
export const go = (route: string) => {
  location.hash = route;
};
export function Brand() {
  return (
    <a className="brand" href="#path" aria-label="CODEX C home">
      <span className="brand-mark">
        <Code2 size={24} />
      </span>
      <span>
        CODEX <b>C</b>
        <small>LEARN BY MAKING</small>
      </span>
    </a>
  );
}
export function External({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a className="external" href={href} target="_blank" rel="noreferrer">
      {children}
      <ArrowUpRight size={14} />
    </a>
  );
}
export function Badge({ kind }: { kind: string }) {
  return (
    <span className={"badge " + kind}>
      {kind === "core"
        ? "Core path"
        : kind === "gold"
          ? "Gold challenge"
          : kind === "optional"
            ? "Side quest"
            : kind}
    </span>
  );
}
export function ProgressBar({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
    >
      <span style={{ width: Math.max(0, Math.min(100, value)) + "%" }} />
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      className="modal"
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <header>
        <h2>{title}</h2>
        <button
          className="icon-btn"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function download(
  name: string,
  text: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function Done({ text = "Completed" }: { text?: string }) {
  return (
    <span className="done">
      <Check size={14} />
      {text}
    </span>
  );
}
