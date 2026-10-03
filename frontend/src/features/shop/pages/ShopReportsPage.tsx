import { useState, useMemo } from "react";
import { POSTopBar } from "../components/POSTopBar";
import { useShopConsole } from "../shopStore";
import { SAMPLE_PRODUCTS } from "../sampleData";
import { Money } from "@/components/shared/Money";
import { Button } from "@/components/ui/Button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BarChart3,
  Calendar,
  Download,
  Filter,
  TrendingUp,
  Boxes,
  Zap,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

const CHART_COLORS = ["#d5f63a", "#38bdf8", "#a78bfa", "#f43f5e", "#fbbf24", "#34d399"];

export default function ShopReportsPage() {
  const { inventoryList } = useShopConsole();

  // Filters
  const [dateRange, setDateRange] = useState<"today" | "7d" | "30d" | "ytd">("30d");
  const [channelFilter, setChannelFilter] = useState<"all" | "counter" | "online">("all");
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // Sales Trends Data
  const dailyRevenueData = useMemo(() => {
    return [
      { date: "27 Sep", counter: 18500, online: 12400 },
      { date: "28 Sep", counter: 24200, online: 15600 },
      { date: "29 Sep", counter: 29800, online: 21000 },
      { date: "30 Sep", counter: 22100, online: 18900 },
      { date: "01 Oct", counter: 35400, online: 24500 },
      { date: "02 Oct", counter: 41200, online: 32000 },
      { date: "03 Oct", counter: 38900, online: 28400 },
    ];
  }, []);

  // Category breakdown for Pie Chart
  const categoryData = useMemo(() => {
    return [
      { name: "Rackets", value: 114500 },
      { name: "Footwear", value: 68200 },
      { name: "Strings", value: 34100 },
      { name: "Balls & Shuttles", value: 29400 },
      { name: "Grips", value: 16800 },
      { name: "Accessories", value: 11200 },
    ];
  }, []);

  // Best Sellers table data
  const bestSellers = useMemo(() => {
    return [
      {
        rank: 1,
        name: "Yonex Astrox 99 Pro (G4)",
        brand: "Yonex",
        units: 24,
        revenue: 359976,
        margin: "42%",
      },
      {
        rank: 2,
        name: "Babolat Pure Aero 2024 (G3)",
        brand: "Babolat",
        units: 18,
        revenue: 404820,
        margin: "38%",
      },
      {
        rank: 3,
        name: "Wilson US Open Balls (Can of 3)",
        brand: "Wilson",
        units: 64,
        revenue: 31936,
        margin: "45%",
      },
      {
        rank: 4,
        name: "Yonex Super Grap Grip (3-Pack)",
        brand: "Yonex",
        units: 52,
        revenue: 18200,
        margin: "55%",
      },
      {
        rank: 5,
        name: "Restring Service (Babolat RPM)",
        brand: "Workshop",
        units: 36,
        revenue: 43200,
        margin: "68%",
      },
    ];
  }, []);

  // Dead Stock Table: variants with 0 sales in 30+ days
  const deadStock = useMemo(() => {
    return [
      {
        name: "Head Radical MP 2024 (G4)",
        sku: "HEAD-RAD-G4",
        category: "Rackets",
        daysIdle: 45,
        onHand: 4,
        unitCost: 13200,
        tiedValuation: 52800,
        recommendation: "Bundle with Free Grip & 10% Member Clearance",
      },
      {
        name: "Cricket Grip Cone Tool",
        sku: "KOO-GRIP-CONE",
        category: "Accessories",
        daysIdle: 62,
        onHand: 12,
        unitCost: 150,
        tiedValuation: 1800,
        recommendation: "Offer as Complimentary Gift on Bat Purchases",
      },
      {
        name: "NOX ML10 Pro Cup (365g)",
        sku: "NOX-ML10-365",
        category: "Padel",
        daysIdle: 38,
        onHand: 2,
        unitCost: 11100,
        tiedValuation: 22200,
        recommendation: "Promote on Friday Social Padel Tournament",
      },
    ];
  }, []);

  const handleExport = (format: "PDF" | "CSV" | "EXCEL") => {
    setExportMenuOpen(false);
    toast.success(`Exporting Shop Revenue Report (${format})... Download started.`);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-backdrop text-chalk font-sans">
      <POSTopBar activeModule="reports" />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto w-full flex flex-col min-h-0">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-chalk/12 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="size-6 text-volt-400" />
              <h2 className="text-xl sm:text-2xl font-black text-chalk tracking-tight">
                Pro Shop Analytics & Performance
              </h2>
            </div>
            <p className="mt-1 text-xs text-chalk/60">
              Counter POS vs Online Store breakdown, product margins, best sellers, and dead stock clearance.
            </p>
          </div>

          {/* Filters & Export */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Range Selector */}
            <div className="flex items-center rounded-pill bg-chalk/8 p-1 border border-chalk/12 text-xs">
              {[
                { key: "today", label: "Today" },
                { key: "7d", label: "7D" },
                { key: "30d", label: "30D" },
                { key: "ytd", label: "YTD" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setDateRange(item.key as any)}
                  className={cn(
                    "rounded-pill px-3 py-1 font-semibold transition-all",
                    dateRange === item.key
                      ? "bg-volt-400 text-ink-900 font-bold"
                      : "text-chalk/60 hover:text-chalk"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Export Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setExportMenuOpen((o) => !o)}
                className="h-9 text-xs"
              >
                <Download className="size-3.5 mr-1.5" />
                <span>Export Menu</span>
              </Button>

              {exportMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-[16px] border border-chalk/18 bg-court-600 p-2 shadow-2xl z-50 text-xs">
                  <button
                    onClick={() => handleExport("PDF")}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-chalk/10 text-chalk transition-colors"
                  >
                    <FileText className="size-4 text-red-400" />
                    <span>Export PDF Summary</span>
                  </button>
                  <button
                    onClick={() => handleExport("CSV")}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-chalk/10 text-chalk transition-colors"
                  >
                    <FileSpreadsheet className="size-4 text-emerald-400" />
                    <span>Export CSV Raw Data</span>
                  </button>
                  <button
                    onClick={() => handleExport("EXCEL")}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-chalk/10 text-chalk transition-colors"
                  >
                    <FileSpreadsheet className="size-4 text-blue-400" />
                    <span>Export Excel Workbook</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── KPI Strip ─── */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-[20px] border border-chalk/14 bg-court-600/70 p-4 backdrop-blur-md">
            <span className="text-xs font-semibold text-chalk/60 uppercase tracking-wider block">
              Gross Revenue
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black text-volt-400">
                <Money amount={274200} />
              </span>
              <span className="rounded-pill bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 flex items-center">
                <ArrowUpRight className="size-3 mr-0.5" /> 14.8%
              </span>
            </div>
            <span className="text-[11px] text-chalk/50 mt-1 block">vs previous 30 days</span>
          </div>

          <div className="rounded-[20px] border border-chalk/14 bg-court-600/70 p-4 backdrop-blur-md">
            <span className="text-xs font-semibold text-chalk/60 uppercase tracking-wider block">
              Units Sold
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black text-chalk">286 units</span>
              <span className="rounded-pill bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 flex items-center">
                <ArrowUpRight className="size-3 mr-0.5" /> 8.4%
              </span>
            </div>
            <span className="text-[11px] text-chalk/50 mt-1 block">Rackets, Balls & Grips</span>
          </div>

          <div className="rounded-[20px] border border-chalk/14 bg-court-600/70 p-4 backdrop-blur-md">
            <span className="text-xs font-semibold text-chalk/60 uppercase tracking-wider block">
              Blended Gross Margin
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-400">42.6%</span>
              <span className="rounded-pill bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 flex items-center">
                <ArrowUpRight className="size-3 mr-0.5" /> 2.1%
              </span>
            </div>
            <span className="text-[11px] text-chalk/50 mt-1 block">Net after member discounts</span>
          </div>

          <div className="rounded-[20px] border border-chalk/14 bg-court-600/70 p-4 backdrop-blur-md">
            <span className="text-xs font-semibold text-chalk/60 uppercase tracking-wider block">
              Restring Service Jobs
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-300">48 jobs</span>
              <span className="text-xs font-bold text-chalk/70">₹45,600</span>
            </div>
            <span className="text-[11px] text-chalk/50 mt-1 block">Workshop throughput</span>
          </div>
        </div>

        {/* ─── Recharts Visualization Grid ─── */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Daily Revenue BarChartCard (8 cols) */}
          <div className="lg:col-span-8 rounded-[22px] border border-chalk/14 bg-court-600/70 p-5 backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-chalk">Channel Revenue Trend (₹)</h3>
                <p className="text-[11px] text-chalk/50">Counter POS vs Online Click & Collect</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-[11px] text-chalk/70">
                  <span className="size-2.5 rounded-full bg-volt-400" /> Counter POS
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-chalk/70">
                  <span className="size-2.5 rounded-full bg-sky-400" /> Online Store
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0d1b2a",
                      borderColor: "rgba(255,255,255,0.15)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`]}
                  />
                  <Bar dataKey="counter" name="Counter POS" fill="#d5f63a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="online" name="Online Store" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Sales DonutChartCard (4 cols) */}
          <div className="lg:col-span-4 rounded-[22px] border border-chalk/14 bg-court-600/70 p-5 backdrop-blur-md flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-chalk">Sales by Category</h3>
              <p className="text-[11px] text-chalk/50">Revenue share across product departments</p>
            </div>

            <div className="h-52 w-full my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0d1b2a",
                      borderColor: "rgba(255,255,255,0.15)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-1 text-[10px] text-chalk/70 border-t border-chalk/10 pt-2">
              {categoryData.slice(0, 4).map((c, i) => (
                <div key={c.name} className="flex items-center gap-1.5 truncate">
                  <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i] }} />
                  <span className="truncate">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Tables: Best Sellers & Dead Stock ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-6">
          {/* Best Sellers */}
          <div className="rounded-[22px] border border-chalk/14 bg-court-600/70 p-5 backdrop-blur-md">
            <h3 className="text-sm font-bold text-chalk mb-1">Top Selling Items</h3>
            <p className="text-[11px] text-chalk/50 mb-3">Ranked by total net revenue generated</p>

            <table className="w-full text-left text-xs">
              <thead className="border-b border-chalk/10 text-chalk/50 uppercase text-[10px]">
                <tr>
                  <th className="pb-2 font-bold w-6">#</th>
                  <th className="pb-2 font-bold">Product</th>
                  <th className="pb-2 font-bold text-center">Units</th>
                  <th className="pb-2 font-bold text-right">Revenue</th>
                  <th className="pb-2 font-bold text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chalk/8">
                {bestSellers.map((item) => (
                  <tr key={item.rank} className="hover:bg-chalk/6">
                    <td className="py-2.5 font-bold text-volt-400">{item.rank}</td>
                    <td className="py-2.5 pr-2">
                      <p className="font-semibold text-chalk truncate max-w-[180px]">{item.name}</p>
                      <p className="text-[10px] text-chalk/50">{item.brand}</p>
                    </td>
                    <td className="py-2.5 text-center font-bold text-chalk">{item.units}</td>
                    <td className="py-2.5 text-right font-bold text-chalk">
                      <Money amount={item.revenue} />
                    </td>
                    <td className="py-2.5 text-right text-emerald-400 font-semibold">{item.margin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Dead Stock Clearances (no sales in 30+ days) */}
          <div className="rounded-[22px] border border-chalk/14 bg-court-600/70 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-chalk flex items-center gap-1.5">
                <AlertTriangle className="size-4 text-amber-400" />
                <span>Dead Stock Clearances</span>
              </h3>
              <span className="rounded-pill bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                0 sales in 30+ days
              </span>
            </div>
            <p className="text-[11px] text-chalk/50 mb-3">Capital tied up in dormant inventory</p>

            <div className="space-y-2.5">
              {deadStock.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-chalk/10 bg-court-700/60 p-3 text-xs flex flex-col justify-between gap-1.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-chalk">{item.name}</p>
                      <p className="font-mono text-[10px] text-chalk/50">
                        {item.sku} · {item.daysIdle} days idle
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-300 block">
                        <Money amount={item.tiedValuation} />
                      </span>
                      <span className="text-[10px] text-chalk/50">({item.onHand} in stock)</span>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-chalk/8 text-[11px] text-volt-300/90 flex items-center gap-1">
                    <Sparkles className="size-3 text-volt-400 shrink-0" />
                    <span>Action: {item.recommendation}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
