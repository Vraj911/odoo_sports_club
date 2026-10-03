import { useState } from "react";
import { useAppNavigate } from "@/app/router/links";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { useAdminConfigStore } from "../adminConfigStore";
import {
  RotateCcw,
  Sparkles,
  Database,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
  PlayCircle,
  Layers,
  Users,
  Shield,
  Clock,
  ArrowRight,
} from "lucide-react";
import { toast } from "@/components/ui/Toast";

const RESET_STEPS = [
  { id: "members", label: "Members & Digital QR Cards", count: "148 records" },
  { id: "courts", label: "Courts, Schedules & Tariffs", count: "6 courts, 8 pricing rules" },
  { id: "shop", label: "Pro Shop SKUs & Inventory Batches", count: "42 items, 8 restringing jobs" },
  { id: "bar", label: "Bar POS Menus & Open Tabs", count: "36 items, 4 active tables" },
  { id: "governance", label: "Staff Accounts & Audit Ledger", count: "28 users, WORM ledger" },
];

export default function AdminSeedPage() {
  const navigate = useAppNavigate();
  const { demoSteps, resetDemoData } = useAdminConfigStore();

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState("");
  const [resetReason, setResetReason] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([1, 2, 3]);

  // Handle demo data reset with staged progress animation
  const handleExecuteReset = async () => {
    if (resetConfirmInput !== "RESET") {
      toast.error('You must type "RESET" in all capitals to confirm database reset.');
      return;
    }
    if (!resetReason.trim()) {
      toast.error("A mandatory reason must be provided for audit compliance.");
      return;
    }

    setIsResetModalOpen(false);
    setIsResetting(true);
    setActiveStepIndex(0);

    // Simulate multi-step sequential database repopulation
    for (let i = 0; i < RESET_STEPS.length; i++) {
      setActiveStepIndex(i);
      await new Promise((r) => setTimeout(r, 600));
    }

    resetDemoData(resetReason);
    setIsResetting(false);
    setActiveStepIndex(-1);
    setResetConfirmInput("");
    setResetReason("");
    toast.success("Demo dataset restored and validated across all club modules!");
  };

  const toggleStepCompleted = (id: number) => {
    if (completedSteps.includes(id)) {
      setCompletedSteps(completedSteps.filter((s) => s !== id));
    } else {
      setCompletedSteps([...completedSteps, id]);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seed & Demo Script Engine"
        subtitle="Initialize realistic club data and execute the 7 SRS test journeys (CFG-04)"
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsResetModalOpen(true);
                setResetConfirmInput("");
                setResetReason("Manual demo environment reset to clean baseline.");
              }}
              className="border-white/20 hover:border-volt-400 gap-2 text-white"
              disabled={isResetting}
            >
              <RotateCcw className="size-4 text-volt-400" />
              <span>Reset Demo Data</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsResetModalOpen(true);
                setResetConfirmInput("");
                setResetReason("Loaded fresh demo showcase dataset for presentation.");
              }}
              className="gap-2"
              disabled={isResetting}
            >
              <Sparkles className="size-4" />
              <span>Load Demo Data</span>
            </Button>
          </div>
        }
      />

      {/* Progress Animation during reset */}
      {isResetting && (
        <Card className="p-6 border-volt-400/40 bg-court-700/90 shadow-2xl space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-volt-400/20 border border-volt-400 flex items-center justify-center animate-spin">
                <Database className="size-4 text-volt-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Resetting Club Demo Environment...</h4>
                <p className="text-xs text-white/60">
                  Step {activeStepIndex + 1} of {RESET_STEPS.length}: {RESET_STEPS[activeStepIndex]?.label}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-volt-400">
              {Math.round(((activeStepIndex + 1) / RESET_STEPS.length) * 100)}%
            </span>
          </div>

          <div className="w-full h-2 bg-navy-950 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-volt-500 to-volt-400 transition-all duration-500"
              style={{ width: `${((activeStepIndex + 1) / RESET_STEPS.length) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-2">
            {RESET_STEPS.map((s, idx) => {
              const isPast = idx < activeStepIndex;
              const isCurrent = idx === activeStepIndex;
              return (
                <div
                  key={s.id}
                  className={`p-2.5 rounded-xl border text-xs transition-all ${
                    isCurrent
                      ? "bg-volt-400/15 border-volt-400 text-white"
                      : isPast
                      ? "bg-court-800/80 border-white/10 text-white/80"
                      : "bg-court-800/40 border-white/5 text-white/40"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-medium mb-1">
                    {isPast ? (
                      <CheckCircle2 className="size-3.5 text-volt-400" />
                    ) : (
                      <span className="size-3.5 rounded-full border border-current flex items-center justify-center text-[9px]">
                        {idx + 1}
                      </span>
                    )}
                    <span className="truncate">{s.label.split("&")[0]}</span>
                  </div>
                  <div className="text-[10px] text-white/50 truncate">{s.count}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Overview Metric Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-volt-400/15 border border-volt-400/30 flex items-center justify-center text-volt-400 shrink-0">
            <Users className="size-5" />
          </div>
          <div>
            <div className="text-xs text-white/60">Demo Accounts</div>
            <div className="text-xl font-bold text-white font-mono">148 Active</div>
            <div className="text-[11px] text-volt-300">Gold, Silver, Junior & Staff</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-court-700 border border-white/10 flex items-center justify-center text-volt-400 shrink-0">
            <Layers className="size-5" />
          </div>
          <div>
            <div className="text-xs text-white/60">Court Facilities</div>
            <div className="text-xl font-bold text-white font-mono">6 Courts</div>
            <div className="text-[11px] text-white/50">Tennis, Padel & Badminton</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-court-700 border border-white/10 flex items-center justify-center text-volt-400 shrink-0">
            <Shield className="size-5" />
          </div>
          <div>
            <div className="text-xs text-white/60">Permission Groups</div>
            <div className="text-xl font-bold text-white font-mono">5 Groups</div>
            <div className="text-[11px] text-white/50">FrontDesk, F&B, Shop, CRM, Finance</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-court-700 border border-white/10 flex items-center justify-center text-volt-400 shrink-0">
            <PlayCircle className="size-5" />
          </div>
          <div>
            <div className="text-xs text-white/60">SRS Test Scenes</div>
            <div className="text-xl font-bold text-white font-mono">7 / 7 Ready</div>
            <div className="text-[11px] text-volt-300">
              {completedSteps.length} Verified in current session
            </div>
          </div>
        </Card>
      </div>

      {/* Demo Script Walkthrough Checklist */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <span>Demo Walkthrough Script</span>
              <span className="text-xs font-normal text-white/60">
                (7 Core SRS Validation Scenarios)
              </span>
            </h3>
            <p className="text-xs text-white/60 mt-0.5">
              Click <strong>[Go to ...]</strong> on each scene to navigate directly to the corresponding interactive screen.
            </p>
          </div>
          <div className="text-xs text-white/60">
            Progress: <strong className="text-volt-400">{completedSteps.length} of 7</strong> completed
          </div>
        </div>

        <div className="space-y-3">
          {demoSteps.map((step) => {
            const isDone = completedSteps.includes(step.id);
            return (
              <Card
                key={step.id}
                className={`p-4 transition-all duration-200 border ${
                  isDone
                    ? "bg-court-600/70 border-white/10"
                    : "bg-court-500 border-volt-400/20 hover:border-volt-400/40"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {/* Step Number or Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleStepCompleted(step.id)}
                      className={`size-8 rounded-full flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
                        isDone
                          ? "bg-volt-400 text-ink-900 font-bold"
                          : "border-2 border-white/30 text-white/70 hover:border-volt-400 hover:text-volt-400 font-mono text-xs"
                      }`}
                      title={isDone ? "Mark as unverified" : "Mark as verified"}
                    >
                      {isDone ? <CheckCircle2 className="size-5" /> : step.id}
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className={`text-sm font-semibold ${isDone ? "text-white/80 line-through decoration-volt-400/60" : "text-white"}`}>
                          Scene {step.id}: {step.title}
                        </h4>
                        <span className="text-[10px] bg-white/10 text-volt-300 px-2 py-0.5 rounded font-mono font-medium">
                          {step.srsRequirement}
                        </span>
                      </div>
                      <p className="text-xs text-white/70 mt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Deep-link Action Button */}
                  <div className="flex items-center gap-2.5 sm:self-center shrink-0">
                    <Button
                      variant={isDone ? "ghost" : "primary"}
                      size="sm"
                      onClick={() => navigate(step.targetPath)}
                      className="gap-2 text-xs"
                    >
                      <span>{step.buttonLabel}</span>
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsResetModalOpen(false)}
          title="Confirm Club Demo Data Reset"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="size-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-200">
                <span className="font-semibold block mb-0.5">Destructive Reset Warning</span>
                This action will restore all courts, hours, membership plans, tariffs, GST rules, staff profiles, and sample bookings to their pristine factory-default demo state.
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/80">
                Audit Reason <span className="text-rose-400">*</span>
              </label>
              <Input
                value={resetReason}
                onChange={(e) => setResetReason(e.target.value)}
                placeholder="Reason for demo environment re-initialization..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/80">
                Type <strong>RESET</strong> in all capital letters to confirm:
              </label>
              <Input
                value={resetConfirmInput}
                onChange={(e) => setResetConfirmInput(e.target.value)}
                placeholder="RESET"
                className="font-mono uppercase tracking-wider"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <Button
                variant="ghost"
                onClick={() => setIsResetModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={resetConfirmInput !== "RESET" || !resetReason.trim()}
                onClick={handleExecuteReset}
                className="gap-2"
              >
                <RotateCcw className="size-4" />
                <span>Execute Complete Reset</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
