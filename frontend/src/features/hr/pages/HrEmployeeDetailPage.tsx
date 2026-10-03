import { useState } from "react";
import { useGo } from "@/app/router/links";
import { useHrStore, formatINR } from "../hrStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusPill } from "@/components/ui/StatusPill";
import { ReasonDialog } from "@/components/shared/ReasonDialog";
import {
  Users,
  Award,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Building,
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Percent,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

export interface HrEmployeeDetailPageProps {
  params?: { id?: string };
}

export default function HrEmployeeDetailPage({ params }: HrEmployeeDetailPageProps) {
  const go = useGo();
  const { employees, updateEmployee, toggleEmployeeStatus } = useHrStore();

  const empId = params?.id || "EMP-001";
  const employee = employees.find((e) => e.id === empId) || employees[0];

  const [activeTab, setActiveTab] = useState<"profile" | "salary" | "bank" | "documents" | "status">("profile");
  const [revealBank, setRevealBank] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);

  // Editable coaching flag
  const [isCoaching, setIsCoaching] = useState(employee?.coachingFlag || false);

  if (!employee) {
    return (
      <div className="p-8 text-center text-chalk">
        <p className="text-lg font-bold">Employee not found</p>
        <Button variant="secondary" size="sm" onClick={() => go("/hr/employees")} className="mt-4">
          Back to Directory
        </Button>
      </div>
    );
  }

  const handleCoachingToggle = (val: boolean) => {
    setIsCoaching(val);
    updateEmployee(employee.id, { coachingFlag: val });
    toast.success(`Coaching capability updated: ${val ? "Enabled for private & social bookings" : "Disabled"}`);
  };

  const handleStatusChange = (reason: string) => {
    toggleEmployeeStatus(employee.id, reason);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => go("/hr/employees")}
          className="gap-1 text-xs"
        >
          <ArrowLeft className="size-3.5" /> Back to Employees
        </Button>
      </div>

      {/* Profile Header Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={employee.avatar}
              alt={employee.name}
              className="size-16 rounded-full object-cover border-2 border-volt-400 shrink-0 shadow-lg"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-chalk">{employee.name}</h1>
                <span className="font-mono text-xs text-volt-400 font-semibold px-2 py-0.5 rounded bg-volt-400/10 border border-volt-400/30">
                  {employee.id}
                </span>
                <StatusPill variant={employee.status === "ACTIVE" ? "success" : "danger"}>
                  {employee.status}
                </StatusPill>
                {isCoaching && (
                  <span className="rounded-full bg-volt-400/20 text-volt-400 border border-volt-400/40 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1">
                    <Award className="size-3" /> Coach Pro (P2)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-chalk/70 flex-wrap">
                <span className="flex items-center gap-1">
                  <Building className="size-3.5 text-chalk/40" /> {employee.department.replace("_", " ")}
                </span>
                <span>·</span>
                <span className="font-medium text-chalk/90">{employee.roleTitle}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5 text-chalk/40" /> Joined {employee.joiningDate}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={employee.status === "ACTIVE" ? "danger" : "primary"}
              size="sm"
              onClick={() => setIsDeactivateDialogOpen(true)}
              className="text-xs"
            >
              {employee.status === "ACTIVE" ? "Suspend / Inactivate Staff" : "Reactivate Staff"}
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-chalk/10 overflow-x-auto">
          {[
            { id: "profile", label: "Profile & Personal" },
            { id: "salary", label: "Salary Structure & Deductions" },
            { id: "bank", label: "Bank Details (Masked)" },
            { id: "documents", label: `Documents (${employee.documents.length})` },
            { id: "status", label: "Status & Audit" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-volt-400 text-ink-900 font-bold"
                  : "bg-court-700/60 text-chalk/70 hover:text-chalk"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Tab 1: Profile & Contact */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-chalk flex items-center gap-2">
              <Mail className="size-4 text-volt-400" /> Contact Information
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-chalk/10">
                <span className="text-chalk/60">Email:</span>
                <span className="text-chalk font-mono font-medium">{employee.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-chalk/10">
                <span className="text-chalk/60">Phone:</span>
                <span className="text-chalk font-mono font-medium">{employee.phone}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-chalk/10">
                <span className="text-chalk/60">Department:</span>
                <span className="text-chalk font-semibold">{employee.department.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-chalk/10">
                <span className="text-chalk/60">Designation:</span>
                <span className="text-chalk font-medium">{employee.roleTitle}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-chalk/60">Staff PIN:</span>
                <span className="text-volt-400 font-mono font-bold">•••• (Set)</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-chalk flex items-center gap-2">
              <Phone className="size-4 text-volt-400" /> Emergency Contact
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-chalk/10">
                <span className="text-chalk/60">Contact Name:</span>
                <span className="text-chalk font-semibold">{employee.emergencyContact.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-chalk/10">
                <span className="text-chalk/60">Relationship:</span>
                <span className="text-chalk">{employee.emergencyContact.relationship}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-chalk/60">Emergency Phone:</span>
                <span className="text-chalk font-mono font-medium">{employee.emergencyContact.phone}</span>
              </div>
            </div>

            {/* Coaching Capability Toggle */}
            <div className="rounded-xl border border-chalk/14 bg-court-700/60 p-3.5 space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-chalk flex items-center gap-1.5">
                    <Award className="size-4 text-volt-400" /> Coaching Pro Assignment (P2)
                  </p>
                  <p className="text-[11px] text-chalk/60 mt-0.5">
                    Enables this staff member to appear in Court Booking coach pickers and lead social play sessions.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isCoaching}
                  onChange={(e) => handleCoachingToggle(e.target.checked)}
                  className="size-5 accent-volt-400 cursor-pointer rounded"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Salary Structure */}
      {activeTab === "salary" && (
        <Card className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-chalk">
                Monthly CTC & Statutory Breakup
              </h3>
              <p className="text-xs text-chalk/60 mt-0.5">
                Configured with statutory Provident Fund (12%), ESI (0.75%), and Professional Tax.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-chalk/50 font-mono">Monthly CTC</span>
              <p className="text-2xl font-black font-mono text-volt-400">
                {formatINR(employee.baseSalary)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-chalk/14 overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-court-700 text-chalk/70 font-semibold uppercase text-[10px] tracking-wider border-b border-chalk/10">
                <tr>
                  <th className="py-2.5 px-4">Component</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Calculation Formula</th>
                  <th className="py-2.5 px-4 text-right">Monthly Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chalk/10 bg-court-600/40">
                {employee.salaryStructure.map((item) => (
                  <tr key={item.id} className="hover:bg-court-700/40">
                    <td className="py-3 px-4 font-semibold text-chalk">{item.name}</td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[10px] font-bold border",
                          item.type === "EARNING"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        )}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-chalk/70 font-mono">
                      {item.isPercentage ? `${item.value}% of Base CTC` : "Fixed Allowance"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-chalk">
                      {formatINR(item.amountCalculated)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Bank Details */}
      {activeTab === "bank" && (
        <Card className="p-6 max-w-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-chalk flex items-center gap-2">
              <CreditCard className="size-4 text-volt-400" /> Direct Deposit Bank Details
            </h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRevealBank(!revealBank)}
              className="gap-1.5 text-xs"
            >
              {revealBank ? (
                <>
                  <EyeOff className="size-3.5" /> Mask Account
                </>
              ) : (
                <>
                  <Eye className="size-3.5" /> Reveal Account (Audited)
                </>
              )}
            </Button>
          </div>

          <div className="rounded-xl border border-chalk/14 bg-court-700/60 p-4 space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-chalk/10">
              <span className="text-chalk/60">Bank Name:</span>
              <span className="font-semibold text-chalk">{employee.bankDetails.bankName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-chalk/10">
              <span className="text-chalk/60">Account Number:</span>
              <span className="font-mono font-bold text-volt-400">
                {revealBank
                  ? employee.bankDetails.accountNumber
                  : `•••• •••• •••• ${employee.bankDetails.accountNumber.slice(-4)}`}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-chalk/10">
              <span className="text-chalk/60">IFSC Code:</span>
              <span className="font-mono font-semibold text-chalk">{employee.bankDetails.ifsc}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-chalk/10">
              <span className="text-chalk/60">Branch:</span>
              <span className="text-chalk">{employee.bankDetails.branch}</span>
            </div>
            <div className="flex items-center justify-between py-1 text-[11px] text-chalk/50">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="size-3" /> Security Protocol
              </span>
              <span className="font-mono">{employee.bankDetails.encryptedNote}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 4: Documents */}
      {activeTab === "documents" && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-chalk flex items-center gap-2">
              <FileText className="size-4 text-volt-400" /> Compliance & Verification Documents
            </h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast.info("Document upload dialog triggered.")}
              className="gap-1.5 text-xs"
            >
              <Upload className="size-3.5" /> Upload Document
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employee.documents.map((doc) => (
              <div
                key={doc.id}
                className="rounded-xl border border-chalk/14 bg-court-700/50 p-4 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-court-600 border border-chalk/10 text-volt-400">
                    <FileText className="size-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-chalk">{doc.title}</p>
                    <p className="text-[11px] text-chalk/50 font-mono">
                      {doc.fileName} · {doc.fileSize}
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5">
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 5: Status */}
      {activeTab === "status" && (
        <Card className="p-6 max-w-xl space-y-4">
          <h3 className="text-sm font-semibold text-chalk">Employment Status & Lifecycle</h3>
          <p className="text-xs text-chalk/70 leading-relaxed">
            Active staff members can log into the system, clock in/out, be assigned to shifts on the roster, and receive monthly payroll remittances. Inactivation locks all access.
          </p>

          <div className="rounded-xl border border-chalk/14 bg-court-700/60 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-chalk">Current State</p>
              <p className="text-[11px] text-chalk/60">Updated on {employee.joiningDate}</p>
            </div>
            <StatusPill variant={employee.status === "ACTIVE" ? "success" : "danger"}>
              {employee.status}
            </StatusPill>
          </div>

          <Button
            variant={employee.status === "ACTIVE" ? "danger" : "primary"}
            size="sm"
            onClick={() => setIsDeactivateDialogOpen(true)}
            className="w-full text-xs"
          >
            {employee.status === "ACTIVE" ? "Suspend / Inactivate Staff" : "Reactivate Staff"}
          </Button>
        </Card>
      )}

      {/* ReasonDialog for Suspend/Reactivate */}
      <ReasonDialog
        isOpen={isDeactivateDialogOpen}
        onClose={() => setIsDeactivateDialogOpen(false)}
        onConfirm={handleStatusChange}
        title={employee.status === "ACTIVE" ? "Suspend Staff Member" : "Reactivate Staff Member"}
        description="This action updates the employee's active status and will be recorded in the HR compliance audit log."
        actionLabel={employee.status === "ACTIVE" ? "Confirm Suspension" : "Confirm Reactivation"}
        variant={employee.status === "ACTIVE" ? "danger" : "primary"}
      />
    </div>
  );
}
