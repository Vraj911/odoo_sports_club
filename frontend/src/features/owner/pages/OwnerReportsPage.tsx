import { useState } from "react";
import { useGo } from "@/app/router/links";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ExportMenu } from "../components/ExportMenu";
import { ShareLinkDialog } from "../components/ShareLinkDialog";
import { useOwnerStore, downloadCSV } from "../ownerStore";
import {
  FileBarChart,
  Search,
  Filter,
  DollarSign,
  Activity,
  Users,
  ShoppingBag,
  Share2,
  Calendar,
  Download,
  Eye,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { toast } from "@/components/ui/Toast";

interface ReportCatalogItem {
  id: string;
  category: "FINANCIAL" | "OPERATIONS" | "MEMBERSHIP" | "COMMERCIAL";
  title: string;
  description: string;
  cadence: string;
  lastGenerated: string;
  dataPoints: string[];
}

const REPORT_CATALOG: ReportCatalogItem[] = [
  {
    id: "REP-FIN-01",
    category: "FINANCIAL",
    title: "Consolidated P&L & Department Operating Margins",
    description: "Multi-department EBITDA summary matching the authorized financial general ledger.",
    cadence: "Monthly / On-Demand",
    lastGenerated: "03 Oct 2026, 18:30 IST",
    dataPoints: ["Courts Revenue", "F&B Bar Sales", "Pro Shop Gross", "Staff Payroll", "Utilities"],
  },
  {
    id: "REP-FIN-02",
    category: "FINANCIAL",
    title: "GST GSTR-1 Outward Supplies & GSTR-3B Tax Summary",
    description: "Statutory tax reconciliation across 18% court bookings, 5% F&B, and 12%/18% sports gear sales.",
    cadence: "Monthly",
    lastGenerated: "01 Oct 2026, 09:00 IST",
    dataPoints: ["CGST Collected", "SGST Collected", "Input Tax Credit (ITC)", "Net Payable"],
  },
  {
    id: "REP-OPS-01",
    category: "OPERATIONS",
    title: "Court Utilisation & Peak Capacity Analysis",
    description: "Hourly density heatmaps across 12 indoor/outdoor courts with sport-wise breakdown.",
    cadence: "Weekly / Real-Time",
    lastGenerated: "Today at 21:00 IST",
    dataPoints: ["Tennis 1-4", "Badminton 1-4", "Squash 1-2", "Padel 1-2", "No-Show %"],
  },
  {
    id: "REP-OPS-02",
    category: "OPERATIONS",
    title: "Social Play Fill Rates & Coach Session Yield",
    description: "Attendance efficiency, coach assignments, and participant yield for scheduled social mixers.",
    cadence: "Weekly",
    lastGenerated: "28 Sep 2026, 22:00 IST",
    dataPoints: ["Friday Night Padel", "Sunday Morning Tennis", "Coach Revenue Yield"],
  },
  {
    id: "REP-MEM-01",
    category: "MEMBERSHIP",
    title: "Member Retention, Tier Migration & Churn Audit",
    description: "Cohort retention analysis for Gold, Silver, and Bronze plans with 30-day expiry forecasts.",
    cadence: "Monthly",
    lastGenerated: "02 Oct 2026, 14:15 IST",
    dataPoints: ["Gold VIP Retention", "Silver Upgrades", "Churned Accounts", "Dues Aging"],
  },
  {
    id: "REP-COM-01",
    category: "COMMERCIAL",
    title: "Pro Shop Inventory Velocity & Gross Margin ROI",
    description: "Stock turnover ratio, dead inventory alerts, and restock lead time analysis.",
    cadence: "Bi-Weekly",
    lastGenerated: "30 Sep 2026, 20:00 IST",
    dataPoints: ["Rackets Velocity", "Ball Cans Turnover", "Apparel Margins", "Reorder Triggers"],
  },
];

export default function OwnerReportsPage() {
  const go = useGo();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const filteredReports = REPORT_CATALOG.filter((r) => {
    if (selectedCategory !== "ALL" && r.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportReportCSV = (report: ReportCatalogItem) => {
    const headers = ["Report ID", "Report Title", "Category", "Cadence", "Last Generated", "Data Components"];
    const rows = [[report.id, report.title, report.category, report.cadence, report.lastGenerated, report.dataPoints.join("; ")]];
    downloadCSV(`ccms-${report.id.toLowerCase()}`, headers, rows);
    toast.success(`Exported CSV for "${report.title}"`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Reports & Governance Hub"
        subtitle="Comprehensive financial statements, operations capacity digests, and statutory audit exports (RPT-01..12)."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => go("/owner/scheduled-reports")}
              className="gap-1.5 text-xs text-chalk"
            >
              <Calendar className="size-3.5 text-volt-400" /> Scheduled Deliveries
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsShareModalOpen(true)}
              className="gap-1.5 text-xs font-bold"
            >
              <Share2 className="size-3.5" /> Share Report
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-chalk/40" />
            <Input
              placeholder="Search reports or metrics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-chalk/60 font-mono mr-1">Category:</span>
            {[
              { id: "ALL", label: "All Reports" },
              { id: "FINANCIAL", label: "Financial & Tax" },
              { id: "OPERATIONS", label: "Operations & Courts" },
              { id: "MEMBERSHIP", label: "Membership Base" },
              { id: "COMMERCIAL", label: "Pro Shop & F&B" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                  selectedCategory === cat.id
                    ? "bg-volt-400 text-ink-900 border-volt-400 font-bold"
                    : "bg-court-700/60 border-chalk/10 text-chalk/70 hover:text-chalk"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReports.map((report) => (
          <Card key={report.id} className="p-5 flex flex-col justify-between space-y-4 hover:border-chalk/25 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-court-700 px-2.5 py-0.5 text-[10px] font-bold text-volt-400 border border-chalk/10 font-mono">
                  {report.id} · {report.category}
                </span>
                <span className="text-[11px] text-chalk/50 font-mono">{report.cadence}</span>
              </div>

              <h3 className="text-base font-bold text-chalk leading-snug">{report.title}</h3>
              <p className="text-xs text-chalk/70 leading-relaxed">{report.description}</p>

              <div className="flex items-center gap-1.5 flex-wrap pt-2">
                {report.dataPoints.map((pt) => (
                  <span
                    key={pt}
                    className="rounded bg-court-700/50 px-2 py-0.5 text-[10px] font-mono text-chalk/70 border border-chalk/5"
                  >
                    {pt}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-chalk/10 flex items-center justify-between gap-2">
              <span className="text-[10px] text-chalk/40 font-mono">
                Updated: {report.lastGenerated}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    toast.info(`Snapshot loaded for "${report.title}"`);
                    go("/owner");
                  }}
                  className="gap-1 text-xs text-volt-400 hover:text-volt-300"
                >
                  <Eye className="size-3.5" /> View
                </Button>
                <ExportMenu
                  onExportCSV={() => handleExportReportCSV(report)}
                  reportTitle={report.title}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Share Dialog */}
      <ShareLinkDialog
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
