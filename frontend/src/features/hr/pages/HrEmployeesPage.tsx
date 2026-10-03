import { useState, useMemo } from "react";
import { useGo } from "@/app/router/links";
import { useHrStore, formatINR } from "../hrStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, type Column } from "@/components/ui/Table";
import { StatusPill } from "@/components/ui/StatusPill";
import { Modal } from "@/components/ui/Modal";
import type { Employee, Department } from "../types";
import {
  Users,
  UserPlus,
  Search,
  Award,
  ChevronRight,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

const DEPARTMENTS: { key: string; label: string }[] = [
  { key: "ALL", label: "All Departments" },
  { key: "FRONT_DESK", label: "Front Desk" },
  { key: "BAR", label: "Bar & Lounge" },
  { key: "KITCHEN", label: "Kitchen & Cafe" },
  { key: "SHOP", label: "Pro Shop" },
  { key: "MAINTENANCE", label: "Maintenance" },
  { key: "COACHING", label: "Coaching Pro" },
];

export default function HrEmployeesPage() {
  const go = useGo();
  const { employees } = useHrStore();

  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New employee state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState<Department>("FRONT_DESK");
  const [roleTitle, setRoleTitle] = useState("");
  const [baseSalary, setBaseSalary] = useState("30000");
  const [coachingFlag, setCoachingFlag] = useState(false);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (selectedDept !== "ALL" && emp.department !== selectedDept) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          emp.name.toLowerCase().includes(q) ||
          emp.email.toLowerCase().includes(q) ||
          emp.roleTitle.toLowerCase().includes(q) ||
          emp.id.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [employees, selectedDept, search]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Name and Email are required.");
      return;
    }

    toast.success(`Employee ${name} added successfully! Credentials sent to ${email}.`);
    setIsAddModalOpen(false);
    setName("");
    setEmail("");
    setPhone("");
    setRoleTitle("");
  };

  const columns: Column<Employee>[] = [
    {
      key: "employee",
      header: "Employee Details",
      render: (emp) => (
        <div className="flex items-center gap-3">
          <img
            src={emp.avatar}
            alt={emp.name}
            className="size-10 rounded-full object-cover border border-chalk/14 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-chalk text-sm">{emp.name}</span>
              {emp.coachingFlag && (
                <span className="rounded-full bg-volt-400/20 text-volt-400 border border-volt-400/40 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1">
                  <Award className="size-3" /> Coach Pro
                </span>
              )}
            </div>
            <p className="text-xs text-chalk/60 font-mono">{emp.id} · {emp.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department & Role",
      render: (emp) => (
        <div className="space-y-0.5">
          <span className="rounded-md bg-court-700 border border-chalk/10 px-2 py-0.5 text-[11px] font-semibold text-chalk/90">
            {emp.department.replace("_", " ")}
          </span>
          <p className="text-xs text-chalk/70 mt-1">{emp.roleTitle}</p>
        </div>
      ),
    },
    {
      key: "joiningDate",
      header: "Joined On",
      render: (emp) => (
        <span className="text-xs text-chalk/80 font-mono">{emp.joiningDate}</span>
      ),
    },
    {
      key: "salary",
      header: "Monthly CTC",
      render: (emp) => (
        <span className="text-xs font-mono font-bold text-chalk">
          {formatINR(emp.baseSalary)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (emp) => (
        <StatusPill variant={emp.status === "ACTIVE" ? "success" : "danger"}>
          {emp.status}
        </StatusPill>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (emp) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => go(`/hr/employees/${emp.id}`)}
          className="gap-1 text-xs text-volt-400 hover:text-volt-300"
        >
          View Profile <ChevronRight className="size-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Directory"
        subtitle="12 employees across front desk, courtside bar, cafe kitchen, pro store, maintenance, and coaching staff (HR-01)."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1.5"
          >
            <UserPlus className="size-3.5" /> Onboard Employee
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-chalk/40" />
            <Input
              placeholder="Search by name, role, email or EMP ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 text-xs"
            />
          </div>

          <span className="text-xs text-chalk/60 font-mono">
            Showing {filteredEmployees.length} of {employees.length} staff
          </span>
        </div>

        {/* Department Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-chalk/10">
          {DEPARTMENTS.map((dept) => (
            <button
              key={dept.key}
              type="button"
              onClick={() => setSelectedDept(dept.key)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                selectedDept === dept.key
                  ? "bg-volt-400 text-ink-900 border-volt-400 font-bold"
                  : "bg-court-700/60 border-chalk/10 text-chalk/70 hover:text-chalk"
              )}
            >
              {dept.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Employees Table */}
      <Table
        data={filteredEmployees}
        columns={columns}
        keyExtractor={(emp) => emp.id}
        emptyTitle="No staff members found"
        emptySubtitle="Try adjusting your search or department filter."
      />

      {/* Onboard Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        maxWidth="lg"
        title={
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-volt-400/20 text-volt-400">
              <UserPlus className="size-4" />
            </div>
            <span>Onboard New Employee</span>
          </div>
        }
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-chalk/80">Full Name *</label>
              <Input
                placeholder="e.g. Sameer Kulkarni"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-chalk/80">Email Address *</label>
              <Input
                type="email"
                placeholder="sameer.k@championsclub.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-chalk/80">Phone Number</label>
              <Input
                placeholder="+91 98200 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-chalk/80">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full h-12 rounded-[14px] bg-white/8 border border-white/18 px-3.5 text-xs text-chalk focus:border-volt-400 focus:outline-none"
              >
                <option value="FRONT_DESK" className="bg-navy-800">Front Desk</option>
                <option value="BAR" className="bg-navy-800">Bar & Lounge</option>
                <option value="KITCHEN" className="bg-navy-800">Kitchen & Cafe</option>
                <option value="SHOP" className="bg-navy-800">Pro Shop</option>
                <option value="MAINTENANCE" className="bg-navy-800">Maintenance & Turf</option>
                <option value="COACHING" className="bg-navy-800">Coaching Pro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-chalk/80">Role Title</label>
              <Input
                placeholder="e.g. Assistant Coach"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-chalk/80">Monthly CTC (INR)</label>
              <Input
                type="number"
                placeholder="30000"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
              />
            </div>
          </div>

          {/* Coaching Flag Toggle */}
          <div className="rounded-xl border border-chalk/14 bg-court-700/60 p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-chalk flex items-center gap-1.5">
                <Award className="size-3.5 text-volt-400" /> Coaching Capability (P2)
              </p>
              <p className="text-[11px] text-chalk/60">
                Can this employee be booked for private coaching slots and assigned to social play sessions?
              </p>
            </div>
            <input
              type="checkbox"
              checked={coachingFlag}
              onChange={(e) => setCoachingFlag(e.target.checked)}
              className="size-4 accent-volt-400 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-chalk/10">
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Confirm & Onboard
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
