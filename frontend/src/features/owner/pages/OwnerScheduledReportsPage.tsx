import { useState } from "react";
import { useGo } from "@/app/router/links";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useOwnerStore } from "../ownerStore";
import type { ScheduledReportRecord } from "../types";
import {
  CalendarClock,
  Plus,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Trash2,
  ArrowLeft,
  BellRing,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { toast } from "@/components/ui/Toast";

export default function OwnerScheduledReportsPage() {
  const go = useGo();
  const { scheduledReports, toggleScheduledReport } = useOwnerStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newFrequency, setNewFrequency] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("WEEKLY");
  const [newSendTime, setNewSendTime] = useState("Monday 08:00 IST");
  const [newRecipients, setNewRecipients] = useState("");
  const [newScope, setNewScope] = useState("Executive & Financial Performance");
  const [newFormat, setNewFormat] = useState<"PDF" | "CSV" | "EXCEL">("PDF");

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newRecipients.trim()) {
      toast.error("Please fill in all mandatory fields.");
      return;
    }

    const recipientsList = newRecipients.split(",").map((s) => s.trim()).filter(Boolean);

    toast.success(`Automated delivery scheduled for "${newTitle}"!`);
    setIsAddModalOpen(false);
    setNewTitle("");
    setNewRecipients("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => go("/owner")}
          className="gap-1 text-xs"
        >
          <ArrowLeft className="size-3.5" /> Back to Dashboard
        </Button>
      </div>

      <PageHeader
        title="Scheduled Automated Report Deliveries"
        subtitle="Configure automated email dispatches for daily shift closings, weekly utilisation digests, and monthly board packages (RPT-11)."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1.5 text-xs font-bold"
          >
            <Plus className="size-4" /> New Delivery Schedule
          </Button>
        }
      />

      {/* Scheduled Reports List */}
      <div className="space-y-4">
        {scheduledReports.map((sch) => (
          <Card key={sch.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-chalk">{sch.title}</h3>
                <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-volt-400/20 text-volt-400 border border-volt-400/40 font-mono">
                  {sch.frequency}
                </span>
                <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-court-700 text-chalk/70 border border-chalk/10 font-mono">
                  {sch.format}
                </span>
              </div>

              <p className="text-xs text-chalk/70">{sch.scope}</p>

              <div className="flex items-center gap-4 text-xs text-chalk/60 flex-wrap pt-1 font-mono">
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-volt-400" /> Dispatch: {sch.sendTime}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5 text-chalk/40" /> Recipients: {sch.recipients.join(", ")}
                </span>
                {sch.lastSentAt && (
                  <>
                    <span>·</span>
                    <span className="text-emerald-400">Last dispatched: {sch.lastSentAt}</span>
                  </>
                )}
              </div>
            </div>

            {/* Toggle switch & actions */}
            <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-chalk/10">
              <div className="flex items-center gap-2">
                <span className={cn("text-xs font-bold font-mono", sch.enabled ? "text-emerald-400" : "text-chalk/40")}>
                  {sch.enabled ? "Active" : "Paused"}
                </span>
                <button
                  type="button"
                  onClick={() => toggleScheduledReport(sch.id, !sch.enabled)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    sch.enabled ? "bg-volt-400" : "bg-court-700"
                  )}
                  aria-label="Toggle active status"
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-navy-950 shadow ring-0 transition duration-200 ease-in-out",
                      sch.enabled ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast.info(`Test dispatch sent for "${sch.title}" to ${sch.recipients[0]}`)}
                className="text-xs text-volt-400 hover:text-volt-300"
              >
                Send Test Now
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Schedule Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        maxWidth="md"
        title={
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-volt-400/20 text-volt-400">
              <CalendarClock className="size-4" />
            </div>
            <span>Configure Automated Report Delivery</span>
          </div>
        }
      >
        <form onSubmit={handleCreateSchedule} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-chalk/80">Report Title</label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Weekly Court Utilisation & Operations Digest"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-chalk/80">Frequency</label>
              <select
                value={newFrequency}
                onChange={(e) => setNewFrequency(e.target.value as any)}
                className="w-full h-12 rounded-xl bg-white/8 border border-white/18 text-chalk px-3 text-xs focus:border-volt-400 focus:outline-none"
              >
                <option value="DAILY" className="bg-navy-900 text-chalk">Daily (Shift End)</option>
                <option value="WEEKLY" className="bg-navy-900 text-chalk">Weekly (Mondays)</option>
                <option value="MONTHLY" className="bg-navy-900 text-chalk">Monthly (1st of Month)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-chalk/80">Attachment Format</label>
              <select
                value={newFormat}
                onChange={(e) => setNewFormat(e.target.value as any)}
                className="w-full h-12 rounded-xl bg-white/8 border border-white/18 text-chalk px-3 text-xs focus:border-volt-400 focus:outline-none"
              >
                <option value="PDF" className="bg-navy-900 text-chalk">PDF Document</option>
                <option value="EXCEL" className="bg-navy-900 text-chalk">Excel Workbook (.xlsx)</option>
                <option value="CSV" className="bg-navy-900 text-chalk">CSV File</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-chalk/80">Delivery Schedule Time</label>
            <Input
              value={newSendTime}
              onChange={(e) => setNewSendTime(e.target.value)}
              placeholder="e.g. Monday 07:00 IST or Daily 23:45 IST"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-chalk/80">
              Recipients (Comma-separated emails) <span className="text-danger">*</span>
            </label>
            <Input
              value={newRecipients}
              onChange={(e) => setNewRecipients(e.target.value)}
              placeholder="owner@championsclub.in, gm@championsclub.in"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-chalk/80">Report Scope & Description</label>
            <Input
              value={newScope}
              onChange={(e) => setNewScope(e.target.value)}
              placeholder="e.g. Daily Cash, POS, Court Bookings & Shift Float Z-Report"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-chalk/10">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Scheduled Delivery
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
