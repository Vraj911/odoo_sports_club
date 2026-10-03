import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { AppLink } from "@/app/router/links";
import { useAdminConfigStore } from "../adminConfigStore";
import { useAdminAuditStore } from "../adminAuditStore";
import {
  Building2,
  LandPlot,
  Timer,
  BadgeCheck,
  BadgeIndianRupee,
  Calculator,
  MessageSquare,
  CalendarOff,
  Coins,
  MailCheck,
  UserCog,
  ShieldCheck,
  History,
  Sprout,
  ArrowRight,
  Shield,
  Activity,
  Layers,
} from "lucide-react";

export default function AdminOverviewPage() {
  const {
    profile,
    courts,
    sports,
    plans,
    pricingRules,
    taxes,
    socialTemplates,
    leaveTypes,
    salaryComponents,
    notificationTemplates,
    staffUsers,
    permissionGroups,
  } = useAdminConfigStore();

  const { entries: auditEntries } = useAdminAuditStore();

  const tiles = [
    {
      title: "Club Profile & Billing Series",
      subtitle: `${profile.name} · GSTIN & Next Inv #${profile.nextInvoiceNumber}`,
      path: "/admin/club",
      icon: Building2,
      badge: "Configured",
      badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Courts & Facility Inventory",
      subtitle: `${courts.length} Courts across ${sports.length} Sport Types`,
      path: "/admin/courts",
      icon: LandPlot,
      badge: `${courts.filter((c) => c.status === "OPERATIONAL").length} Operational`,
      badgeColor: "text-volt-400 bg-volt-400/10 border-volt-400/20",
    },
    {
      title: "Hours, Holidays & Booking Rules",
      subtitle: "Daily operating windows, 12h cancellation, 2-booking daily cap",
      path: "/admin/hours",
      icon: Timer,
      badge: "Open 06:00 - 22:00",
      badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Membership Plans & Entitlements",
      subtitle: `${plans.length} Tiers (Gold, Silver, Junior, Trial) · Rate Matrix`,
      path: "/admin/plans",
      icon: BadgeCheck,
      badge: "Active Tiers",
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Pricing Rules & Price Simulator",
      subtitle: `${pricingRules.length} Specificity Rules · Tier Hierarchy Validation`,
      path: "/admin/pricing",
      icon: BadgeIndianRupee,
      badge: "Simulator Active",
      badgeColor: "text-volt-400 bg-volt-400/10 border-volt-400/20",
    },
    {
      title: "Taxation & GST Rates (HSN/SAC)",
      subtitle: `${taxes.length} Statutory Categories · Inclusive/Exclusive Rules`,
      path: "/admin/taxes",
      icon: Calculator,
      badge: "18% / 12% / 5%",
      badgeColor: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    },
    {
      title: "Social Play Session Templates",
      subtitle: `${socialTemplates.length} Recurring Weekly Ladders & Americano Mixers`,
      path: "/admin/social-templates",
      icon: MessageSquare,
      badge: "Weekly Friday/Sat",
      badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "Staff Leave Entitlement Policies",
      subtitle: `${leaveTypes.length} Categorized Leave Types (Casual, Sick, Comp-off)`,
      path: "/admin/leave-types",
      icon: CalendarOff,
      badge: "HR Policy",
      badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
    {
      title: "Salary Structure Components",
      subtitle: `${salaryComponents.length} Monthly Pay Heads · Fixed & Percentage Formulas`,
      path: "/admin/salary-components",
      icon: Coins,
      badge: "PF / ESI / TDS",
      badgeColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      title: "Notification Triggers & Channels",
      subtitle: `${notificationTemplates.length} Templates · Email, In-App, WhatsApp Logs`,
      path: "/admin/notification-templates",
      icon: MailCheck,
      badge: "Automated",
      badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Staff Directory & Access Control",
      subtitle: `${staffUsers.length} Users · Capability Assignment & Self-Protection Rules`,
      path: "/admin/staff",
      icon: UserCog,
      badge: "3 Roles / Groups",
      badgeColor: "text-volt-400 bg-volt-400/10 border-volt-400/20",
    },
    {
      title: "Permission Groups & Access Matrix",
      subtitle: `${permissionGroups.length} Groups · Matrix Grid & Live Permission Accordion`,
      path: "/admin/permission-groups",
      icon: ShieldCheck,
      badge: "Granular RBAC",
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Immutable Compliance Audit Log",
      subtitle: `${auditEntries.length} Audited Sensitive Events with Before/After JSON Diffs`,
      path: "/admin/audit-log",
      icon: History,
      badge: "Tamper-Proof",
      badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Demo Data & Scene Guided Scripts",
      subtitle: "Reset sandbox data & launch 7 SRS scripted interactive scenes",
      path: "/admin/seed",
      icon: Sprout,
      badge: "7 Demo Scenes",
      badgeColor: "text-volt-400 bg-volt-400/10 border-volt-400/20",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Club Governance & System Administration"
        subtitle="Configure facilities, operating hours, membership plans, pricing simulation, staff capability groups, and compliance audit logs."
        actions={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-volt-400/10 border border-volt-400/30 text-xs font-semibold text-volt-400">
              <Shield className="size-3.5" />
              <span>Full Admin Bypass</span>
            </span>
          </div>
        }
      />

      {/* Quick Summary Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 bg-court-500 border-white/14">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/70">Club Facilities</span>
            <LandPlot className="size-4 text-volt-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{courts.length} Courts</div>
          <span className="text-[11px] text-white/50">{sports.length} Active Sports</span>
        </Card>

        <Card className="p-4 bg-court-500 border-white/14">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/70">Membership Tiers</span>
            <BadgeCheck className="size-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{plans.length} Tiers</div>
          <span className="text-[11px] text-white/50">Gold, Silver, Junior, Trial</span>
        </Card>

        <Card className="p-4 bg-court-500 border-white/14">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/70">Staff Accounts</span>
            <UserCog className="size-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-400">{staffUsers.length} Users</div>
          <span className="text-[11px] text-white/50">Across {permissionGroups.length} capability groups</span>
        </Card>

        <Card className="p-4 bg-court-500 border-white/14">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/70">Audit Trail Entries</span>
            <History className="size-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-400">{auditEntries.length} Records</div>
          <span className="text-[11px] text-white/50">Immutable before/after diffs</span>
        </Card>
      </div>

      {/* Administration Tiles Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <AppLink
              key={tile.path}
              to={tile.path}
              className="group block"
            >
              <Card className="h-full p-5 bg-court-500 border-white/14 transition-all duration-200 hover:-translate-y-1 hover:border-volt-400/40 hover:shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-white/8 border border-white/14 text-volt-400 transition-colors group-hover:bg-volt-400 group-hover:text-ink-900 group-hover:border-volt-400">
                      <Icon className="size-5" />
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${tile.badgeColor}`}
                    >
                      {tile.badge}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-semibold text-white group-hover:text-volt-400 transition-colors">
                    {tile.title}
                  </h3>
                  <p className="mt-1 text-xs text-white/70 leading-relaxed">
                    {tile.subtitle}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-medium text-white/50 group-hover:text-volt-400 transition-colors">
                  <span>Manage Settings</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </AppLink>
          );
        })}
      </div>
    </div>
  );
}
