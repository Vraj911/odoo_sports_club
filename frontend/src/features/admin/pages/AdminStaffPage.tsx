import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { Table, type Column } from "@/components/ui/Table";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { ReasonDialog } from "@/components/shared/ReasonDialog";
import { useAdminConfigStore, ACCESS_MATRIX_DATA } from "../adminConfigStore";
import type { StaffUser, PermissionGroupDef } from "../types";
import {
  UserCog,
  ShieldCheck,
  ShieldAlert,
  PlusCircle,
  Search,
  Filter,
  MoreVertical,
  KeyRound,
  UserX,
  Award,
  Lock,
  Download,
  CheckCircle2,
  Check,
  X,
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronRight,
  Shield,
  Edit2,
  Trash2,
} from "lucide-react";
import { toast } from "@/components/ui/Toast";

const TABS: TabItem[] = [
  { id: "staff", label: "Staff Users", icon: <UserCog className="size-4" /> },
  { id: "groups", label: "Permission Groups", icon: <ShieldCheck className="size-4" /> },
  { id: "matrix", label: "Access Matrix", icon: <Layers className="size-4" /> },
];

const MODULE_PERMISSIONS_CATALOG = [
  { module: "Members", view: "members.view", create: "members.create", update: "members.manage", delete: "members.delete", adminOnlyDelete: true },
  { module: "Memberships", view: "memberships.view", create: "memberships.create", update: "memberships.manage", delete: "plans.manage", adminOnlyDelete: true },
  { module: "Bookings", view: "bookings.view", create: "bookings.manage", update: "bookings.manage", delete: "bookings.cancel", adminOnlyDelete: false },
  { module: "Social Play", view: "social.view", create: "social.manage", update: "social.manage", delete: "social.delete", adminOnlyDelete: false },
  { module: "Check-in", view: "checkin.view", create: "checkin.manage", update: "checkin.manage", delete: "checkin.override", adminOnlyDelete: false },
  { module: "POS & Bar", view: "pos.use", create: "bar.orders.create", update: "bar.tables.manage", delete: "bar.dayclose", adminOnlyDelete: true },
  { module: "Kitchen KDS", view: "kds.use", create: "kds.manage", update: "kds.manage", delete: "kds.override", adminOnlyDelete: false },
  { module: "Pro Shop", view: "shop.view", create: "shop.counter.sell", update: "shop.products.manage", delete: "shop.returns", adminOnlyDelete: false },
  { module: "Inventory", view: "inventory.view", create: "inventory.update", update: "shop.po", delete: "stock.writeoff", adminOnlyDelete: true },
  { module: "CRM Pipeline", view: "crm.leads.view", create: "crm.leads.manage", update: "crm.quotes", delete: "crm.convert", adminOnlyDelete: false },
  { module: "Finance", view: "finance.revenue.view", create: "finance.payments.record", update: "finance.invoices", delete: "finance.refund", adminOnlyDelete: true },
  { module: "Club Reports", view: "reports.view", create: "reports.export", update: "reports.schedule", delete: "reports.export.club", adminOnlyDelete: true },
];

interface AdminStaffPageProps {
  defaultTab?: "staff" | "groups" | "matrix";
}

