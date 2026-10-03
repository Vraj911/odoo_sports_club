import { useState } from "react";
import {
  Beer,
  Clock,
  Receipt,
  CheckCircle2,
  AlertCircle,
  FileText,
  Utensils,
  BellRing,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { Money } from "@/components/shared/Money";
import { useMember } from "@/features/member/memberStore";
import { SAMPLE_SETTLED_TABS } from "@/features/member/sampleData";
import { AppLink } from "@/app/router/links";

export default function BarTabPage() {
  const { profile, tabItems, requestBill } = useMember();
  const { tabBalance, tabLimit } = profile;
  const toast = useToast();
  const [requesting, setRequesting] = useState(false);

  const totalDiscount = tabItems.reduce((acc, i) => acc + i.discount * i.quantity, 0);
  const rawSubtotal = tabItems.reduce((acc, i) => acc + i.price * i.quantity, 0);

  const handleRequestBill = () => {
    setRequesting(true);
    setTimeout(() => {
      requestBill();
      setRequesting(false);
      toast.success(
        "Bill Requested",
        "Your server (Sanjay M.) and the cashier have been notified. A printed invoice will be brought to your table shortly."
      );
    }, 600);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Header */}
      <div className="border-b border-chalk/10 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Beer className="size-6 text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-chalk">
              Courtside Bar & Lounge Tab
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-chalk/70 mt-1">
            Real-time food and beverage orders billed to Member ID #{profile.id} across lounge tables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={handleRequestBill}
            loading={requesting}
            leftIcon={<BellRing className="size-4" />}
          >
            Request Bill
          </Button>
        </div>
      </div>

      {/* Tab Limit Meter & Running Balance Hero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-[24px] border border-chalk/14 bg-court-500 p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-chalk/60">
              Active Table Tab
            </span>
            <StatusPill variant="warning" showDot>
              Tab Open · Table T-4
            </StatusPill>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-volt-400">
              <Money amount={tabBalance} />
            </span>
            <span className="text-xs text-emerald-400 font-semibold font-mono">
              (Saved <Money amount={totalDiscount} /> with {profile.tier} Discount)
            </span>
          </div>

          {/* Tab Limit Meter */}
          <div className="space-y-1.5 pt-2 border-t border-chalk/10 text-xs">
            <div className="flex justify-between text-chalk/60">
              <span>Credit Limit Usage:</span>
              <span className="font-mono text-chalk font-semibold">
                <Money amount={tabBalance} /> of <Money amount={tabLimit} />
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-volt-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (tabBalance / tabLimit) * 100)}%` }}
              />
            </div>
            <span className="text-[11px] text-chalk/50 block pt-0.5">
              Monthly consolidated billing cycle settles on the 1st of every month.
            </span>
          </div>
        </div>

        {/* Member Discount Perks Card */}
        <div className="rounded-[24px] border border-chalk/14 bg-court-500 p-6 flex flex-col justify-between space-y-3">
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-volt-400">
              {profile.tier} F&B Entitlement
            </h4>
            <p className="text-sm font-semibold text-chalk">
              {profile.entitlements.barDiscount}% Off All Menu Items
            </p>
            <p className="text-xs text-chalk/60 leading-relaxed pt-1">
              Discounts are automatically deducted per item before GST is calculated.
            </p>
          </div>

          <div className="rounded-xl bg-court-600/70 p-3 border border-chalk/8 text-[11px] text-chalk/70">
            Assigned Waiter: <span className="font-semibold text-chalk">Sanjay M.</span><br />
            Location: <span className="font-semibold text-chalk">Courtside Lounge (Outdoor Deck)</span>
          </div>
        </div>
      </div>

      {/* Live Tab Items List */}
      <div className="rounded-[24px] border border-chalk/14 bg-court-500 p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between border-b border-chalk/10 pb-3">
          <div className="flex items-center gap-2">
            <Utensils className="size-4 text-volt-400" />
            <h3 className="text-base font-bold text-chalk uppercase tracking-wider text-xs">
              Live Order Items ({tabItems.length})
            </h3>
          </div>
          <span className="text-xs text-chalk/60 font-mono">Real-time Kitchen Accrual</span>
        </div>

        <div className="divide-y divide-chalk/8 text-xs">
          {tabItems.map((item) => (
            <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-chalk text-sm">{item.name}</span>
                  <span className="rounded-pill bg-chalk/10 px-2 py-0.5 text-[10px] text-chalk/70 font-mono">
                    Qty: {item.quantity}
                  </span>
                </div>
                <p className="text-[11px] text-chalk/50 font-mono">
                  {item.table} · Added {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} by {item.server}
                </p>
              </div>

              <div className="text-right font-mono">
                <span className="text-sm font-bold text-chalk block">
                  <Money amount={(item.price - item.discount) * item.quantity} />
                </span>
                <span className="text-[11px] text-emerald-400 line-through text-chalk/40 mr-1.5">
                  <Money amount={item.price * item.quantity} />
                </span>
                <span className="text-[10px] text-emerald-400">
                  (-<Money amount={item.discount * item.quantity} />)
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Subtotals */}
        <div className="border-t border-chalk/14 pt-4 space-y-2 text-xs">
          <div className="flex justify-between text-chalk/70">
            <span>Menu Gross Subtotal:</span>
            <span className="font-mono text-chalk"><Money amount={rawSubtotal} /></span>
          </div>
          <div className="flex justify-between text-emerald-400">
            <span>Member {profile.tier} Benefit (15%):</span>
            <span className="font-mono font-semibold">- <Money amount={totalDiscount} /></span>
          </div>
          <div className="border-t border-chalk/10 pt-2 flex justify-between font-bold text-sm">
            <span className="text-chalk">Current Net Tab Payable:</span>
            <span className="text-volt-400 font-mono text-base"><Money amount={tabBalance} /></span>
          </div>
        </div>
      </div>

      {/* Settled Tabs History (BAR-07) */}
      <div className="rounded-[24px] border border-chalk/14 bg-court-500 p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-2">
          <History className="size-4 text-volt-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-chalk">
            Settled Tab History
          </h3>
        </div>

        <div className="divide-y divide-chalk/8 text-xs">
          {SAMPLE_SETTLED_TABS.map((tab) => (
            <div key={tab.id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <span className="font-semibold text-chalk text-sm block">
                  Settled Tab · {tab.date}
                </span>
                <span className="text-[11px] text-chalk/50 font-mono">
                  {tab.itemsCount} items · Method: {tab.paymentMethod} (Served by {tab.server})
                </span>
              </div>

              <div className="text-right">
                <span className="font-mono font-bold text-chalk text-sm block">
                  <Money amount={tab.paidAmount} />
                </span>
                <AppLink
                  to={`/app/invoices`}
                  className="text-[11px] text-volt-400 hover:underline font-mono"
                >
                  {tab.invoiceRef}
                </AppLink>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
