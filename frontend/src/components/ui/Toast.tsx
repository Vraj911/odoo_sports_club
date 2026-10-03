import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string | undefined;
}

interface ToastContextType {
  toast: (type: ToastType, title: string, message?: string | undefined) => void;
  success: (title: string, message?: string | undefined) => void;
  error: (title: string, message?: string | undefined) => void;
  warning: (title: string, message?: string | undefined) => void;
  info: (title: string, message?: string | undefined) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let globalToastDispatch: ((item: { type: ToastType; title: string; message?: string }) => void) | null = null;

export interface ToastOptions {
  type?: ToastType;
  title: string;
  message?: string | undefined;
}

export const toast = (
  first: ToastType | ToastOptions | string,
  second?: string,
  third?: string
) => {
  if (!globalToastDispatch) return;
  if (typeof first === "object") {
    globalToastDispatch({
      type: first.type || "info",
      title: first.title,
      message: first.message,
    });
  } else if (typeof first === "string" && second !== undefined) {
    globalToastDispatch({
      type: first as ToastType,
      title: second,
      message: third,
    });
  } else if (typeof first === "string") {
    globalToastDispatch({
      type: "info",
      title: first,
      message: second,
    });
  }
};

toast.success = (title: string, message?: string) => toast("success", title, message);
toast.error = (title: string, message?: string) => toast("error", title, message);
toast.warning = (title: string, message?: string) => toast("warning", title, message);
toast.info = (title: string, message?: string) => toast("info", title, message);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message?: string | undefined) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  // Connect global dispatcher
  globalToastDispatch = useCallback(
    (item: { type: ToastType; title: string; message?: string }) => {
      showToast(item.type, item.title, item.message);
    },
    [showToast]
  );

  const success = useCallback((title: string, message?: string | undefined) => showToast("success", title, message), [showToast]);
  const error = useCallback((title: string, message?: string | undefined) => showToast("error", title, message), [showToast]);
  const warning = useCallback((title: string, message?: string | undefined) => showToast("warning", title, message), [showToast]);
  const info = useCallback((title: string, message?: string | undefined) => showToast("info", title, message), [showToast]);

  return (
    <ToastContext.Provider value={{ toast: showToast, success, error, warning, info }}>
      {children}
      {/* Toast Top Right Stack */}
      <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastCard key={t.id} toast={t} onClose={() => removeToast(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: () => {},
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
    };
  }
  return ctx;
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const barColors: Record<ToastType, string> = {
    success: "bg-success",
    error: "bg-danger",
    warning: "bg-warning",
    info: "bg-info",
  };

  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle2 className="size-5 text-success shrink-0" />,
    error: <AlertCircle className="size-5 text-danger shrink-0" />,
    warning: <AlertTriangle className="size-5 text-warning shrink-0" />,
    info: <Info className="size-5 text-info shrink-0" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="pointer-events-auto relative flex items-center overflow-hidden rounded-[16px] border border-chalk/14 bg-navy-800 p-4 shadow-2xl text-chalk gap-3"
    >
      {/* Left color bar */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", barColors[toast.type])} />

      <div className="pl-1">{icons[toast.type]}</div>

      <div className="flex-1 min-w-0 pr-2">
        <h4 className="text-sm font-semibold leading-snug">{toast.title}</h4>
        {toast.message && <p className="text-xs text-chalk/70 mt-0.5">{toast.message}</p>}
      </div>

      <button
        onClick={onClose}
        className="rounded-pill p-1 text-chalk/50 hover:bg-chalk/10 hover:text-chalk transition-colors"
      >
        <X className="size-4" />
      </button>
    </motion.div>
  );
}
