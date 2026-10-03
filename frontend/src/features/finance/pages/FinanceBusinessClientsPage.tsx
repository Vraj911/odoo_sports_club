import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  useFinanceStore,
  formatCurrency,
  generateConsolidatedInvoice,
} from "../financeStore";
import type { BusinessClient } from "../types";
import { PeriodLockedBanner } from "../components/PeriodLockedBanner";
import { PeriodLockModal } from "../components/PeriodLockModal";
import { useGo } from "@/app/router/links";
import { formatINR } from "@/components/shared/Money";
import {
  Briefcase,
  Building,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  Phone,
  Receipt,
  ShieldCheck,
  Sparkles,
  Users,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/cn";

export default function FinanceBusinessClientsPage() {
  const go = useGo();
  const { businessClients, invoices } = useFinanceStore();

  const [selectedClientId, setSelectedClientId] = useState<string>(
    businessClients[0]?.id || ""
  );
  const [isConsolidateModalOpen, setIsConsolidateModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("October 2026");

  const selectedClient = useMemo(() => {
    return (
      businessClients.find((c) => c.id === selectedClientId) ||
      businessClients[0]
    );
  }, [businessClients, selectedClientId]);

  // Client's past invoices
  const clientInvoices = useMemo(() => {
    if (!selectedClient) return [];
    return invoices.filter(
      (inv) =>
        inv.businessClientId === selectedClient.id ||
        (inv.customerGstin && inv.customerGstin === selectedClient.gstin)
    );
  }, [invoices, selectedClient]);

  const handleGenerateInvoice = () => {
    if (!selectedClient) return;
    const inv = generateConsolidatedInvoice(selectedClient.id, selectedMonth);
    if (inv) {
      setIsConsolidateModalOpen(false);
      go(`/finance/invoices/${inv.id}`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Clients"
        subtitle="Corporate partnerships, B2B negotiated rate packages, bulk court allocations, and consolidated billing (FIN-08)."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => go("/finance/invoices")}
              className="gap-1.5"
            >
              <Receipt className="size-3.5" /> All Invoices
            </Button>
          </div>
        }
      />

      <PeriodLockedBanner />
      <PeriodLockModal />

      {/* Main Grid: Left Clients List, Right Selected Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Client Cards List */}
        <div className="lg:col-span-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-chalk/60 px-1">
            Corporate Clients ({businessClients.length})
          </p>

          {businessClients.map((client) => {
            const isSelected = client.id === selectedClient?.id;
            return (
              <div
                key={client.id}
                onClick={() => setSelectedClientId(client.id)}
                className={cn(
                  "rounded-2xl border p-4 transition-all cursor-pointer relative",
                  isSelected
                    ? "border-volt-400 bg-court-600 shadow-card before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1 before:rounded-pill before:bg-volt-400"
                    : "border-chalk/10 bg-court-600/50 hover:bg-court-600 hover:border-chalk/20"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-court-700 text-volt-400">
                      <Briefcase className="size-3.5" />
                    </div>
                    <span className="font-bold text-sm text-chalk">{client.name}</span>
                  </div>
                </div>

                <div className="mt-2 text-xs space-y-1">
                  <p className="font-mono text-amber-300 text-[11px]">
                    GSTIN: {client.gstin}
                  </p>
                  <p className="text-chalk/70 truncate">{client.ratePlan}</p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-chalk/10 pt-2 text-xs">
                  <span className="text-chalk/60">Unbilled Amount:</span>
                  <span
                    className={cn(
                      "font-mono font-bold",
                      client.unbilledAmount > 0 ? "text-volt-400" : "text-chalk/60"
                    )}
                  >
                    {formatCurrency(client.unbilledAmount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Selected Client Deep Profile */}
        {selectedClient && (
          <div className="lg:col-span-8 space-y-6">
            {/* Header Profile Card */}
            <Card className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-chalk">{selectedClient.name}</h3>
                    <span className="rounded-pill bg-amber-400/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300 border border-amber-400/30">
                      GST Verified
                    </span>
                  </div>
                  <p className="text-xs font-mono text-amber-300 mt-1">
                    GSTIN: {selectedClient.gstin}
                  </p>
                  <p className="text-xs text-chalk/70 mt-1 max-w-lg">
                    {selectedClient.billingAddress}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-chalk/60">Payment Terms</span>
                  <p className="text-sm font-semibold text-chalk">
                    Net {selectedClient.paymentTermsDays} Days
                  </p>
                  <p className="text-[11px] text-volt-400 mt-1">
                    {selectedClient.negotiatedDiscountPercent}% Negotiated Discount
                  </p>
                </div>
              </div>

              {/* Contact strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl bg-court-700/60 p-3.5 text-xs border border-chalk/8">
                <div>
                  <span className="text-chalk/50 block">Contact Person</span>
                  <span className="font-semibold text-chalk mt-0.5 block">
                    {selectedClient.contactPerson}
                  </span>
                </div>
                <div>
                  <span className="text-chalk/50 block">Email</span>
                  <span className="font-mono text-chalk/90 mt-0.5 block truncate">
                    {selectedClient.contactEmail}
                  </span>
                </div>
                <div>
                  <span className="text-chalk/50 block">Phone</span>
                  <span className="font-mono text-chalk/90 mt-0.5 block">
                    {selectedClient.contactPhone}
                  </span>
                </div>
              </div>

              {/* Rate Plan Banner */}
              <div className="rounded-xl border border-volt-400/20 bg-volt-400/10 p-3 text-xs flex items-center gap-2.5 text-chalk">
                <Sparkles className="size-4 text-volt-400 shrink-0" />
                <span>
                  <strong>Active Package:</strong> {selectedClient.ratePlan}
                </span>
              </div>
            </Card>

            {/* Unbilled Items Section & Consolidated Invoicing */}
            <Card className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-base font-semibold text-chalk flex items-center gap-2">
                    <Clock className="size-4 text-volt-400" />
                    Unbilled Facility Usage ({selectedClient.unbilledItems.length} Items)
                  </h4>
                  <p className="text-xs text-chalk/60">
                    Court reservations and member subsidised entries waiting for monthly consolidated bill
                  </p>
                </div>

                {selectedClient.unbilledItems.length > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsConsolidateModalOpen(true)}
                    className="gap-2"
                  >
                    <Receipt className="size-4" /> Generate Consolidated Invoice
                  </Button>
                )}
              </div>

              {selectedClient.unbilledItems.length === 0 ? (
                <div className="rounded-xl border border-chalk/10 bg-court-700/30 p-6 text-center text-xs text-chalk/60">
                  <CheckCircle2 className="size-6 text-emerald-400 mx-auto mb-2" />
                  All facility usage has been billed! No outstanding unbilled reservations.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-chalk/10">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-court-700/60 text-chalk/70 font-semibold uppercase text-[10px] tracking-wider border-b border-chalk/10">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-2 text-center">Type</th>
                        <th className="py-2.5 px-2 text-right">Units/Hrs</th>
                        <th className="py-2.5 px-3 text-right">Taxable</th>
                        <th className="py-2.5 px-3 text-right">Total (inc. GST)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-chalk/8 text-chalk/90">
                      {selectedClient.unbilledItems.map((item) => (
                        <tr key={item.id} className="hover:bg-chalk/5">
                          <td className="py-3 px-3 font-mono text-chalk/70">{item.date}</td>
                          <td className="py-3 px-3 font-medium text-chalk">
                            {item.description}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className="rounded bg-court-700 px-2 py-0.5 text-[10px] font-semibold text-chalk/80">
                              {item.type.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right font-mono">
                            {item.hoursOrUnits || 1}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-chalk/80">
                            {formatINR(item.taxableAmount)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-volt-400">
                            {formatINR(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-court-700/80 font-bold border-t border-chalk/14">
                      <tr>
                        <td colSpan={5} className="py-3 px-3 text-right text-xs text-chalk">
                          Unbilled Total:
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-sm text-volt-400">
                          {formatCurrency(selectedClient.unbilledAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </Card>

            {/* Past Invoices for this Client */}
            <Card className="p-6 space-y-4">
              <h4 className="text-base font-semibold text-chalk flex items-center gap-2">
                <Receipt className="size-4 text-volt-400" /> Past Invoices ({clientInvoices.length})
              </h4>

              {clientInvoices.length === 0 ? (
                <p className="text-xs text-chalk/50 italic">No past invoices found.</p>
              ) : (
                <div className="space-y-2">
                  {clientInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => go(`/finance/invoices/${inv.id}`)}
                      className="flex items-center justify-between rounded-xl border border-chalk/10 bg-court-700/40 p-3.5 text-xs hover:border-volt-400/40 hover:bg-court-700 transition-all cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-volt-400">
                            {inv.invoiceNumber}
                          </span>
                          <StatusPill
                            tone={inv.status === "PAID" ? "success" : "danger"}
                            className="text-[10px]"
                          >
                            {inv.status}
                          </StatusPill>
                        </div>
                        <p className="text-[11px] text-chalk/60 mt-0.5">
                          Issued: {inv.date} • Due: {inv.dueDate}
                        </p>
                      </div>

                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="font-mono font-bold text-chalk">
                            {formatCurrency(inv.totalAmount)}
                          </p>
                          {inv.balanceDue > 0 && (
                            <p className="text-[10px] font-mono text-rose-400">
                              Due: {formatINR(inv.balanceDue)}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="size-4 text-chalk/40" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Consolidated Invoice Preview & Creation Modal */}
      {selectedClient && (
        <Modal
          isOpen={isConsolidateModalOpen}
          onClose={() => setIsConsolidateModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <Receipt className="size-4 text-volt-400" />
              <span>Consolidate Monthly Invoice: {selectedClient.name}</span>
            </div>
          }
          maxWidth="xl"
        >
          <div className="space-y-4 text-xs">
            <div className="rounded-lg bg-court-700/60 p-3 border border-chalk/10 space-y-1">
              <p className="font-bold text-chalk">Billed Entity:</p>
              <p className="text-chalk/90">{selectedClient.name}</p>
              <p className="font-mono text-amber-300 text-[11px]">GSTIN: {selectedClient.gstin}</p>
            </div>

            <div>
              <label className="block font-semibold text-chalk/80 mb-1">Billing Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full h-10 rounded-input border border-chalk/14 bg-court-600 px-3 text-xs text-chalk focus:outline-none focus:ring-2 focus:ring-volt-400"
              >
                <option value="October 2026">October 2026</option>
                <option value="September 2026">September 2026</option>
                <option value="August 2026">August 2026</option>
              </select>
            </div>

            <div className="rounded-lg border border-chalk/10 bg-court-700/40 p-3 space-y-2">
              <p className="font-bold uppercase tracking-wider text-[10px] text-chalk/60">
                Included Items ({selectedClient.unbilledItems.length})
              </p>
              {selectedClient.unbilledItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px] py-1 border-b border-chalk/6 last:border-none">
                  <span className="text-chalk/90 truncate max-w-xs">{item.description}</span>
                  <span className="font-mono font-medium text-chalk">{formatINR(item.amount)}</span>
                </div>
              ))}
              <div className="border-t border-chalk/14 pt-2 flex justify-between font-bold text-sm text-volt-400">
                <span>Grand Total:</span>
                <span className="font-mono">{formatCurrency(selectedClient.unbilledAmount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-chalk/10">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsConsolidateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={handleGenerateInvoice} className="gap-2">
                <Receipt className="size-4" /> Generate Official Tax Invoice
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
