import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { Table, type Column } from "@/components/ui/Table";
import { useAdminConfigStore } from "../adminConfigStore";
import type { TaxRule } from "../types";
import {
  Calculator,
  Percent,
  Edit2,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Receipt,
} from "lucide-react";

export default function AdminTaxesPage() {
  const { taxes, updateTax } = useAdminConfigStore();

  const [activeTax, setActiveTax] = useState<TaxRule | null>(null);
  const [formData, setFormData] = useState<TaxRule | null>(null);

  const handleOpenEdit = (tax: TaxRule) => {
    setActiveTax(tax);
    setFormData({ ...tax });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    const totalGst = formData.cgstRate + formData.sgstRate;
    updateTax(formData.id, {
      ...formData,
      totalGstRate: totalGst,
    });
    setActiveTax(null);
    setFormData(null);
  };

  const columns: Column<TaxRule>[] = [
    {
      key: "name",
      header: "Taxable Service / Goods Category",
      render: (t) => (
        <div className="flex flex-col">
          <span className="font-semibold text-white">{t.name}</span>
          <span className="font-mono text-[11px] text-volt-400">{t.category}</span>
        </div>
      ),
    },
    {
      key: "hsn",
      header: "HSN / SAC Code",
      render: (t) => (
        <span className="font-mono text-xs text-white/90 bg-white/8 px-2 py-0.5 rounded border border-white/10">
          {t.hsnSac}
        </span>
      ),
    },
    {
      key: "rates",
      header: "CGST + SGST Breakdown",
      render: (t) => (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-white/80">CGST: {t.cgstRate}%</span>
          <span className="text-white/40">+</span>
          <span className="text-white/80">SGST: {t.sgstRate}%</span>
        </div>
      ),
    },
    {
      key: "totalGst",
      header: "Total GST Rate",
      render: (t) => (
        <span className="font-bold text-sm text-volt-400 font-mono">
          {t.totalGstRate}% GST
        </span>
      ),
    },
    {
      key: "pricingType",
      header: "Price Inclusive Mode",
      render: (t) => (
        <button
          onClick={() => updateTax(t.id, { isInclusive: !t.isInclusive })}
          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            t.isInclusive
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : "bg-blue-500/15 border-blue-500/30 text-blue-300"
          }`}
        >
          {t.isInclusive ? "Tax Inclusive" : "Tax Exclusive (+ GST)"}
        </button>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (t) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleOpenEdit(t)}
          className="text-xs text-white/70 hover:text-white gap-1"
        >
          <Edit2 className="size-3.5" />
          <span>Edit</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statutory Taxation & GST Schedules"
        subtitle="Manage GST rate structures across court reservations, membership fees, pro shop gear, and restaurant dining per Indian GST provisions."
      />

      {/* Overview Notice */}
      <Card className="p-4 bg-court-500 border-white/14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-volt-400/20 text-volt-400 shrink-0">
            <Calculator className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Central & State GST Splitting</h3>
            <p className="text-xs text-white/70">
              Intra-state transactions in Maharashtra automatically split equal parts CGST (9%) and SGST (9%).
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          GSTR-1 & 3B Ready
        </span>
      </Card>

      {/* Taxes Table */}
      <Card className="p-0 overflow-hidden bg-court-500 border-white/14">
        <Table
          data={taxes}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyTitle="No Taxes Configured"
          emptySubtitle="No tax schedules available."
        />
      </Card>

      {/* Edit Tax Modal */}
      {formData && (
        <Modal
          isOpen={!!activeTax}
          onClose={() => {
            setActiveTax(null);
            setFormData(null);
          }}
          title={`Edit ${formData.name}`}
          subtitle="Update HSN/SAC code, statutory tax percentages, and price inclusion toggle."
        >
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Schedule Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="HSN / SAC Code *"
                value={formData.hsnSac}
                onChange={(e) => setFormData({ ...formData, hsnSac: e.target.value })}
                required
              />

              <div>
                <label className="block text-xs font-medium text-white/80 mb-1.5">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full h-11 px-3 rounded-xl bg-navy-800 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
                >
                  <option value="COURT">Court Booking</option>
                  <option value="MEMBERSHIP">Membership Services</option>
                  <option value="SHOP">Pro Shop Retail</option>
                  <option value="BAR">Lounge & Restaurant</option>
                  <option value="SERVICE">Maintenance & Labor</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="CGST Rate (%) *"
                type="number"
                step="0.5"
                value={formData.cgstRate}
                onChange={(e) =>
                  setFormData({ ...formData, cgstRate: Number(e.target.value) })
                }
                required
              />

              <Input
                label="SGST Rate (%) *"
                type="number"
                step="0.5"
                value={formData.sgstRate}
                onChange={(e) =>
                  setFormData({ ...formData, sgstRate: Number(e.target.value) })
                }
                required
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div>
                <span className="text-xs font-medium text-white block">Price Inclusive Pricing</span>
                <span className="text-[11px] text-white/60">
                  When enabled, member displayed rates already include this GST component.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isInclusive: !formData.isInclusive })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formData.isInclusive ? "bg-volt-400" : "bg-white/20"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-ink-900 shadow ring-0 transition duration-200 ease-in-out ${
                    formData.isInclusive ? "translate-x-5" : "translate-x-0 bg-white"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setActiveTax(null);
                  setFormData(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Tax Configuration
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
