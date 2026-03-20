import { useEffect } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onDismiss: () => void;
}

export function Toast({ message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 2000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const styles =
    type === "success"
      ? "bg-emerald-900/95 border-emerald-600 text-emerald-100"
      : "bg-red-900/95 border-red-600 text-red-100";

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-3">
      <div
        className={`w-full max-w-3xl px-6 py-3 rounded-lg border shadow-lg text-sm flex items-center justify-between gap-3 ${styles}`}
      >
        <span className="flex-1">{message}</span>
        <button
          onClick={onDismiss}
          className="shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
