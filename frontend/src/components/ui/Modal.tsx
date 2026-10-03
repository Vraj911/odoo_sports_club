import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const maxWidths = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "md",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-navy-950/70 backdrop-blur-md"
          />

          {/* Dialog Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={cn(
              "relative z-10 w-full overflow-hidden rounded-[24px] border border-chalk/18 bg-court-600 shadow-2xl text-chalk",
              maxWidths[maxWidth]
            )}
          >
            {(title || subtitle) && (
              <div className="flex items-start justify-between border-b border-chalk/14 px-6 py-5">
                <div>
                  {title && <h2 className="text-xl font-semibold text-chalk">{title}</h2>}
                  {subtitle && <p className="mt-1 text-xs text-chalk/70">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="rounded-pill p-1.5 text-chalk/70 hover:bg-chalk/10 hover:text-chalk transition-colors"
                  aria-label="Close modal"
                >
                  <X className="size-5" />
                </button>
              </div>
            )}

            <div className="p-6">{children}</div>

            {footer && (
              <div className="flex items-center justify-end gap-3 border-t border-chalk/14 bg-court-700/50 px-6 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
