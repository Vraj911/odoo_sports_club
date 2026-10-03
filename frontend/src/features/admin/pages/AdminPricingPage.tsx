import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Drawer } from "@/components/ui/Drawer";
import { StatusPill } from "@/components/ui/StatusPill";
import { Table, type Column } from "@/components/ui/Table";
import { useAdminConfigStore } from "../adminConfigStore";
import type { PricingRule } from "../types";
import {
  BadgeIndianRupee,
  PlusCircle,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { toast } from "@/components/ui/Toast";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminPricingPage() {
  const { pricingRules, sports, addPricingRule, updatePricingRule, deletePricingRule, simulatePrice } =
    useAdminConfigStore();

  // Drawer form state for Adding/Editing rule
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const [ruleSport, setRuleSport] = useState("tennis");
  const [ruleCustomerType, setRuleCustomerType] = useState<PricingRule["customerType"]>("GUEST");
  const [ruleDayType, setRuleDayType] = useState<PricingRule["dayType"]>("ALL");
  const [ruleTimeBand, setRuleTimeBand] = useState<PricingRule["timeBand"]>("ALL");
  const [ruleValidFrom, setRuleValidFrom] = useState("2026-01-01");
  const [ruleValidTo, setRuleValidTo] = useState("2026-12-31");
  const [rulePrice, setRulePrice] = useState<number>(600);
  const [rulePriority, setRulePriority] = useState<number>(5);
  const [ruleNotes, setRuleNotes] = useState("");

  // Price Simulator state
  const [simSport, setSimSport] = useState("tennis");
  const [simCustomer, setSimCustomer] = useState<"GOLD" | "SILVER" | "JUNIOR" | "GUEST">("SILVER");
  const [simDayType, setSimDayType] = useState<"WEEKDAY" | "WEEKEND" | "HOLIDAY">("WEEKDAY");
  const [simTimeBand, setSimTimeBand] = useState<"PEAK" | "OFF_PEAK">("PEAK");
  const [simDate, setSimDate] = useState("2026-10-05");

  // Run live simulation
  const simulation = useMemo(() => {
    return simulatePrice({
      sport: simSport,
      customerType: simCustomer,
      dayType: simDayType,
      timeBand: simTimeBand,
      date: simDate,
    });
  }, [simulatePrice, simSport, simCustomer, simDayType, simTimeBand, simDate]);

  const handleOpenCreateDrawer = () => {
    setEditingRuleId(null);
    setRuleSport("tennis");
    setRuleCustomerType("GUEST");
    setRuleDayType("ALL");
    setRuleTimeBand("ALL");
    setRuleValidFrom("2026-01-01");
    setRuleValidTo("2026-12-31");
    setRulePrice(600);
    setRulePriority(5);
    setRuleNotes("");
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (rule: PricingRule) => {
    setEditingRuleId(rule.id);
    setRuleSport(rule.sport);
    setRuleCustomerType(rule.customerType);
    setRuleDayType(rule.dayType);
    setRuleTimeBand(rule.timeBand);
    setRuleValidFrom(rule.validFrom);
    setRuleValidTo(rule.validTo);
    setRulePrice(rule.pricePerHour);
    setRulePriority(rule.priority);
    setRuleNotes(rule.notes || "");
    setIsDrawerOpen(true);
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRuleId) {
      updatePricingRule(editingRuleId, {
        sport: ruleSport,
        customerType: ruleCustomerType,
        dayType: ruleDayType,
        timeBand: ruleTimeBand,
        validFrom: ruleValidFrom,
        validTo: ruleValidTo,
        pricePerHour: rulePrice,
        priority: rulePriority,
        notes: ruleNotes.trim() || undefined,
      });
    } else {
      addPricingRule({
        sport: ruleSport,
        customerType: ruleCustomerType,
        dayType: ruleDayType,
        timeBand: ruleTimeBand,
        validFrom: ruleValidFrom,
        validTo: ruleValidTo,
        pricePerHour: rulePrice,
        priority: rulePriority,
        notes: ruleNotes.trim() || undefined,
      });
    }
    setIsDrawerOpen(false);
  };

  const columns: Column<PricingRule>[] = [
    {
      key: "id",
      header: "Rule Ref",
      render: (r) => <span className="font-mono text-xs text-volt-400">{r.id}</span>,
    },
    {
      key: "sport",
      header: "Sport",
      render: (r) => (
        <span className="text-xs font-semibold text-white capitalize">
          {r.sport === "all" ? "All Sports" : r.sport}
        </span>
      ),
    },
    {
      key: "customer",
      header: "Customer Tier",
      render: (r) => {
        let variant: "volt" | "info" | "warning" | "neutral" = "neutral";
        if (r.customerType === "GOLD") variant = "volt";
        if (r.customerType === "SILVER") variant = "info";
        if (r.customerType === "GUEST") variant = "warning";
        return <StatusPill variant={variant}>{r.customerType}</StatusPill>;
      },
    },
    {
      key: "criteria",
      header: "Day / Time Band",
      render: (r) => (
        <div className="flex flex-col text-xs">
          <span className="text-white/90">{r.dayType}</span>
          <span className="text-[11px] text-white/50">{r.timeBand}</span>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price / Hour",
      render: (r) => (
        <span className="font-bold text-sm text-volt-400">
          {r.pricePerHour === 0 ? "₹0 (Free)" : formatCurrency(r.pricePerHour)}
        </span>
      ),
    },
    {
      key: "validity",
      header: "Validity Window",
      render: (r) => (
        <span className="font-mono text-[11px] text-white/60">
          {r.validFrom} to {r.validTo}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEditDrawer(r)}
            className="text-xs text-white/70 hover:text-white"
          >
            <Edit2 className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deletePricingRule(r.id)}
            className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Court Pricing Rules & Simulation"
        subtitle="Granular rule hierarchy: Sport × Customer Tier × Day × Time band. Most-specific wins with strict Guest ≥ Silver ≥ Gold tier ordering protection."
        actions={
          <Button variant="primary" onClick={handleOpenCreateDrawer} className="gap-2">
            <PlusCircle className="size-4" />
            <span>Add Pricing Rule</span>
          </Button>
        }
      />

      {/* Simulator Panel (Top Highlight) */}
      <Card className="p-6 bg-court-500 border-white/14 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-volt-400/20 text-volt-400">
              <Calculator className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Live Price Simulator</h3>
              <p className="text-xs text-white/70">
                Test court tariff resolution and verify winning rule specificity in real time.
              </p>
            </div>
          </div>

          <span className="text-[11px] font-semibold text-volt-400 bg-volt-400/10 px-2.5 py-1 rounded-full border border-volt-400/20">
            &ldquo;Most Specific Wins&rdquo; Hierarchy
          </span>
        </div>

        {/* Validation Warning if Guest < Silver < Gold is violated */}
        {simulation.isOrderingViolated && (
          <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/15 flex items-start gap-3 text-xs text-rose-200">
            <ShieldAlert className="size-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-300">Policy Violation Detected!</p>
              <p className="mt-0.5 leading-relaxed">{simulation.orderingViolationMessage}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5">
          <div>
            <label className="block text-xs font-medium text-white/80 mb-1.5">Sport</label>
            <select
              value={simSport}
              onChange={(e) => setSimSport(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-navy-800 border border-white/18 text-xs text-white capitalize focus:outline-none focus:border-volt-400"
            >
              {sports.map((s) => (
                <option key={s.id} value={s.id} className="bg-navy-800 text-white capitalize">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80 mb-1.5">Customer Tier</label>
            <select
              value={simCustomer}
              onChange={(e) => setSimCustomer(e.target.value as any)}
              className="w-full h-11 px-3 rounded-xl bg-navy-800 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
            >
              <option value="GOLD">Gold (All-Access)</option>
              <option value="SILVER">Silver Regular</option>
              <option value="JUNIOR">Junior Academy</option>
              <option value="GUEST">Guest / Public Walk-in</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80 mb-1.5">Day Category</label>
            <select
              value={simDayType}
              onChange={(e) => setSimDayType(e.target.value as any)}
              className="w-full h-11 px-3 rounded-xl bg-navy-800 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
            >
              <option value="WEEKDAY">Weekday (Mon - Thu)</option>
              <option value="WEEKEND">Weekend (Fri - Sun)</option>
              <option value="HOLIDAY">Holiday / Special</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80 mb-1.5">Time Band</label>
            <select
              value={simTimeBand}
              onChange={(e) => setSimTimeBand(e.target.value as any)}
              className="w-full h-11 px-3 rounded-xl bg-navy-800 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
            >
              <option value="PEAK">Peak (17:00 - 22:00)</option>
              <option value="OFF_PEAK">Off-Peak (Morning/Day)</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <div className="p-3 rounded-xl bg-court-700/80 border border-white/14 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-white/60 block">Resolved Tariff:</span>
                <span className="text-xl font-bold text-volt-400">
                  {simulation.finalPrice === 0 ? "₹0 (Free)" : formatCurrency(simulation.finalPrice)}
                </span>
              </div>
              <span className="text-[11px] text-white/50">/ hr</span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70 flex items-center gap-2">
          <HelpCircle className="size-4 text-volt-400 shrink-0" />
          <span>{simulation.ruleHierarchyExplanation}</span>
        </div>
      </Card>

      {/* Rules Table */}
      <Card className="p-0 overflow-hidden bg-court-500 border-white/14">
        <Table
          data={pricingRules}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyTitle="No Pricing Rules"
          emptySubtitle="No pricing rules configured."
        />
      </Card>

      {/* Create / Edit Rule Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingRuleId ? "Edit Pricing Rule" : "Create Pricing Rule"}
        subtitle="Specify sport, target member tier, day category, and hourly tariff."
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="ghost" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveRule}>
              {editingRuleId ? "Update Rule" : "Save Pricing Rule"}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveRule} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">Sport *</label>
              <select
                value={ruleSport}
                onChange={(e) => setRuleSport(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-navy-800 border border-white/18 text-xs text-white capitalize focus:outline-none focus:border-volt-400"
              >
                <option value="all">All Sports</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id} className="bg-navy-800 text-white capitalize">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Customer Tier *
              </label>
              <select
                value={ruleCustomerType}
                onChange={(e) => setRuleCustomerType(e.target.value as any)}
                className="w-full h-11 px-3 rounded-xl bg-navy-800 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
              >
                <option value="ALL">All Customers</option>
                <option value="GOLD">Gold</option>
                <option value="SILVER">Silver</option>
                <option value="JUNIOR">Junior</option>
                <option value="GUEST">Guest</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">Day Type *</label>
              <select
                value={ruleDayType}
                onChange={(e) => setRuleDayType(e.target.value as any)}
                className="w-full h-11 px-3 rounded-xl bg-navy-800 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
              >
                <option value="ALL">All Days</option>
                <option value="WEEKDAY">Weekday (Mon - Thu)</option>
                <option value="WEEKEND">Weekend (Fri - Sun)</option>
                <option value="HOLIDAY">Holiday</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">Time Band *</label>
              <select
                value={ruleTimeBand}
                onChange={(e) => setRuleTimeBand(e.target.value as any)}
                className="w-full h-11 px-3 rounded-xl bg-navy-800 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
              >
                <option value="ALL">All Hours</option>
                <option value="PEAK">Peak (17:00 - 22:00)</option>
                <option value="OFF_PEAK">Off-Peak (Daytime)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price Per Hour (₹) *"
              type="number"
              min={0}
              value={rulePrice}
              onChange={(e) => setRulePrice(Number(e.target.value))}
              required
            />

            <Input
              label="Specificity Priority (1-20)"
              type="number"
              min={1}
              max={20}
              value={rulePriority}
              onChange={(e) => setRulePriority(Number(e.target.value))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">Valid From *</label>
              <input
                type="date"
                value={ruleValidFrom}
                onChange={(e) => setRuleValidFrom(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-white/8 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">Valid To *</label>
              <input
                type="date"
                value={ruleValidTo}
                onChange={(e) => setRuleValidTo(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-white/8 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80 mb-1.5">
              Rule Justification & Notes
            </label>
            <textarea
              rows={2}
              value={ruleNotes}
              onChange={(e) => setRuleNotes(e.target.value)}
              placeholder="e.g. Approved weekend padel peak tariff with lighting surcharge"
              className="w-full p-3 rounded-xl bg-white/8 border border-white/18 text-xs text-white placeholder-white/40 focus:outline-none focus:border-volt-400"
            />
          </div>
        </form>
      </Drawer>
    </div>
  );
}
