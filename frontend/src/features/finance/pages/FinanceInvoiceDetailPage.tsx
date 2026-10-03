import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useFinanceStore, formatCurrency, voidInvoice, issueCreditNote, sendInvoiceReminder } from "../financeStore";
import { InvoicePreview } from "../components/InvoicePreview";
import { RecordPaymentModal } from "../components/RecordPaymentModal";
import { AdminPinDialog } from "@/components/shared/AdminPinDialog";
import { ReasonDialog } from "@/components/shared/ReasonDialog";
import { PeriodLockedBanner } from "../components/PeriodLockedBanner";
import { PeriodLockModal } from "../components/PeriodLockModal";
import { useAuth } from "@/app/providers/AuthProvider";
import { useGo } from "@/app/router/links";
import { formatINR } from "@/components/shared/Money";
import {
  ArrowLeft,
  Printer,
  Mail,
  RotateCcw,
  Ban,
  FileSignature,
  CreditCard,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ShieldCheck,
  ShieldAlert,
  MessageSquare,
  History,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { PageProps } from "@/types/common";

export default function FinanceInvoiceDetailPage({ params }: PageProps) {
  const go = useGo();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const { invoices } = useFinanceStore();
  const invoiceId = params?.["id"];

  const invoice = useMemo(() => {
    return invoices.find((i) => i.id === invoiceId || i.invoiceNumber === invoiceId) || invoices[0];
  }, [invoices, invoiceId]);

  // Dialog States
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isVoidDialogOpen, setIsVoidDialogOpen] = useState(false);
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false);
  const [creditNoteAmount, setCreditNoteAmount] = useState("");
  const [creditNoteReason, setCreditNoteReason] = useState("");
  const [adminPinModalOpen, setAdminPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"VOID" | "CREDIT_NOTE" | null>(null);

  if (!invoice) {
    return (
      <div className="p-8 text-center text-chalk">
        <p className="text-lg font-bold">Invoice not found</p>
        <Button variant="secondary" size="sm" onClick={() => go("/finance/invoices")} className="mt-4">
          Back to Invoices
        </Button>
      </div>
    );
  }

  const isOverdue =
    invoice.status === "OVERDUE" ||
    (invoice.status !== "PAID" &&
      invoice.status !== "VOID" &&
      new Date(invoice.dueDate).getTime() < Date.now());

  // Handle Void
  const handleStartVoid = () => {
    if (isAdmin) {
      setIsVoidDialogOpen(true);
    } else {
      setPendingAction("VOID");
      setAdminPinModalOpen(true);
    }
  };

  const handleConfirmVoid = (reason: string, pin?: string) => {
    voidInvoice(invoice.id, reason, user?.name || "Administrator", pin);
  };

  // Handle Credit Note
  const handleStartCreditNote = () => {
    setCreditNoteAmount(String(invoice.balanceDue || invoice.totalAmount));
    setCreditNoteReason("");
    if (isAdmin) {
      setIsCreditNoteModalOpen(true);
    } else {
      setPendingAction("CREDIT_NOTE");
      setAdminPinModalOpen(true);
    }
  };

  const handleConfirmCreditNote = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(creditNoteAmount);
    if (!amount || amount <= 0) return;
    issueCreditNote(invoice.id, amount, creditNoteReason.trim() || "Customer billing adjustment", user?.name || "Administrator");
    setIsCreditNoteModalOpen(false);
  };

  const handleAdminPinSuccess = (reason: string, pin?: string) => {
    setAdminPinModalOpen(false);
    if (pendingAction === "VOID") {
      voidInvoice(invoice.id, reason, user?.name || "Staff via Admin Override", pin);
    } else if (pendingAction === "CREDIT_NOTE") {
      const amount = invoice.balanceDue || invoice.totalAmount;
      issueCreditNote(invoice.id, amount, reason, user?.name || "Staff via Admin Override", pin);
    }
    setPendingAction(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => go("/finance/invoices")}
          className="flex items-center gap-2 text-xs font-semibold text-chalk/70 hover:text-chalk transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to Invoices
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5"
          >
            <Printer className="size-3.5" /> Download / Print PDF
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => sendInvoiceReminder(invoice.id, "EMAIL")}
            className="gap-1.5"
          >
            <Mail className="size-3.5" /> Send Email
          </Button>

          {invoice.status !== "PAID" && invoice.status !== "VOID" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsRecordPaymentOpen(true)}
              className="gap-1.5"
            >
              <CreditCard className="size-3.5" /> Record Payment
            </Button>
          )}
        </div>
      </div>

      <PeriodLockedBanner />
      <PeriodLockModal />

      {/* Main 2-Column Layout: Left Paper Invoice, Right Actions & Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Authentic White Paper Invoice Preview */}
        <div className="lg:col-span-8">
          <InvoicePreview invoice={invoice} />
        </div>

        {/* Right Column: Actions, Timeline, Reminders, Payments */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status & Balance Card */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-chalk/10 pb-3">
              <div>
                <span className="text-[11px] font-semibold uppercase text-chalk/60">Status</span>
                <div className="flex items-center gap-2 mt-1">
                  <StatusPill
                    tone={
                      invoice.status === "PAID"
                        ? "success"
                        : invoice.status === "OVERDUE"
                        ? "danger"
                        : invoice.status === "PARTIAL"
                        ? "warning"
                        : invoice.status === "VOID"
                        ? "neutral"
                        : "info"
                    }
                    className="capitalize text-xs font-semibold"
                  >
                    {invoice.status}
                  </StatusPill>
                  {isOverdue && invoice.status !== "PAID" && (
                    <span className="inline-flex items-center gap-1 rounded-pill bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/40">
                      <AlertTriangle className="size-3" /> Overdue
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-semibold uppercase text-chalk/60">Balance Due</span>
                <p
                  className={cn(
                    "text-xl font-bold font-mono mt-0.5",
                    invoice.balanceDue > 0 ? "text-rose-400" : "text-emerald-400"
                  )}
                >
                  {formatCurrency(invoice.balanceDue)}
                </p>
              </div>
            </div>

            {/* Overdue Action Quick Bar */}
            {isOverdue && invoice.status !== "PAID" && invoice.status !== "VOID" && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs space-y-2">
                <p className="font-semibold text-rose-200 flex items-center gap-1.5">
                  <Clock className="size-3.5" /> Overdue Notice Pending
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => sendInvoiceReminder(invoice.id, "EMAIL")}
                    className="h-7 text-xs gap-1 border-rose-500/40 hover:bg-rose-500/20"
                  >
                    <Mail className="size-3" /> Email Reminder
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => sendInvoiceReminder(invoice.id, "WHATSAPP")}
                    className="h-7 text-xs gap-1 border-rose-500/40 hover:bg-rose-500/20"
                  >
                    <MessageSquare className="size-3" /> WhatsApp
                  </Button>
                </div>
              </div>
            )}

            {/* Admin Actions: Void & Credit Note */}
            {invoice.status !== "VOID" && (
              <div className="border-t border-chalk/10 pt-3 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-chalk/50 flex items-center gap-1">
                  <ShieldCheck className="size-3 text-volt-400" /> Accounting Actions
                  {!isAdmin && <span className="text-warning font-normal">(Admin PIN Required)</span>}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleStartCreditNote}
                    className="h-8 text-xs gap-1.5 flex-1"
                  >
                    <FileSignature className="size-3.5 text-purple-400" />
                    Credit Note
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleStartVoid}
                    className="h-8 text-xs gap-1.5 flex-1"
                  >
                    <Ban className="size-3.5" />
                    Void (Retain #)
                  </Button>
                </div>
              </div>
            )}

            {/* Void Notice if already voided */}
            {invoice.status === "VOID" && (
              <div className="rounded-xl border border-chalk/14 bg-court-700/60 p-3.5 text-xs text-chalk/80 space-y-1">
                <p className="font-semibold text-rose-400">Invoice Voided (Gap-Free Preserved)</p>
                <p className="text-[11px] text-chalk/60">Reason: {invoice.voidReason || "Administrative void"}</p>
                <p className="text-[10px] text-chalk/50 font-mono">By: {invoice.voidedBy}</p>
              </div>
            )}
          </Card>

          {/* Payments Applied */}
          <Card className="p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-chalk/70 flex items-center gap-2">
              <CreditCard className="size-3.5 text-volt-400" /> Payments Applied ({invoice.paymentsApplied.length})
            </h4>

            {invoice.paymentsApplied.length === 0 ? (
              <p className="text-xs text-chalk/50 italic py-2">No payments applied yet.</p>
            ) : (
              <div className="space-y-2">
                {invoice.paymentsApplied.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center rounded-lg bg-court-700/60 p-2.5 text-xs border border-chalk/8"
                  >
                    <div>
                      <span className="font-mono font-bold text-volt-400">{p.paymentId}</span>
                      <p className="text-[11px] text-chalk/60 font-mono">
                        {p.method} • {p.ref}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatINR(p.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Credit Notes Applied */}
          {invoice.creditNotes.length > 0 && (
            <Card className="p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-chalk/70 flex items-center gap-2">
                <FileSignature className="size-3.5 text-purple-400" /> Credit Notes Applied (
                {invoice.creditNotes.length})
              </h4>
              <div className="space-y-2">
                {invoice.creditNotes.map((cn) => (
                  <div
                    key={cn.id}
                    className="rounded-lg bg-court-700/60 p-2.5 text-xs border border-purple-500/20 space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-purple-300">{cn.creditNoteNumber}</span>
                      <span className="font-mono font-bold text-purple-300">{formatINR(cn.amount)}</span>
                    </div>
                    <p className="text-[11px] text-chalk/70">{cn.reason}</p>
                    <p className="text-[10px] text-chalk/50 font-mono">Approved: {cn.approvedBy}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Reminder History */}
          {invoice.reminderHistory.length > 0 && (
            <Card className="p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-chalk/70 flex items-center gap-2">
                <Send className="size-3.5 text-info" /> Reminder Dispatch History
              </h4>
              <div className="space-y-2">
                {invoice.reminderHistory.map((rem) => (
                  <div
                    key={rem.id}
                    className="rounded-lg bg-court-700/40 p-2.5 text-xs border border-chalk/8 space-y-1"
                  >
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-semibold text-info">{rem.channel} Sent</span>
                      <span className="text-chalk/50">{new Date(rem.sentAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[11px] text-chalk/70">{rem.messageSnippet}</p>
                    <span className="inline-block rounded bg-court-800 px-1.5 py-0.5 text-[10px] text-chalk/50">
                      Delivered to {rem.sentTo}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Audit Timeline */}
          <Card className="p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-chalk/70 flex items-center gap-2">
              <History className="size-3.5 text-volt-400" /> Invoice Audit Timeline
            </h4>
            <div className="space-y-3 relative pl-3 border-l border-chalk/14 ml-1.5">
              {invoice.timeline.map((ev) => (
                <div key={ev.id} className="relative text-xs space-y-0.5">
                  <div className="absolute -left-[19px] top-1 size-2 rounded-full bg-volt-400" />
                  <p className="font-semibold text-chalk">{ev.title}</p>
                  {ev.note && <p className="text-[11px] text-chalk/70">{ev.note}</p>}
                  <p className="text-[10px] text-chalk/50 font-mono">
                    {new Date(ev.timestamp).toLocaleString("en-IN")} • {ev.actor}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        preselectedInvoiceId={invoice.invoiceNumber}
      />

      {/* Admin PIN Dialog for Staff */}
      <AdminPinDialog
        isOpen={adminPinModalOpen}
        onClose={() => {
          setAdminPinModalOpen(false);
          setPendingAction(null);
        }}
        onConfirm={handleAdminPinSuccess}
        title={
          pendingAction === "VOID"
            ? "Admin Authorization Required to Void Invoice"
            : "Admin Authorization Required for Credit Note"
        }
        description="This action alters the official financial records. A manager/admin PIN (1234 or 9999) and audit justification are required."
      />

      {/* Direct Admin Void Reason Dialog */}
      <ReasonDialog
        isOpen={isVoidDialogOpen}
        onClose={() => setIsVoidDialogOpen(false)}
        onConfirm={handleConfirmVoid}
        title={`Void Invoice ${invoice.invoiceNumber}`}
        description="Voiding will cancel this invoice while strictly retaining the sequential number for statutory GST audit compliance. Please record reason."
        actionLabel="Confirm Void Invoice"
      />

      {/* Direct Admin Credit Note Modal */}
      <Modal
        isOpen={isCreditNoteModalOpen}
        onClose={() => setIsCreditNoteModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <FileSignature className="size-4 text-purple-400" />
            <span>Issue Credit Note for {invoice.invoiceNumber}</span>
          </div>
        }
        maxWidth="md"
      >
        <form onSubmit={handleConfirmCreditNote} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-chalk/80 mb-1">
              Credit Note Amount (INR)
            </label>
            <Input
              type="number"
              min="1"
              step="any"
              value={creditNoteAmount}
              onChange={(e) => setCreditNoteAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-chalk/80 mb-1">Audit Reason / Justification</label>
            <Input
              placeholder="e.g. Unutilized court hours refund / Corporate contract adjustment"
              value={creditNoteReason}
              onChange={(e) => setCreditNoteReason(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-chalk/10">
            <Button type="button" variant="secondary" onClick={() => setIsCreditNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Issue Credit Note
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
