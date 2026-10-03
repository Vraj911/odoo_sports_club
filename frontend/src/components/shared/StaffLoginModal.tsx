import {
  ClipboardList,
  Wine,
  Store,
  Contact,
  Landmark,
  CircleUser,
  ArrowRight,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/app/providers/AuthProvider";
import { useGo } from "@/app/router/links";
import type { PermissionGroup } from "@/types/common";

export interface StaffPreset {
  id: string;
  name: string;
  roleTitle: string;
  groups: PermissionGroup[];
  home: string;
  description: string;
  icon: LucideIcon;
  badge: string;
  badgeStyle: string;
}

export const STAFF_MEMBERS: StaffPreset[] = [
  {
    id: "front-desk",
    name: "Karan Joshi",
    roleTitle: "Front Desk Officer",
    groups: ["FRONT_DESK"],
    home: "/desk",
    description: "Member check-ins, court bookings, walk-in reservations, and desk billing",
    icon: ClipboardList,
    badge: "Front Desk",
    badgeStyle: "text-sky-400 bg-sky-500/10 border-sky-500/30",
  },
  {
    id: "bar-staff",
    name: "Sanjay More",
    roleTitle: "Courtside Bar Captain",
    groups: ["POS_BAR"],
    home: "/bar",
    description: "Table floor management, open bar tabs, KDS kitchen orders & shift totals",
    icon: Wine,
    badge: "POS & Bar",
    badgeStyle: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  },
  {
    id: "shop-staff",
    name: "Deepak Shah",
    roleTitle: "Pro Shop Associate",
    groups: ["SHOP_INVENTORY"],
    home: "/shop-console",
    description: "Retail point of sale, gear catalog, restock POs & racket restringing",
    icon: Store,
    badge: "Shop & Inventory",
    badgeStyle: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  },
  {
    id: "desk-crm",
    name: "Ananya Rao",
    roleTitle: "Front Desk & CRM Lead",
    groups: ["FRONT_DESK", "CRM"],
    home: "/staff",
    description: "Front desk operations + inbound member leads, trial bookings & quote pipeline",
    icon: Contact,
    badge: "Front Desk + CRM",
    badgeStyle: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  },
  {
    id: "finance-staff",
    name: "Vikram Patel",
    roleTitle: "Club Accountant",
    groups: ["FINANCE"],
    home: "/finance",
    description: "Tax invoicing, customer payment receipts, vendor bills, ledger & GST reports",
    icon: Landmark,
    badge: "Finance",
    badgeStyle: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  },
  {
    id: "unassigned-staff",
    name: "Ramesh Kumar",
    roleTitle: "General Staff (Unassigned)",
    groups: [],
    home: "/staff",
    description: "Staff shift clock-in, roster view & personal leave requests (hub view)",
    icon: CircleUser,
    badge: "No Group",
    badgeStyle: "text-chalk/60 bg-chalk/8 border-chalk/14",
  },
];

export function StaffLoginModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { loginAs } = useAuth();
  const go = useGo();

  const handleSelectStaff = (member: StaffPreset) => {
    loginAs("STAFF", member.groups, member.name);
    onClose();
    go(member.home);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Staff Member"
      subtitle="Which staff member would you like to log in as?"
      maxWidth="lg"
    >
      <div className="space-y-3 pt-1 text-chalk">
        <p className="text-xs text-chalk/70">
          Choose a staff member profile to access their authorized operational console terminals:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {STAFF_MEMBERS.map((member) => {
            const Icon = member.icon;
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => handleSelectStaff(member)}
                className="group flex flex-col justify-between rounded-[18px] border border-chalk/14 bg-court-600/90 p-4 text-left transition-all hover:border-volt-400/50 hover:bg-court-500/90 hover:shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl border border-chalk/14 bg-chalk/8 text-volt-400 group-hover:bg-volt-400 group-hover:text-ink-900 transition-colors">
                      <Icon className="size-5" />
                    </div>
                    <span
                      className={`rounded-pill border px-2 py-0.5 text-[10px] font-semibold ${member.badgeStyle}`}
                    >
                      {member.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-chalk group-hover:text-volt-400 transition-colors">
                      {member.name}
                    </h4>
                    <p className="text-[11px] font-medium text-volt-300">
                      {member.roleTitle}
                    </p>
                    <p className="mt-1 text-[11px] text-chalk/60 line-clamp-2 leading-relaxed">
                      {member.description}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-chalk/10 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-chalk/50 group-hover:text-chalk/80">
                    Terminal: {member.home}
                  </span>
                  <div className="flex items-center gap-1 font-semibold text-volt-400 group-hover:translate-x-0.5 transition-transform">
                    <span>Log In</span>
                    <ArrowRight className="size-3" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
