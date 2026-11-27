import { useCallback, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { LoaderCircle, CircleCheck, CircleAlert, X, type LucideIcon } from "lucide-react";
import { ToastContext, type Toast, type ToastHandler, type ToastType } from "./toast-context";

const VARIANTS = {
  primary:
    "bg-flame-500 text-white hover:bg-flame-600 shadow-[0_6px_16px_-6px_rgba(247,147,30,0.7)]",
  navy: "bg-navy-900 text-white hover:bg-navy-800",
  ghost: "bg-transparent text-navy-900 hover:bg-navy-50",
  outline: "border border-line bg-white text-navy-900 hover:border-navy-700/40 hover:bg-navy-50",
  danger: "bg-white border border-red-200 text-red-700 hover:bg-red-50",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  loading?: boolean;
};

export function Button({
  variant = "primary",
  loading = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition
        active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Spinner({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted" role="status">
      <LoaderCircle className="size-5 animate-spin text-flame-500" /> {label}
    </div>
  );
}

type FieldProps = {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  children: ReactNode;
  required?: boolean | undefined;
};

export function Field({ label, error, hint, children, required }: FieldProps) {
  return (
    <label className="block">
      <span className="label">
        {label} {required && <span className="text-flame-600">*</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-navy-50 text-navy-700">
          <Icon className="size-7" />
        </div>
      )}
      <h3 className="text-lg font-bold text-navy-900">{title}</h3>
      <div className="mt-1 max-w-md text-sm text-muted">{children}</div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="rise max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-lg sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold text-navy-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-navy-50"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push: ToastHandler = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rise pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${t.type === "error" ? "bg-red-600" : "bg-navy-900"}`}
          >
            {t.type === "error" ? (
              <CircleAlert className="size-4" />
            ) : (
              <CircleCheck className="size-4 text-flame-400" />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
