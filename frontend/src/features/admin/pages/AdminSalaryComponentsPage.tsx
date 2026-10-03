import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { Table, type Column } from "@/components/ui/Table";
import { useAdminConfigStore } from "../adminConfigStore";
import type { SalaryComponent } from "../types";
import { Coins, Edit2, ShieldAlert, CheckCircle2, DollarSign } from "lucide-react";

export default function AdminSalaryComponentsPage() {
  const { salaryComponents, updateSalaryComponent } = useAdminConfigStore();

  const [activeComponent, setActiveComponent] = useState<SalaryComponent | null>(null);
  const [formData, setFormData] = useState<SalaryComponent | null>(null);

  const handleOpenEdit = (c: SalaryComponent) => {
    setActiveComponent(c);
    setFormData({ ...c });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    updateSalaryComponent(formData.id, formData);
    setActiveComponent(null);
    setFormData(null);
  };

  const columns: Column<SalaryComponent>[] = [
    {
      key: "name",
      header: "Salary Head & Description",
      render: (c) => (
        <div className="flex flex-col">
          <span className="font-semibold text-white">{c.name}</span>
          <span className="text-[11px] text-white/50">{c.description}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Component Classification",
      render: (c) => (
        <StatusPill variant={c.type === "EARNING" ? "success" : "danger"}>
          {c.type === "EARNING" ? "Earning (Payable)" : "Deduction (Withholding)"}
        </StatusPill>
      ),
    },
    {
      key: "formula",
      header: "Calculation Basis",
      render: (c) => (
        <span className="text-xs text-white/80">
          {c.calcType === "PERCENTAGE" ? "Percentage of Basic Pay" : "Fixed Monthly Amount"}
        </span>
      ),
    },
    {
      key: "defaultVal",
      header: "Default Value / Rate",
      render: (c) => (
        <span className="font-mono font-bold text-sm text-volt-400">
          {c.calcType === "PERCENTAGE" ? `${c.defaultValue}%` : `₹${c.defaultValue}`}
        </span>
      ),
    },
    {
      key: "statutory",
      header: "Statutory Scheme",
      render: (c) => (
        <span className="text-xs text-white/70">
          {c.isStatutory ? "EPFO / ESIC / Labor Tax (Statutory)" : "Voluntary / Discretionary"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (c) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleOpenEdit(c)}
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
        title="Salary Heads & Payroll Formula Components"
        subtitle="Manage base earnings, allowances, EPF employer/employee contributions, ESIC health deductions, and professional tax slabs."
      />

      {/* Simplified Notice */}
      <Card className="p-4 bg-court-500 border-white/14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-volt-400/20 text-volt-400 shrink-0">
            <Coins className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Indian Payroll Formulas (Simplified)</h3>
            <p className="text-xs text-white/70">
              PF (12% of Basic), ESI (0.75%), and Maharashtra PT (₹200) adhere to statutory club schedules.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-volt-400 bg-volt-400/10 px-3 py-1 rounded-full border border-volt-400/20">
          HR-06 Certified
        </span>
      </Card>

      {/* Salary Components Table */}
      <Card className="p-0 overflow-hidden bg-court-500 border-white/14">
        <Table
          data={salaryComponents}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyTitle="No Salary Components"
          emptySubtitle="No components found."
        />
      </Card>

      {/* Edit Component Modal */}
      {formData && (
        <Modal
          isOpen={!!activeComponent}
          onClose={() => {
            setActiveComponent(null);
            setFormData(null);
          }}
          title={`Edit ${formData.name}`}
          subtitle="Configure default payroll head value, calculation type, and statutory tags."
        >
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Component Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1.5">
                  Component Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full h-11 px-3 rounded-xl bg-navy-800 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
                >
                  <option value="EARNING">Earning (Gross Addition)</option>
                  <option value="DEDUCTION">Deduction (Withholding)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/80 mb-1.5">
                  Calculation Formula *
                </label>
                <select
                  value={formData.calcType}
                  onChange={(e) => setFormData({ ...formData, calcType: e.target.value as any })}
                  className="w-full h-11 px-3 rounded-xl bg-navy-800 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
                >
                  <option value="FIXED">Fixed Amount (₹ INR)</option>
                  <option value="PERCENTAGE">Percentage (%) of Basic Pay</option>
                </select>
              </div>
            </div>

            <Input
              label={`Default Value (${formData.calcType === "PERCENTAGE" ? "%" : "₹"}) *`}
              type="number"
              step="0.05"
              value={formData.defaultValue}
              onChange={(e) =>
                setFormData({ ...formData, defaultValue: Number(e.target.value) })
              }
              required
            />

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Description & Statutory Notes
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 rounded-xl bg-white/8 border border-white/18 text-xs text-white placeholder-white/40 focus:outline-none focus:border-volt-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setActiveComponent(null);
                  setFormData(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Update Salary Component
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
