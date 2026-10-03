import { useState, useMemo } from "react";
import { useGo } from "@/app/router/links";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { toast } from "@/components/ui/Toast";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  FileCheck2,
  Printer,
  Sparkles,
  Receipt,
} from "lucide-react";
import { useCrmLead, crmActions, useCrmStore } from "../crmStore";
import { QuotePreview } from "../components/QuotePreview";
import type { QuoteItem } from "../types";

export default function CrmQuoteBuilderPage({ params }: { params?: Record<string, string> }) {
  const go = useGo();

  const pathParts = typeof window !== "undefined" ? window.location.pathname.split("/") : [];
  const leadsIndex = pathParts.indexOf("leads");
  const leadId = params?.["id"] || (leadsIndex !== -1 ? pathParts[leadsIndex + 1] : "lead-001");

  const { lead, quotes } = useCrmLead(leadId);
  const existingQuote = quotes[0] || null;

  // Quote State
  const [quoteType, setQuoteType] = useState<"MEMBERSHIP" | "CORPORATE" | "CUSTOM">("MEMBERSHIP");
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });

  const [items, setItems] = useState<QuoteItem[]>(() => {
    if (existingQuote?.items) return existingQuote.items;
    return [
      {
        id: "item-1",
        description: "Gold All-Access Individual Annual Membership",
        qty: 1,
        rate: 29661.02,
        gstPercent: 18,
        amount: 35000,
      },
    ];
  });

  const [terms, setTerms] = useState(
    existingQuote?.terms ||
      "1. Validity: 14 calendar days from date of issue.\n2. Applicable Taxes: 18% GST (CGST 9% + SGST 9%) included as per Indian GST regulations.\n3. Access includes all 10 championship courts subject to CCMS booking rules.\n4. Pro Shop and Bar discounts activate immediately upon membership issuance."
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuoteId, setCurrentQuoteId] = useState<string | null>(existingQuote?.id || null);

  // Recalculate totals
  const { subtotal, gstTotal, grandTotal } = useMemo(() => {
    let sub = 0;
    let gst = 0;
    items.forEach((item) => {
      const lineSub = item.qty * item.rate;
      const lineGst = lineSub * (item.gstPercent / 100);
      sub += lineSub;
      gst += lineGst;
    });
    return {
      subtotal: sub,
      gstTotal: gst,
      grandTotal: Math.round(sub + gst),
    };
  }, [items]);

  // Handle Preset Selection
  const applyPreset = (type: "MEMBERSHIP" | "CORPORATE" | "CUSTOM") => {
    setQuoteType(type);
    if (type === "MEMBERSHIP") {
      setItems([
        {
          id: `item-${Date.now()}-1`,
          description: "Gold All-Access Individual Annual Membership",
          qty: 1,
          rate: 29661.02,
          gstPercent: 18,
          amount: 35000,
        },
      ]);
    } else if (type === "CORPORATE") {
      setItems([
        {
          id: `item-${Date.now()}-1`,
          description: "Corporate All-Access Sports Pass (Quarterly per employee)",
          qty: 25,
          rate: 5423.73,
          gstPercent: 18,
          amount: 160000,
        },
        {
          id: `item-${Date.now()}-2`,
          description: "CCMS Corporate App Booking Portal Setup & Keycards",
          qty: 1,
          rate: 0,
          gstPercent: 18,
          amount: 0,
        },
      ]);
    } else {
      setItems([
        {
          id: `item-${Date.now()}-1`,
          description: "Custom Facility Rental / Coaching Clinic Session",
          qty: 1,
          rate: 15000,
          gstPercent: 18,
          amount: 17700,
        },
      ]);
    }
  };

  // Add Item Row
  const handleAddItem = () => {
    const newItem: QuoteItem = {
      id: `item-${Date.now()}`,
      description: "Additional Court Hire or Gear Package",
      qty: 1,
      rate: 5000,
      gstPercent: 18,
      amount: 5900,
    };
    setItems([...items, newItem]);
  };

  // Update Item Row
  const handleUpdateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "qty" || field === "rate" || field === "gstPercent") {
          const qty = field === "qty" ? Number(value) : item.qty;
          const rate = field === "rate" ? Number(value) : item.rate;
          const gstPercent = field === "gstPercent" ? Number(value) : item.gstPercent;
          const total = qty * rate * (1 + gstPercent / 100);
          updated.amount = Math.round(total);
        }
        return updated;
      })
    );
  };

  // Remove Item Row
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  // Save Draft
  const handleSaveDraft = () => {
    if (!lead) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const q = crmActions.createQuote({
        leadId: lead.id,
        quoteType,
        items,
        subtotal,
        gstTotal,
        grandTotal,
        validUntil,
        terms,
        status: "DRAFT",
      });
      setCurrentQuoteId(q.id);
      setIsSubmitting(false);
    }, 300);
  };

  // Send by Email
  const handleSendEmail = () => {
    if (!lead) return;
    setIsSubmitting(true);
    setTimeout(() => {
      let qId = currentQuoteId;
      if (!qId) {
        const created = crmActions.createQuote({
          leadId: lead.id,
          quoteType,
          items,
          subtotal,
          gstTotal,
          grandTotal,
          validUntil,
          terms,
          status: "DRAFT",
        });
        qId = created.id;
        setCurrentQuoteId(qId);
      }

      crmActions.sendQuote(qId);
      setIsSubmitting(false);
    }, 400);
  };

  // Convert to Invoice
  const handleConvertToInvoice = () => {
    toast({
      type: "success",
      title: "Invoice Generated",
      message: `Invoice INV-2026-${Math.floor(1000 + Math.random() * 9000)} generated and linked in Finance.`,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => go(`/crm/leads/${leadId}`)}
          className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Lead: {lead?.name || "Lead Detail"}</span>
        </button>
      </div>

      <PageHeader
        title={`Quotation Builder: ${lead?.name || "Client"}`}
        description="Draft custom membership proposals, corporate wellness packages, or event agreements with live GST calculation and instant dispatch."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Print Preview
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSaveDraft}
              loading={isSubmitting}
            >
              <Save className="w-4 h-4 mr-1.5" />
              Save Draft
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendEmail}
              loading={isSubmitting}
            >
              <Send className="w-4 h-4 mr-1.5" />
              Send by Email
            </Button>
          </div>
        }
      />

      {/* 2-Column Layout: Left Form (7 cols), Right PDF-Style Preview (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quote Preset Selector */}
          <div className="rounded-2xl border border-white/14 bg-court-600/70 p-5 shadow-card space-y-4">
            <h3 className="text-sm font-semibold text-white">Quotation Type & Rate Presets</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => applyPreset("MEMBERSHIP")}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  quoteType === "MEMBERSHIP"
                    ? "bg-volt-400/20 border-volt-400 text-white shadow-sm"
                    : "bg-court-700/60 border-white/10 text-white/70 hover:bg-court-700 hover:text-white"
                }`}
              >
                <p className="font-semibold text-white">Membership Plan</p>
                <p className="text-[11px] text-white/50 mt-0.5">Gold / Silver / Junior tiers</p>
              </button>

              <button
                type="button"
                onClick={() => applyPreset("CORPORATE")}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  quoteType === "CORPORATE"
                    ? "bg-volt-400/20 border-volt-400 text-white shadow-sm"
                    : "bg-court-700/60 border-white/10 text-white/70 hover:bg-court-700 hover:text-white"
                }`}
              >
                <p className="font-semibold text-white">Corporate Package</p>
                <p className="text-[11px] text-white/50 mt-0.5">Bulk employee passes & app</p>
              </button>

              <button
                type="button"
                onClick={() => applyPreset("CUSTOM")}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  quoteType === "CUSTOM"
                    ? "bg-volt-400/20 border-volt-400 text-white shadow-sm"
                    : "bg-court-700/60 border-white/10 text-white/70 hover:bg-court-700 hover:text-white"
                }`}
              >
                <p className="font-semibold text-white">Custom Items</p>
                <p className="text-[11px] text-white/50 mt-0.5">Clinics, gear & hourly buyouts</p>
              </button>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="rounded-2xl border border-white/14 bg-court-600/70 p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-semibold text-white">Line Items Breakdown</h3>
              <Button variant="ghost" size="sm" onClick={handleAddItem}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-court-700/60 border border-white/10 space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-volt-300">Item #{idx + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-white/40 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] text-white/60 mb-1 block">Description</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                      className="w-full rounded-lg bg-white/8 border border-white/14 px-3 py-1.5 text-xs text-white focus:border-volt-400 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] text-white/60 mb-1 block">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleUpdateItem(item.id, "qty", e.target.value)}
                        className="w-full rounded-lg bg-white/8 border border-white/14 px-3 py-1.5 text-xs text-white focus:border-volt-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-white/60 mb-1 block">Rate (Excl. Tax)</label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={item.rate}
                        onChange={(e) => handleUpdateItem(item.id, "rate", e.target.value)}
                        className="w-full rounded-lg bg-white/8 border border-white/14 px-3 py-1.5 text-xs text-white focus:border-volt-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-white/60 mb-1 block">GST Rate (%)</label>
                      <select
                        value={item.gstPercent}
                        onChange={(e) => handleUpdateItem(item.id, "gstPercent", Number(e.target.value))}
                        className="w-full rounded-lg bg-court-800 border border-white/14 px-3 py-1.5 text-xs text-white focus:border-volt-400 outline-none"
                      >
                        <option value="18">18% (Standard GST)</option>
                        <option value="12">12%</option>
                        <option value="5">5%</option>
                        <option value="0">0% (Exempt)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Validity & Terms */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Validity Expiry Date"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />

                <div className="flex flex-col justify-end">
                  <span className="text-xs text-white/60 mb-1">Standard Duration:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 7);
                        setValidUntil(d.toISOString().split("T")[0]);
                      }}
                      className="px-2.5 py-1 rounded bg-white/8 text-[11px] text-white/80 hover:bg-white/14"
                    >
                      7 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 14);
                        setValidUntil(d.toISOString().split("T")[0]);
                      }}
                      className="px-2.5 py-1 rounded bg-white/8 text-[11px] text-white/80 hover:bg-white/14"
                    >
                      14 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 30);
                        setValidUntil(d.toISOString().split("T")[0]);
                      }}
                      className="px-2.5 py-1 rounded bg-white/8 text-[11px] text-white/80 hover:bg-white/14"
                    >
                      30 Days
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium text-white/80 mb-1.5 block">
                  Proposal Terms & Conditions
                </label>
                <textarea
                  rows={4}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full rounded-2xl bg-white/8 border border-white/18 px-4 py-2.5 text-xs text-white placeholder-white/50 focus:border-volt-400 focus:ring-4 focus:ring-volt-400/25 transition-all outline-none resize-none font-mono"
                />
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleConvertToInvoice}
              >
                <Receipt className="w-3.5 h-3.5 mr-1.5" />
                Convert to Invoice
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSaveDraft}
                  loading={isSubmitting}
                >
                  Save Draft
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSendEmail}
                  loading={isSubmitting}
                >
                  Send by Email (Quote Sent)
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Live PDF-Style Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="mb-2 flex items-center justify-between text-xs text-white/60">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-volt-400" />
              Live PDF Document Preview
            </span>
            <span>Realtime updates</span>
          </div>

          <QuotePreview
            quoteNumber={existingQuote?.quoteNumber || "QTE-2026-DRAFT"}
            quoteType={quoteType}
            items={items}
            subtotal={subtotal}
            gstTotal={gstTotal}
            grandTotal={grandTotal}
            validUntil={validUntil}
            terms={terms}
            lead={lead}
          />
        </div>
      </div>
    </div>
  );
}