export default function AdminStaffPage({ defaultTab = "staff" }: AdminStaffPageProps) {
  const {
    staffUsers,
    permissionGroups,
    createStaffUser,
    updateStaffGroups,
    deactivateStaff,
    promoteToAdmin,
    createPermissionGroup,
    updatePermissionGroup,
    deletePermissionGroup,
  } = useAdminConfigStore();

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Staff Drawer State
  const [isStaffDrawerOpen, setIsStaffDrawerOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffEmployeeId, setStaffEmployeeId] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // ReasonDialog State
  const [isReasonOpen, setIsReasonOpen] = useState(false);
  const [reasonActionType, setReasonActionType] = useState<"GROUP_CHANGE" | "DEACTIVATE" | "PROMOTE" | "NEW_GROUP" | "EDIT_GROUP" | "DELETE_GROUP" | null>(null);
  const [reasonTargetId, setReasonTargetId] = useState<string>("");
  const [reasonDialogTitle, setReasonDialogTitle] = useState("");

  // Promote to Admin Name confirmation modal
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [promoteCandidate, setPromoteCandidate] = useState<StaffUser | null>(null);
  const [promoteNameConfirm, setPromoteNameConfirm] = useState("");

  // Group Editor Modal State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroupKey, setEditingGroupKey] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupKey, setGroupKey] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupPermissions, setGroupPermissions] = useState<string[]>([]);

  // Filtered staff users
  const filteredStaff = useMemo(() => {
    return staffUsers.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone.includes(searchQuery);
      const matchesGroup = groupFilter === "ALL" || u.groups.includes(groupFilter);
      const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;
      return matchesSearch && matchesGroup && matchesStatus;
    });
  }, [staffUsers, searchQuery, groupFilter, statusFilter]);

  // Handle open create staff
  const handleOpenCreateStaff = () => {
    setEditingStaff(null);
    setStaffName("");
    setStaffEmail("");
    setStaffPhone("");
    setStaffEmployeeId("");
    setSelectedGroups(["FRONT_DESK"]);
    setIsStaffDrawerOpen(true);
  };

  // Handle open edit staff
  const handleOpenEditStaff = (user: StaffUser) => {
    setEditingStaff(user);
    setStaffName(user.name);
    setStaffEmail(user.email);
    setStaffPhone(user.phone);
    setStaffEmployeeId(user.employeeId || "");
    setSelectedGroups([...user.groups]);
    setIsStaffDrawerOpen(true);
  };

  const toggleGroupSelection = (key: string) => {
    if (selectedGroups.includes(key)) {
      setSelectedGroups(selectedGroups.filter((g) => g !== key));
    } else {
      setSelectedGroups([...selectedGroups, key]);
    }
  };

  // Submit staff drawer
  const handleSaveStaffDrawer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffEmail.trim()) return;

    if (editingStaff) {
      // If groups changed, mandate ReasonDialog
      const groupsChanged =
        JSON.stringify(editingStaff.groups.sort()) !== JSON.stringify(selectedGroups.sort());
      if (groupsChanged) {
        setReasonActionType("GROUP_CHANGE");
        setReasonTargetId(editingStaff.id);
        setReasonDialogTitle(`Authorize Group Change for ${editingStaff.name}`);
        setIsReasonOpen(true);
        return;
      }
      setIsStaffDrawerOpen(false);
      toast.success(`Staff user ${staffName} updated.`);
    } else {
      createStaffUser({
        name: staffName.trim(),
        email: staffEmail.trim(),
        phone: staffPhone.trim() || "+91 98200 00000",
        groups: selectedGroups,
        employeeId: staffEmployeeId.trim() || undefined,
      });
      setIsStaffDrawerOpen(false);
    }
  };

  // Row actions
  const handleTriggerDeactivate = (user: StaffUser) => {
    if (user.isSelf) {
      toast.error("Security violation: You cannot deactivate your own logged-in administrator account.");
      return;
    }
    const adminCount = staffUsers.filter((s) => s.role === "ADMIN" && s.status === "ACTIVE").length;
    if (user.role === "ADMIN" && adminCount <= 1) {
      toast.error("Security policy: Cannot deactivate the sole remaining club administrator.");
      return;
    }

    setReasonActionType("DEACTIVATE");
    setReasonTargetId(user.id);
    setReasonDialogTitle(`Deactivate Account for ${user.name}`);
    setIsReasonOpen(true);
  };

  const handleTriggerPromote = (user: StaffUser) => {
    setPromoteCandidate(user);
    setPromoteNameConfirm("");
    setIsPromoteModalOpen(true);
  };

  const handleConfirmPromoteStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoteCandidate) return;
    if (promoteNameConfirm.trim().toLowerCase() !== promoteCandidate.name.trim().toLowerCase()) {
      toast.error(`Confirmation mismatch. You must type "${promoteCandidate.name}" exactly.`);
      return;
    }
    setIsPromoteModalOpen(false);
    setReasonActionType("PROMOTE");
    setReasonTargetId(promoteCandidate.id);
    setReasonDialogTitle(`Promote ${promoteCandidate.name} to Administrator`);
    setIsReasonOpen(true);
  };

  // Group Editor Modal actions
  const handleOpenCreateGroup = () => {
    setEditingGroupKey(null);
    setGroupName("");
    setGroupKey("");
    setGroupDescription("");
    setGroupPermissions(["members.view", "bookings.view"]);
    setIsGroupModalOpen(true);
  };

  const handleOpenEditGroup = (group: PermissionGroupDef) => {
    setEditingGroupKey(group.key);
    setGroupName(group.name);
    setGroupKey(group.key);
    setGroupDescription(group.description);
    setGroupPermissions([...group.permissions]);
    setIsGroupModalOpen(true);
  };

  const toggleGroupPermission = (perm: string) => {
    if (groupPermissions.includes(perm)) {
      setGroupPermissions(groupPermissions.filter((p) => p !== perm));
    } else {
      setGroupPermissions([...groupPermissions, perm]);
    }
  };

  const toggleRowAllPermissions = (cat: typeof MODULE_PERMISSIONS_CATALOG[0]) => {
    const rowPerms = [cat.view, cat.create, cat.update];
    if (!cat.adminOnlyDelete) rowPerms.push(cat.delete);

    const allSelected = rowPerms.every((p) => groupPermissions.includes(p));
    if (allSelected) {
      setGroupPermissions(groupPermissions.filter((p) => !rowPerms.includes(p)));
    } else {
      const merged = Array.from(new Set([...groupPermissions, ...rowPerms]));
      setGroupPermissions(merged);
    }
  };

  const handleSaveGroupModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !groupKey.trim()) return;

    if (editingGroupKey) {
      setReasonActionType("EDIT_GROUP");
      setReasonTargetId(editingGroupKey);
      setReasonDialogTitle(`Authorize Modifications to Group ${editingGroupKey}`);
      setIsReasonOpen(true);
    } else {
      setReasonActionType("NEW_GROUP");
      setReasonTargetId(groupKey);
      setReasonDialogTitle(`Authorize Creation of Group ${groupKey}`);
      setIsReasonOpen(true);
    }
  };

  const handleDeleteGroupClick = (group: PermissionGroupDef) => {
    if (group.isDefault) {
      toast.error("Standard core permission groups cannot be deleted.");
      return;
    }
    const assignedCount = staffUsers.filter((s) => s.groups.includes(group.key)).length;
    if (assignedCount > 0) {
      toast.error(`Cannot delete group: Currently assigned to ${assignedCount} active staff member(s).`);
      return;
    }

    setReasonActionType("DELETE_GROUP");
    setReasonTargetId(group.key);
    setReasonDialogTitle(`Authorize Deletion of Group ${group.name}`);
    setIsReasonOpen(true);
  };

  // Consolidated ReasonDialog Confirmation
  const handleReasonConfirm = (reason: string) => {
    if (reasonActionType === "GROUP_CHANGE") {
      updateStaffGroups(reasonTargetId, selectedGroups, reason);
      setIsStaffDrawerOpen(false);
    } else if (reasonActionType === "DEACTIVATE") {
      deactivateStaff(reasonTargetId, reason);
    } else if (reasonActionType === "PROMOTE") {
      promoteToAdmin(reasonTargetId, reason);
      setPromoteCandidate(null);
    } else if (reasonActionType === "NEW_GROUP") {
      createPermissionGroup(
        {
          key: groupKey,
          name: groupName,
          description: groupDescription,
          permissions: groupPermissions,
        },
        reason
      );
      setIsGroupModalOpen(false);
    } else if (reasonActionType === "EDIT_GROUP") {
      updatePermissionGroup(
        reasonTargetId,
        {
          name: groupName,
          description: groupDescription,
          permissions: groupPermissions,
        },
        reason
      );
      setIsGroupModalOpen(false);
    } else if (reasonActionType === "DELETE_GROUP") {
      deletePermissionGroup(reasonTargetId, reason);
    }

    setIsReasonOpen(false);
    setReasonActionType(null);
  };

  // Export Access Matrix as CSV
  const handleExportMatrixCSV = () => {
    const headers = ["Module", "Screen / Path", "Member Access", ...permissionGroups.map((g) => g.key), "Admin Access"];
    const rows = ACCESS_MATRIX_DATA.map((row) => [
      `"${row.module}"`,
      `"${row.screen}"`,
      `"${row.memberAccess}"`,
      ...permissionGroups.map((g) => `"${row.groupAccess[g.key] || "—"}"`),
      `"${row.adminAccess}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ccms_access_control_matrix_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Access matrix exported as CSV!");
  };

  // Staff Table Columns
  const staffColumns: Column<StaffUser>[] = [
    {
      key: "user",
      header: "Staff Member",
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-volt-400 text-ink-900 font-bold text-xs shrink-0">
            {u.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-white flex items-center gap-1.5">
              {u.name}
              {u.isSelf && (
                <span className="text-[10px] font-mono text-volt-400 bg-volt-400/10 px-1.5 py-0.2 rounded border border-volt-400/20">
                  You (Admin)
                </span>
              )}
            </span>
            <span className="text-[11px] text-white/50">{u.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Primary Role",
      render: (u) => (
        <StatusPill variant={u.role === "ADMIN" ? "volt" : "info"}>
          {u.role === "ADMIN" ? "ADMIN (Full Access)" : "STAFF"}
        </StatusPill>
      ),
    },
    {
      key: "groups",
      header: "Permission Capability Groups",
      render: (u) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {u.role === "ADMIN" ? (
            <span className="text-[11px] text-volt-400 font-medium">Bypasses Group Checks</span>
          ) : u.groups.length === 0 ? (
            <span className="text-[11px] text-white/40 italic">No groups assigned</span>
          ) : (
            u.groups.map((g) => (
              <span
                key={g}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/8 text-white/90 border border-white/10"
              >
                {g}
              </span>
            ))
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Account State",
      render: (u) => (
        <StatusPill variant={u.status === "ACTIVE" ? "success" : "neutral"}>
          {u.status}
        </StatusPill>
      ),
    },
    {
      key: "lastLogin",
      header: "Last Session",
      render: (u) => (
        <span className="text-xs text-white/60">
          {u.lastLogin === "Never"
            ? "Never"
            : new Date(u.lastLogin).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Governance Actions",
      align: "right",
      render: (u) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEditStaff(u)}
            disabled={u.isSelf && u.role === "ADMIN"}
            title={u.isSelf ? "Self-edit blocked by security policy" : "Edit user & groups"}
            className="text-xs text-white/80 hover:text-white"
          >
            <Edit2 className="size-3.5" />
          </Button>

          {u.role !== "ADMIN" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTriggerPromote(u)}
              title="Promote to Administrator"
              className="text-xs text-volt-400 hover:text-volt-300"
            >
              <Award className="size-3.5" />
            </Button>
          )}

          {u.status === "ACTIVE" && !u.isSelf && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTriggerDeactivate(u)}
              title="Deactivate account"
              className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
            >
              <UserX className="size-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Directory, Groups & Access Matrix"
        subtitle="Manage authenticated staff accounts, capability group assignments, granular module authorization grids, and privilege escalation guards."
        actions={
          activeTab === "staff" ? (
            <Button variant="primary" onClick={handleOpenCreateStaff} className="gap-2">
              <PlusCircle className="size-4" />
              <span>Create Staff User</span>
            </Button>
          ) : activeTab === "groups" ? (
            <Button variant="primary" onClick={handleOpenCreateGroup} className="gap-2">
              <PlusCircle className="size-4" />
              <span>New Permission Group</span>
            </Button>
          ) : (
            <Button variant="secondary" onClick={handleExportMatrixCSV} className="gap-2">
              <Download className="size-4" />
              <span>Export Matrix (CSV)</span>
            </Button>
          )
        }
      />

      {/* Primary Tab Navigation */}
      <div className="flex justify-start">
        <Tabs tabs={TABS} activeId={activeTab} onChange={setActiveTab} />
      </div>

      {/* ─── TAB 1: STAFF USERS ────────────────────────────────────────── */}
      {activeTab === "staff" && (
        <div className="space-y-4">
          {/* Privilege Escalation Safeguard Banner */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-start gap-3">
            <ShieldAlert className="size-5 text-volt-400 shrink-0 mt-0.5" />
            <div className="text-xs text-white/80 space-y-0.5">
              <p className="font-semibold text-white">Privilege Escalation Rules Enforced</p>
              <p>
                An admin cannot alter or demote their own active login account. The last remaining
                administrator cannot be removed. Promoting any staff account to Administrator
                requires typing their name exactly and filing a permanent compliance audit reason.
              </p>
            </div>
          </div>

          {/* Filters & Search */}
          <Card className="p-4 bg-court-500 border-white/14">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search staff name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-9 pr-4 rounded-xl bg-white/8 border border-white/18 text-sm text-white placeholder-white/40 focus:outline-none focus:border-volt-400"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-white/60">Group:</span>
                  <select
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                    className="h-10 px-3 rounded-lg bg-navy-800 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
                  >
                    <option value="ALL">All Groups</option>
                    {permissionGroups.map((g) => (
                      <option key={g.key} value={g.key}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-white/60">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 px-3 rounded-lg bg-navy-800 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active Only</option>
                    <option value="INACTIVE">Deactivated</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Staff Table */}
          <Card className="p-0 overflow-hidden bg-court-500 border-white/14">
            <Table
              data={filteredStaff}
              columns={staffColumns}
              keyExtractor={(item) => item.id}
              emptyTitle="No Staff Accounts Found"
              emptySubtitle="No accounts match your current search and group filter."
            />
          </Card>
        </div>
      )}

      {/* ─── TAB 2: PERMISSION GROUPS ──────────────────────────────────── */}
      {activeTab === "groups" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {permissionGroups.map((group) => {
              const assignedCount = staffUsers.filter((s) => s.groups.includes(group.key)).length;
              return (
                <Card
                  key={group.id}
                  className="p-5 bg-court-500 border-white/14 flex flex-col justify-between space-y-4 hover:border-volt-400/40 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs text-volt-400 font-bold bg-volt-400/10 px-2 py-0.5 rounded border border-volt-400/20">
                        {group.key}
                      </span>
                      {group.isDefault && (
                        <span className="text-[10px] text-white/50 bg-white/10 px-2 py-0.5 rounded">
                          Core Default
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white mt-2">{group.name}</h3>
                    <p className="text-xs text-white/70 mt-1 leading-relaxed line-clamp-2">
                      {group.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
                      <span>Assigned Staff: <strong className="text-white">{assignedCount}</strong></span>
                      <span>Permissions: <strong className="text-volt-400">{group.permissions.length}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                    {!group.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGroupClick(group)}
                        className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                      >
                        <Trash2 className="size-3.5 mr-1" />
                        Delete
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenEditGroup(group)}
                      className="text-xs gap-1"
                    >
                      <Edit2 className="size-3.5" />
                      <span>Configure Matrix</span>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 3: ACCESS MATRIX ──────────────────────────────────────── */}
      {activeTab === "matrix" && (
        <Card className="p-0 overflow-hidden bg-court-500 border-white/14">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Full Capability Matrix</h3>
              <p className="text-xs text-white/60">
                Consolidated matrix of screen and API capability access by role and staff permission group.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleExportMatrixCSV} className="gap-2 text-xs">
              <Download className="size-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-court-700 text-white/80 font-mono uppercase text-[11px]">
                <tr>
                  <th className="p-3 border-b border-white/10">Module</th>
                  <th className="p-3 border-b border-white/10">Console Screen / URL</th>
                  <th className="p-3 border-b border-white/10 text-center">Member</th>
                  {permissionGroups.map((g) => (
                    <th key={g.key} className="p-3 border-b border-white/10 text-center">
                      {g.key}
                    </th>
                  ))}
                  <th className="p-3 border-b border-white/10 text-center text-volt-400 font-bold">
                    ADMIN
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8 text-white/90">
                {ACCESS_MATRIX_DATA.map((row, idx) => (
                  <tr key={row.path} className={idx % 2 === 1 ? "bg-court-600/30" : "bg-court-500"}>
                    <td className="p-3 font-semibold text-white">{row.module}</td>
                    <td className="p-3 font-mono text-[11px] text-white/70">{row.screen}</td>
                    <td className="p-3 text-center">
                      {row.memberAccess === "✓" ? (
                        <Check className="size-4 text-emerald-400 mx-auto" />
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                    {permissionGroups.map((g) => {
                      const access = row.groupAccess[g.key] || "—";
                      return (
                        <td key={g.key} className="p-3 text-center">
                          {access.includes("✓") ? (
                            <span className="font-semibold text-emerald-400">{access}</span>
                          ) : (
                            <span className="text-white/30">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-3 text-center text-volt-400 font-bold">
                      <Check className="size-4 text-volt-400 mx-auto stroke-[2.5]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ─── CREATE / EDIT STAFF DRAWER ─────────────────────────────────── */}
      <Drawer
        isOpen={isStaffDrawerOpen}
        onClose={() => setIsStaffDrawerOpen(false)}
        title={editingStaff ? "Edit Staff Account" : "Provision Staff Account"}
        subtitle="Configure profile details, assign permission groups, and preview live effective capabilities."
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="ghost" onClick={() => setIsStaffDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveStaffDrawer}>
              {editingStaff ? "Save Permissions" : "Create Staff Account"}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveStaffDrawer} className="space-y-4">
          <Input
            label="Staff Full Name *"
            placeholder="e.g. Ramesh Kumar"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Staff Email *"
              type="email"
              placeholder="ramesh@championsclub.in"
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
              required
            />
            <Input
              label="Contact Phone"
              placeholder="+91 98200 00000"
              value={staffPhone}
              onChange={(e) => setStaffPhone(e.target.value)}
            />
          </div>

          <Input
            label="HR Employee Record ID (Optional)"
            placeholder="e.g. EMP-008"
            value={staffEmployeeId}
            onChange={(e) => setStaffEmployeeId(e.target.value)}
          />

          {/* Group Checkboxes */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Assigned Capability Groups
              </label>
              <span className="text-[11px] text-volt-400 font-mono">
                {selectedGroups.length} selected
              </span>
            </div>

            <div className="space-y-2">
              {permissionGroups.map((group) => {
                const isChecked = selectedGroups.includes(group.key);
                return (
                  <label
                    key={group.id}
                    className={`flex items-start justify-between p-3 rounded-xl cursor-pointer border text-xs transition-colors ${
                      isChecked
                        ? "bg-volt-400/10 border-volt-400/40 text-white"
                        : "bg-white/4 border-white/10 text-white/70 hover:bg-white/8"
                    }`}
                  >
                    <div className="space-y-0.5 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{group.name}</span>
                        <span className="font-mono text-[10px] text-volt-400">({group.key})</span>
                      </div>
                      <p className="text-[11px] text-white/60 leading-relaxed">{group.description}</p>
                      <span className="text-[10px] text-volt-300 block pt-0.5">
                        {group.permissions.length} granular permissions
                      </span>
                    </div>

                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleGroupSelection(group.key)}
                      className="accent-volt-400 size-4 mt-1 shrink-0"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Live Effective Permissions Accordion */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Live Effective Capabilities Accordion
            </span>
            <p className="text-[11px] text-white/60">
              Computed capabilities updated dynamically as groups are checked above.
            </p>

            <div className="rounded-xl bg-white/4 border border-white/10 divide-y divide-white/8 overflow-hidden text-xs">
              {MODULE_PERMISSIONS_CATALOG.map((cat) => {
                const isOpen = !!expandedModules[cat.module];
                return (
                  <div key={cat.module}>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedModules((prev) => ({ ...prev, [cat.module]: !prev[cat.module] }))
                      }
                      className="w-full p-2.5 flex items-center justify-between text-left hover:bg-white/6 text-white font-medium"
                    >
                      <span>{cat.module} Module</span>
                      <ChevronDown
                        className={`size-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="p-3 bg-navy-950/40 space-y-1.5 font-mono text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-white/60">View / Inspect:</span>
                          <span className="text-emerald-400">{cat.view}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/60">Create / Record:</span>
                          <span className="text-volt-400">{cat.create}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/60">Modify / Update:</span>
                          <span className="text-blue-400">{cat.update}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/60">Delete / Approve:</span>
                          <span className={cat.adminOnlyDelete ? "text-amber-400" : "text-rose-400"}>
                            {cat.delete} {cat.adminOnlyDelete && "(Admin Locked)"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      </Drawer>

      {/* ─── GROUP PERMISSION MATRIX MODAL ─────────────────────────────── */}
      <Modal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        maxWidth="lg"
        title={editingGroupKey ? `Configure Permissions: ${editingGroupKey}` : "Create Permission Group"}
        subtitle="Select module capabilities. Admin-only actions are greyed and locked per compliance rules."
      >
        <form onSubmit={handleSaveGroupModal} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Impact Banner */}
          {editingGroupKey && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-200">
              <AlertTriangle className="size-4 text-amber-400 shrink-0" />
              <span>
                Impact Notice: Modifying this group immediately alters capabilities for{" "}
                <strong>{staffUsers.filter((s) => s.groups.includes(editingGroupKey)).length} active staff user(s)</strong>.
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Group Name *"
              placeholder="e.g. Pro Shop Senior Cashiers"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
            <Input
              label="System Key (UPPER_SNAKE) *"
              placeholder="e.g. SHOP_CASHIERS"
              value={groupKey}
              onChange={(e) => setGroupKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"))}
              disabled={!!editingGroupKey}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80 mb-1.5">
              Group Operational Description *
            </label>
            <textarea
              rows={2}
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/8 border border-white/18 text-xs text-white placeholder-white/40 focus:outline-none focus:border-volt-400"
              required
            />
          </div>

          {/* Granular Permission Matrix */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Module Capability Matrix
              </span>
              <span className="text-[11px] text-volt-400">
                {groupPermissions.length} permissions granted
              </span>
            </div>

            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-court-700 text-white/70 uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Module</th>
                    <th className="p-2.5 text-center">View</th>
                    <th className="p-2.5 text-center">Create</th>
                    <th className="p-2.5 text-center">Update</th>
                    <th className="p-2.5 text-center">Delete / Approve</th>
                    <th className="p-2.5 text-center">Row Select</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8 text-white/90">
                  {MODULE_PERMISSIONS_CATALOG.map((cat) => (
                    <tr key={cat.module} className="hover:bg-white/4">
                      <td className="p-2.5 font-medium">{cat.module}</td>
                      <td className="p-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={groupPermissions.includes(cat.view)}
                          onChange={() => toggleGroupPermission(cat.view)}
                          className="accent-volt-400 size-4"
                        />
                      </td>
                      <td className="p-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={groupPermissions.includes(cat.create)}
                          onChange={() => toggleGroupPermission(cat.create)}
                          className="accent-volt-400 size-4"
                        />
                      </td>
                      <td className="p-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={groupPermissions.includes(cat.update)}
                          onChange={() => toggleGroupPermission(cat.update)}
                          className="accent-volt-400 size-4"
                        />
                      </td>
                      <td className="p-2.5 text-center">
                        {cat.adminOnlyDelete ? (
                          <div className="flex items-center justify-center text-white/40" title="Admin only approval required">
                            <Lock className="size-3.5 text-amber-400/80" />
                          </div>
                        ) : (
                          <input
                            type="checkbox"
                            checked={groupPermissions.includes(cat.delete)}
                            onChange={() => toggleGroupPermission(cat.delete)}
                            className="accent-volt-400 size-4"
                          />
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleRowAllPermissions(cat)}
                          className="text-[10px] text-volt-400 hover:underline font-mono"
                        >
                          Toggle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setIsGroupModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Authorize Group Policy
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── PROMOTE TO ADMIN NAME CONFIRMATION MODAL ───────────────────── */}
      {promoteCandidate && (
        <Modal
          isOpen={isPromoteModalOpen}
          onClose={() => setIsPromoteModalOpen(false)}
          title="Confirm Administrator Promotion"
          subtitle="Security policy requires explicit name confirmation before escalating full club permissions."
        >
          <form onSubmit={handleConfirmPromoteStep1} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
              <p className="font-bold text-amber-400">High-Privilege Escalation Notice</p>
              <p>
                Promoting <strong>{promoteCandidate.name}</strong> will grant unrestricted access
                to the Owner Dashboard, financial books, staff management, and system configuration.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Type candidate&apos;s name &ldquo;<strong>{promoteCandidate.name}</strong>&rdquo; to confirm *
              </label>
              <Input
                placeholder={promoteCandidate.name}
                value={promoteNameConfirm}
                onChange={(e) => setPromoteNameConfirm(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <Button type="button" variant="ghost" onClick={() => setIsPromoteModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={promoteNameConfirm.trim().toLowerCase() !== promoteCandidate.name.trim().toLowerCase()}
              >
                Proceed to Audit Reason
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MANDATORY REASON DIALOG FOR AUDITED PRIVILEGE ACTIONS ──────── */}
      <ReasonDialog
        isOpen={isReasonOpen}
        onClose={() => setIsReasonOpen(false)}
        onConfirm={handleReasonConfirm}
        title={reasonDialogTitle}
        description="This action alters club security access and is recorded permanently in the compliance audit trail."
        actionLabel="Confirm & Record Audit"
        variant="primary"
      />
    </div>
  );
}
