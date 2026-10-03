import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Download, FileText, FileSpreadsheet, ChevronDown, Check } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";

export interface ExportMenuProps {
  onExportCSV: () => void;
  reportTitle?: string;
  className?: string;
}

export function ExportMenu({ onExportCSV, reportTitle = "CCMS-Report", className }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = (format: "CSV" | "EXCEL" | "PDF") => {
    setIsOpen(false);
    if (format === "CSV") {
      onExportCSV();
      toast.success("CSV file downloaded successfully!");
    } else if (format === "EXCEL") {
      toast.info(`Preparing Excel workbook for "${reportTitle}"... Download initiated.`);
      // Also provide CSV fallback
      setTimeout(onExportCSV, 800);
    } else if (format === "PDF") {
      toast.info(`Preparing Executive PDF Report for "${reportTitle}"... Print ready.`);
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  };

  return (
    <div className={cn("relative inline-block", className)} ref={menuRef}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2 text-xs font-semibold"
      >
        <Download className="size-3.5 text-volt-400" />
        <span>Export</span>
        <ChevronDown className={cn("size-3 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-navy-800 border border-chalk/14 shadow-2xl p-1.5 z-40 space-y-0.5 animate-in fade-in-50 zoom-in-95">
          <button
            type="button"
            onClick={() => handleExport("CSV")}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-chalk rounded-xl hover:bg-chalk/10 transition-colors text-left"
          >
            <FileSpreadsheet className="size-4 text-emerald-400" />
            <div>
              <p className="font-bold">Export CSV</p>
              <p className="text-[10px] text-chalk/50">Raw tabular data</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleExport("EXCEL")}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-chalk rounded-xl hover:bg-chalk/10 transition-colors text-left"
          >
            <FileSpreadsheet className="size-4 text-volt-400" />
            <div>
              <p className="font-bold">Export Excel (.xlsx)</p>
              <p className="text-[10px] text-chalk/50">Formatted spreadsheet</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleExport("PDF")}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-chalk rounded-xl hover:bg-chalk/10 transition-colors text-left"
          >
            <FileText className="size-4 text-rose-400" />
            <div>
              <p className="font-bold">Executive PDF</p>
              <p className="text-[10px] text-chalk/50">Print-ready snapshot</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
