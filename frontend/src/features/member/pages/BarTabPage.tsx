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
  Download,
  ChefHat,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { Money } from "@/components/shared/Money";
import { useMember } from "@/features/member/memberStore";
import { SAMPLE_SETTLED_TABS } from "@/features/member/sampleData";

type BarTabCategory = "open-tab" | "bar-orders" | "bills";

interface BarOrder {
  id: string;
  orderNumber: string;
  time: string;
  table: string;
  server: string;
  status: "Preparing" | "Ready to Serve" | "Served";
  items: { name: string; qty: number; price: number }[];
  total: number;
}

const SAMPLE_BAR_ORDERS: BarOrder[] = [
  {
    id: "ord-1",
    orderNumber: "ORD-9421",
    time: "Today · 14:15",
    table: "Table T-4",
    server: "Sanjay M.",
    status: "Preparing",
    items: [
      { name: "Fresh Tender Coconut Water", qty: 2, price: 160 },
      { name: "Club Protein Power Smoothie", qty: 1, price: 260 },
    ],
    total: 420,
  },
  {
    id: "ord-2",
    orderNumber: "ORD-9390",
    time: "Today · 13:30",
    table: "Table T-4",
    server: "Sanjay M.",
    status: "Served",
    items: [
      { name: "Grilled Chicken & Avocado Bowl", qty: 1, price: 420 },
      { name: "Electrolyte Recovery Fizz (Electral)", qty: 2, price: 220 },
    ],
    total: 640,
  },
  {
    id: "ord-3",
    orderNumber: "ORD-9280",
    time: "Yesterday · 18:45",
    table: "Lounge Booth B-2",
    server: "Pooja V.",
    status: "Served",
    items: [
      { name: "Bira 91 White Draft (500ml)", qty: 2, price: 560 },
      { name: "Truffle Parmesan Hand-cut Fries", qty: 1, price: 280 },
      { name: "Charred Paneer Tikka Platter", qty: 1, price: 380 },
    ],
    total: 1220,
  },
];

