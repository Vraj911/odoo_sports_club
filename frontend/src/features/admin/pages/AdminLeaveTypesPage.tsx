import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { Table, type Column } from "@/components/ui/Table";
import { useAdminConfigStore } from "../adminConfigStore";
import type { LeaveType } from "../types";
import { CalendarOff, Edit2, CheckCircle2, ShieldCheck, PlusCircle } from "lucide-react";

export default function AdminLeaveTypesPage() {
  const { leaveTypes, updateLeaveType } = useAdminConfigStore();

  const [activeLeave, setActiveLeave] = useState<LeaveType | null>(null);
  const [formData, setFormData] = useState<LeaveType | null>(null);

  const handleOpenEdit = (l: LeaveType) => {
    setActiveLeave(l);
    setFormData({ ...l });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    updateLeaveType(formData.id, formData);
    setActiveLeave(null);
    setFormData(null);
  };

  const columns: Column<LeaveType>[] = [
    {
      key: "name",
      header: "Leave Category",
      render: (l) => (
        <div className="flex flex-col">
          <span className="font-semibold text-white">{l.name}</span>
          <span className="text-[11px] text-white/50">{l.description}</span>
        </div>
      ),
    },
    {
      key: "paid",
      header: "Compensation Model",
      render: (l) => (
        <StatusPill variant={l.paid ? "volt" : "neutral"}>
          {l.paid ? "Paid Leave" : "Loss of Pay (Unpaid)"}
        </StatusPill>
      ),
    },
    {
      key: "days",
      header: "Annual Entitlement Quota",
      render: (l) => (
        <span className="font-bold text-sm text-white">
          {l.yearlyDays} Days / Year
        </span>
      ),
    },
    {
      key: "doc",
      header: "Documentation Required",
      render: (l) => (
        <span className="text-xs text-white/70">
          {l.requiresDocument ? "Medical Proof / Certificate Required" : "Self-Certified"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (l) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleOpenEdit(l)}
          className="text-xs text-white/70 hover:text-white gap-1"
        >
          <Edit2 className="size-3.5" />
          <span>Edit Policy</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Leave Entitlement Policies"
        subtitle="Manage annual leave allocations, paid time-off limits, documentation mandates, and loss-of-pay thresholds for permanent and contract staff."
      />

      {/* Leave Types Table */}
      <Card className="p-0 overflow-hidden bg-court-500 border-white/14">
        <Table
          data={leaveTypes}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyTitle="No Leave Types"
          emptySubtitle="No leave types configured."
        />
      </Card>

      {/* Edit Leave Modal */}
      {formData && (
        <Modal
          isOpen={!!activeLeave}
          onClose={() => {
            setActiveLeave(null);
            setFormData(null);
          }}
          title={`Edit ${formData.name}`}
          subtitle="Configure annual day quotas and documentation requirements."
        >
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Leave Classification Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Yearly Days Allocated *"
                type="number"
                min={0}
                max={90}
                value={formData.yearlyDays}
                onChange={(e) =>
                  setFormData({ ...formData, yearlyDays: Number(e.target.value) })
                }
                required
              />

              <div>
                <label className="block text-xs font-medium text-white/80 mb-1.5">
                  Compensation Model *
                </label>
                <select
                  value={formData.paid ? "PAID" : "UNPAID"}
                  onChange={(e) =>
                    setFormData({ ...formData, paid: e.target.value === "PAID" })
                  }
                  className="w-full h-11 px-3 rounded-xl bg-navy-800 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
                >
                  <option value="PAID">Paid Time-Off (PTO)</option>
                  <option value="UNPAID">Loss of Pay (Unpaid LWP)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Policy Description & Approval Criteria
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 rounded-xl bg-white/8 border border-white/18 text-xs text-white placeholder-white/40 focus:outline-none focus:border-volt-400"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div>
                <span className="text-xs font-medium text-white block">Medical Certificate Mandate</span>
                <span className="text-[11px] text-white/60">
                  Requires staff to upload supporting doctor notes when submitting leave.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.requiresDocument}
                onChange={(e) => setFormData({ ...formData, requiresDocument: e.target.checked })}
                className="accent-volt-400 size-4"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setActiveLeave(null);
                  setFormData(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Leave Policy
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
