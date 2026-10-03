import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  className,
}: DrawerProps) {
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
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-navy-950/70 backdrop-blur-md"
          />

          {/* Drawer Slide Panel */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className={cn(
                "w-screen max-w-[480px] flex flex-col border-l border-chalk/18 bg-court-600 shadow-2xl text-chalk",
                className
              )}
            >
              {(title || subtitle) && (
                <div className="flex items-start justify-between border-b border-chalk/14 px-6 py-5 shrink-0">
                  <div>
                    {title && <h2 className="text-xl font-semibold text-chalk">{title}</h2>}
                    {subtitle && <p className="mt-1 text-xs text-chalk/70">{subtitle}</p>}
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-pill p-1.5 text-chalk/70 hover:bg-chalk/10 hover:text-chalk transition-colors"
                    aria-label="Close drawer"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-6">{children}</div>

              {footer && (
                <div className="flex items-center justify-end gap-3 border-t border-chalk/14 bg-court-700/50 px-6 py-4 shrink-0">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