export default function BarTabPage() {
  const { profile, tabItems, requestBill } = useMember();
  const { tabBalance, tabLimit } = profile;
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<BarTabCategory>("open-tab");
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

  const handleDownloadBill = (billId: string) => {
    toast.info("Receipt Downloaded", `Saved PDF receipt for Bill #${billId}.`);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Header */}
      <div className="border-b border-chalk/10 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Beer className="size-6 text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-chalk">
              Courtside Bar & Tab
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-chalk/70 mt-1">
            Real-time lounge food & beverage orders, table tabs, and past settled invoices for Member ID #{profile.id}.
          </p>
        </div>

        {activeTab === "open-tab" && (
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
        )}
      </div>

      {/* Segmented Tab Navigation: [Open tab | Bar orders | Bills] */}
      <div className="flex items-center gap-2 border-b border-chalk/10 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("open-tab")}
          className={`flex items-center gap-2 rounded-pill px-5 py-2 text-xs font-semibold transition-all ${
            activeTab === "open-tab"
              ? "bg-volt-400 text-ink-900 shadow-md"
              : "border border-chalk/14 bg-chalk/6 text-chalk/70 hover:text-chalk hover:bg-chalk/10"
          }`}
        >
          <Beer className="size-4" />
          <span>Open Tab</span>
          {tabItems.length > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === "open-tab" ? "bg-ink-900 text-volt-400" : "bg-volt-400/20 text-volt-300"
              }`}
            >
              {tabItems.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("bar-orders")}
          className={`flex items-center gap-2 rounded-pill px-5 py-2 text-xs font-semibold transition-all ${
            activeTab === "bar-orders"
              ? "bg-volt-400 text-ink-900 shadow-md"
              : "border border-chalk/14 bg-chalk/6 text-chalk/70 hover:text-chalk hover:bg-chalk/10"
          }`}
        >
          <ChefHat className="size-4" />
          <span>Bar Orders</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              activeTab === "bar-orders" ? "bg-ink-900 text-volt-400" : "bg-volt-400/20 text-volt-300"
            }`}
          >
            {SAMPLE_BAR_ORDERS.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("bills")}
          className={`flex items-center gap-2 rounded-pill px-5 py-2 text-xs font-semibold transition-all ${
            activeTab === "bills"
              ? "bg-volt-400 text-ink-900 shadow-md"
              : "border border-chalk/14 bg-chalk/6 text-chalk/70 hover:text-chalk hover:bg-chalk/10"
          }`}
        >
          <Receipt className="size-4" />
          <span>Settled Bills</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              activeTab === "bills" ? "bg-ink-900 text-volt-400" : "bg-volt-400/20 text-volt-300"
            }`}
          >
            {SAMPLE_SETTLED_TABS.length}
          </span>
        </button>
      </div>

      {/* TAB 1: OPEN TAB */}
      {activeTab === "open-tab" && (
        <div className="space-y-6">
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
                <p className="text-xs text-chalk/60 leading-relaxed">
                  Automatic tier discounts applied to mocktails, dining, beer & snacks on your tab.
                </p>
              </div>

              <div className="rounded-[16px] bg-chalk/6 p-3 text-xs space-y-1 border border-chalk/10">
                <div className="flex justify-between text-chalk/70">
                  <span>Pro Shop Gear:</span>
                  <span className="font-semibold text-volt-400">{profile.entitlements.shopDiscount}% off</span>
                </div>
                <div className="flex justify-between text-chalk/70">
                  <span>Guest Passes:</span>
                  <span className="font-semibold text-chalk">{profile.entitlements.guestPasses} remaining</span>
                </div>
              </div>
            </div>
          </div>

          {/* Running Tab Items List */}
          <div className="rounded-[24px] border border-chalk/14 bg-court-500 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-chalk/10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-chalk">Current Table Bill Items</h3>
                <p className="text-xs text-chalk/60">Table T-4 · Served by Sanjay M.</p>
              </div>
              <span className="rounded-pill border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                Active Session
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-court-700/60 border-b border-chalk/10 text-[11px] font-semibold uppercase tracking-wider text-chalk/60">
                    <th className="py-3 px-6">Item</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Price</th>
                    <th className="py-3 px-4 text-right">Tier Discount</th>
                    <th className="py-3 px-6 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-chalk/8">
                  {tabItems.map((item) => {
                    const itemTotal = (item.price - item.discount) * item.quantity;
                    return (
                      <tr key={item.id} className="hover:bg-chalk/4">
                        <td className="py-4 px-6">
                          <span className="font-medium text-chalk block">{item.name}</span>
                          <span className="text-[11px] text-chalk/50 font-mono">
                            Ordered at {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center font-mono font-medium">{item.quantity}</td>
                        <td className="py-4 px-4 text-right font-mono text-chalk/80">
                          <Money amount={item.price} />
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-emerald-400">
                          {item.discount > 0 ? `- ₹${item.discount * item.quantity}` : "₹0"}
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-semibold text-chalk">
                          <Money amount={itemTotal} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-court-700/40 border-t border-chalk/12 text-xs">
                    <td colSpan={3} className="py-3 px-6 font-medium text-chalk/60">
                      Subtotal before discount: <Money amount={rawSubtotal} />
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-400 font-mono">
                      - <Money amount={totalDiscount} />
                    </td>
                    <td className="py-3 px-6 text-right font-bold text-volt-400 font-mono text-sm">
                      <Money amount={tabBalance} />
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BAR ORDERS */}
      {activeTab === "bar-orders" && (
        <div className="space-y-4">
          <div className="rounded-[24px] border border-chalk/14 bg-court-500 overflow-hidden shadow-xl p-6">
            <h3 className="text-base font-semibold text-chalk mb-1">Live & Recent Orders</h3>
            <p className="text-xs text-chalk/60 mb-6">
              Track status of orders placed directly with your server or through the mobile courtside menu.
            </p>

            <div className="space-y-4">
              {SAMPLE_BAR_ORDERS.map((ord) => (
                <div
                  key={ord.id}
                  className="rounded-[18px] border border-chalk/12 bg-court-600/80 p-5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-chalk/10 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-volt-400 text-sm">{ord.orderNumber}</span>
                      <span className="text-xs text-chalk/60">{ord.time}</span>
                      <span className="text-xs font-semibold text-chalk/80 bg-chalk/8 px-2.5 py-0.5 rounded-pill">
                        {ord.table}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill
                        variant={
                          ord.status === "Preparing"
                            ? "warning"
                            : ord.status === "Ready to Serve"
                            ? "volt"
                            : "success"
                        }
                        showDot
                      >
                        {ord.status}
                      </StatusPill>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {ord.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-chalk/80">
                        <span>
                          {item.qty}x {item.name}
                        </span>
                        <span className="font-mono text-chalk font-medium">₹{item.price * item.qty}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-chalk/8 flex items-center justify-between text-xs">
                    <span className="text-chalk/50">Attended by Server: {ord.server}</span>
                    <span className="font-bold text-volt-400 font-mono text-sm">
                      Total: ₹{ord.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SETTLED BILLS */}
      {activeTab === "bills" && (
        <div className="space-y-4">
          <div className="rounded-[24px] border border-chalk/14 bg-court-500 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-chalk/10">
              <h3 className="text-base font-semibold text-chalk">Settled F&B Invoices</h3>
              <p className="text-xs text-chalk/60">
                Official billing receipts settled via room folio, UPI, or credit card.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-court-700/60 border-b border-chalk/10 text-[11px] font-semibold uppercase tracking-wider text-chalk/60">
                    <th className="py-4 px-6">Bill ID</th>
                    <th className="py-4 px-4">Date & Time</th>
                    <th className="py-4 px-4">Table / Area</th>
                    <th className="py-4 px-4">Items Count</th>
                    <th className="py-4 px-4">Payment Method</th>
                    <th className="py-4 px-4 text-right">Amount</th>
                    <th className="py-4 px-6 text-right">Invoice Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-chalk/8">
                  {SAMPLE_SETTLED_TABS.map((bill) => (
                    <tr key={bill.id} className="hover:bg-chalk/4">
                      <td className="py-4 px-6 font-mono font-semibold text-volt-400">{bill.id}</td>
                      <td className="py-4 px-4 text-chalk/80">{bill.date}</td>
                      <td className="py-4 px-4 font-medium text-chalk">Server: {bill.server}</td>
                      <td className="py-4 px-4 text-chalk/70 font-mono">{bill.itemsCount} items</td>
                      <td className="py-4 px-4">
                        <span className="rounded-pill bg-chalk/8 px-2.5 py-1 text-[11px] text-chalk/80">
                          {bill.paymentMethod}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-chalk">
                        <Money amount={bill.paidAmount} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadBill(bill.id)}
                          leftIcon={<Download className="size-3.5" />}
                        >
                          PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
