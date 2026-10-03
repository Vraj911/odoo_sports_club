import { useState } from "react";
import { useGo } from "@/app/router/links";
import { useBarStore } from "../barStore";
import { BarTab } from "../types";
import { FloorHeader } from "../components/FloorHeader";
import { AdminPinDialog } from "@/components/shared/AdminPinDialog";
import {
  Beer,
  PlusCircle,
  Clock,
  CreditCard,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Lock,
  Receipt,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

const DEMO_MEMBERS_FOR_TABS = [
  { id: "M-1002", name: "Vikramaditya Singhania", tier: "PLATINUM" as const, limit: 25000 },
  { id: "M-1004", name: "Ananya Birla", tier: "GOLD" as const, limit: 15000 },
  { id: "M-1009", name: "Devansh Mehta", tier: "SILVER" as const, limit: 10000 },
  { id: "M-1011", name: "Pratham Shah", tier: "GOLD" as const, limit: 15000 },
  { id: "M-1015", name: "Rohan Kapoor", tier: "GOLD" as const, limit: 12000 },
];

export function BarTabsPage() {
  const go = useGo();
  const { tabs, openNewTab, moveTabToMemberAccount, dailyClosing } = useBarStore();

  const [selectedTab, setSelectedTab] = useState<BarTab | null>(null);
  const [isOpenTabModalOpen, setIsOpenTabModalOpen] = useState(false);

  // New Tab form state
  const [selectedMember, setSelectedMember] = useState(DEMO_MEMBERS_FOR_TABS[0]);
  const [customCreditLimit, setCustomCreditLimit] = useState(15000);

  // Admin Pin Dialog for Move to Member Account
  const [isAdminPinOpen, setIsAdminPinOpen] = useState(false);
  const [tabToMove, setTabToMove] = useState<BarTab | null>(null);

  const openTabs = tabs.filter((t) => t.status === "OPEN");
  const closedTabs = tabs.filter((t) => t.status !== "OPEN");

  const handleOpenTab = () => {
    openNewTab(
      selectedMember.id,
      selectedMember.name,
      selectedMember.tier,
      customCreditLimit
    );
    setIsOpenTabModalOpen(false);
    alert(`Opened active bar tab for ${selectedMember.name} (Limit: ₹${customCreditLimit.toLocaleString("en-IN")})`);
  };

  const handleTriggerMoveToAccount = (tab: BarTab) => {
    setTabToMove(tab);
    setIsAdminPinOpen(true);
  };

  const handleConfirmMoveToAccount = (reason: string, pin?: string) => {
    if (tabToMove && pin) {
      const res = moveTabToMemberAccount(tabToMove.id, reason, pin);
      if (res.success) {
        alert(`Tab for ${tabToMove.name} moved to monthly club member account.`);
        setSelectedTab(null);
      } else {
        alert(res.error || "Failed to move tab to account.");
      }
    }
    setIsAdminPinOpen(false);
    setTabToMove(null);
  };

  return (
    <div className="min-h-screen bg-court-800 text-white flex flex-col">
      <FloorHeader />

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Header & Open New Tab button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <h1 className="text-xl font-heading font-black text-white flex items-center gap-2">
              <Beer className="w-5 h-5 text-amber-400" />
              <span>Active Member Tabs</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono text-xs">
                {openTabs.length} Open
              </span>
            </h1>
            <p className="text-xs text-white/50">
              Running tabs for verified club members with credit tracking and monthly account billing.
            </p>
          </div>

          <Button
            onClick={() => setIsOpenTabModalOpen(true)}
            className="bg-volt-400 hover:bg-volt-500 text-ink-900 font-bold h-9 text-xs"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            + Open New Member Tab
          </Button>
        </div>

        {/* Closing Time Warning Banner */}
        {openTabs.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <strong className="font-bold text-white">Daily Closing Warning:</strong>{" "}
                <span>
                  {openTabs.length} unsettled tabs remain active. All tabs must be settled via bill or moved
                  to member accounts before closing operations.
                </span>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded">
              BR-11 Required
            </span>
          </div>
        )}

        {/* Open Tabs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {openTabs.map((tab) => {
            const usagePercent = Math.min(100, Math.round((tab.runningTotal / tab.creditLimit) * 100));
            const isNearLimit = usagePercent >= 75;

            // Elapsed time
            const diffMs = Date.now() - new Date(tab.openedAt).getTime();
            const elapsedHours = Math.floor(diffMs / 3600000);
            const elapsedMinutes = Math.floor((diffMs % 3600000) / 60000);

            return (
              <div
                key={tab.id}
                onClick={() => setSelectedTab(tab)}
                className="bg-court-700/80 hover:bg-court-600/90 border border-white/10 hover:border-volt-400/40 rounded-2xl p-4 transition-all duration-150 cursor-pointer shadow-lg flex flex-col justify-between"
              >
                <div>
                  {/* Top: Member Info + Tier */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {tab.memberPhoto ? (
                        <img
                          src={tab.memberPhoto}
                          alt={tab.memberName}
                          className="w-10 h-10 rounded-full object-cover border border-white/20"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-volt-400 text-ink-900 font-bold flex items-center justify-center text-sm">
                          {tab.memberName.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="font-heading font-bold text-white text-sm">{tab.memberName}</h3>
                        <span className="text-[11px] text-white/50">{tab.memberId}</span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-volt-400/20 text-volt-300 border border-volt-400/30">
                      {tab.memberTier}
                    </span>
                  </div>

                  {/* Running Total & Credit Limit Meter */}
                  <div className="mt-4 p-3 bg-court-800/70 rounded-xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-white/60">Running Total:</span>
                      <span className="font-mono text-xl font-bold text-volt-300">
                        ₹{tab.runningTotal.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[10px] text-white/40 mb-1">
                        <span>Limit: ₹{tab.creditLimit.toLocaleString("en-IN")}</span>
                        <span>{usagePercent}% utilized</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isNearLimit ? "bg-amber-400" : "bg-volt-400"
                          }`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer: Elapsed time + Active tables */}
                <div className="mt-4 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-white/40" />
                    <span>
                      Active {elapsedHours > 0 ? `${elapsedHours}h ` : ""}{elapsedMinutes}m
                    </span>
                  </div>

                  <span className="text-volt-300 text-xs font-semibold flex items-center gap-1 hover:underline">
                    View & Settle <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {openTabs.length === 0 && (
          <div className="py-20 text-center text-white/40 text-xs bg-court-700/30 rounded-2xl border border-white/5">
            No member tabs are currently open. Click "+ Open New Member Tab" to open one.
          </div>
        )}

        {/* Tab Detail Drawer / Slide-over */}
        {selectedTab && (
          <div className="fixed inset-0 z-50 flex justify-end bg-navy-950/70 backdrop-blur-sm">
            <div className="w-full max-w-md bg-court-700 h-full shadow-2xl border-l border-white/10 p-5 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <h2 className="text-base font-bold font-heading text-white">
                      Tab: {selectedTab.name}
                    </h2>
                    <p className="text-xs text-white/50">
                      Opened at {new Date(selectedTab.openedAt).toLocaleTimeString("en-IN")}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTab(null)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/60 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Member summary */}
                <div className="p-3 bg-court-800 rounded-xl border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-white font-bold block">{selectedTab.memberName}</span>
                    <span className="text-[11px] text-white/50">
                      {selectedTab.memberTier} Member · ID: {selectedTab.memberId}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-white/50 block">Current Balance</span>
                    <span className="font-mono text-base font-bold text-volt-300">
                      ₹{selectedTab.runningTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Itemized Lines */}
                <div>
                  <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
                    Orders Charged to this Tab
                  </h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    <div className="p-2.5 rounded-lg bg-white/5 text-xs flex justify-between">
                      <div>
                        <div className="font-semibold text-white">Smoked Oak Old Fashioned × 3</div>
                        <div className="text-[10px] text-white/50">Cover: Table 4 · Waiter: Aarav M.</div>
                      </div>
                      <span className="font-mono font-bold text-white">₹1,560</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/5 text-xs flex justify-between">
                      <div>
                        <div className="font-semibold text-white">Butter Garlic Tiger Prawns × 2</div>
                        <div className="text-[10px] text-white/50">Cover: Table 4 · Waiter: Aarav M.</div>
                      </div>
                      <span className="font-mono font-bold text-white">₹1,240</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/5 text-xs flex justify-between">
                      <div>
                        <div className="font-semibold text-white">Wood-Fired Margherita Pizza × 1</div>
                        <div className="text-[10px] text-white/50">Kitchen Order #1081</div>
                      </div>
                      <span className="font-mono font-bold text-white">₹490</span>
                    </div>
                  </div>
                </div>
              </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <Button
                    onClick={() => {
                      // Navigate to bill settlement for this tab
                      const tabOrderId = selectedTab.orders[0]?.id || "ORD-1083";
                      go(`/bar/bill/${tabOrderId}`);
                    }}
                    className="w-full bg-volt-400 hover:bg-volt-500 text-ink-900 font-bold h-11 text-xs"
                  >
                    <Receipt className="w-4 h-4 mr-1.5" />
                    Settle Tab Now (Cash / Card / UPI)
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleTriggerMoveToAccount(selectedTab)}
                    className="w-full border-amber-400/40 text-amber-300 hover:bg-amber-400/10 font-semibold h-10 text-xs"
                  >
                    <Lock className="w-3.5 h-3.5 mr-1.5" />
                    Move to Member Account (Admin PIN)
                  </Button>
                </div>
            </div>
          </div>
        )}

        {/* Modal: Open New Member Tab */}
        <Modal
          isOpen={isOpenTabModalOpen}
          onClose={() => setIsOpenTabModalOpen(false)}
          title="Open New Bar Tab"
        >
          <div className="space-y-4">
            <p className="text-xs text-white/60">
              Select a club member to open a bar charge account. Transactions will accumulate under this tab.
            </p>

            <div>
              <label className="text-xs font-semibold text-white/80 mb-1.5 block">
                Select Club Member
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {DEMO_MEMBERS_FOR_TABS.map((m) => {
                  const isSelected = selectedMember.id === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedMember(m);
                        setCustomCreditLimit(m.limit);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                        isSelected
                          ? "bg-volt-400 text-ink-900 border-volt-400 font-bold shadow-md"
                          : "bg-court-700/60 hover:bg-court-600/80 border-white/10 text-white"
                      }`}
                    >
                      <div>
                        <span className="font-semibold block">{m.name}</span>
                        <span className={`text-[10px] block ${isSelected ? "text-ink-900/70" : "text-white/50"}`}>
                          ID: {m.id}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20">
                        {m.tier}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/80 mb-1 block">
                Approved Credit Limit (₹)
              </label>
              <Input
                type="number"
                value={customCreditLimit}
                onChange={(e) => setCustomCreditLimit(Number(e.target.value))}
                className="h-10 text-xs font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <Button variant="ghost" size="sm" onClick={() => setIsOpenTabModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleOpenTab}
                className="bg-volt-400 hover:bg-volt-500 text-ink-900 font-bold"
              >
                Open Tab
              </Button>
            </div>
          </div>
        </Modal>

        {/* Admin PIN Dialog for Move to Member Account */}
        <AdminPinDialog
          isOpen={isAdminPinOpen}
          onClose={() => {
            setIsAdminPinOpen(false);
            setTabToMove(null);
          }}
          onConfirm={handleConfirmMoveToAccount}
          title="Admin Authorization: Move Tab to Member Account"
          description="Moving an unsettled tab to a member's club ledger requires manager/admin PIN approval and an audit justification."
        />
      </div>
    </div>
  );
}
export default BarTabsPage;
