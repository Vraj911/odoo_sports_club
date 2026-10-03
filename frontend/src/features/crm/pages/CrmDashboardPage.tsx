import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { KPICard } from "@/components/ui/KPICard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useGo } from "@/app/router/links";
import {
  Users,
  Target,
  BadgeIndianRupee,
  Clock,
  TrendingUp,
  ArrowRight,
  Filter,
  Download,
  Calendar,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { useCrmStore } from "../crmStore";
import { CRM_OWNERS } from "../sampleData";

const SOURCE_COLORS = ["#38bdf8", "#d5f63a", "#34d399", "#fbbf24", "#c084fc"];

export default function CrmDashboardPage() {
  const go = useGo();
  const { leads, quotes } = useCrmStore();
  const [timeRange, setTimeRange] = useState<"30d" | "90d" | "all">("30d");

  // KPI Metrics Calculations
  const stats = useMemo(() => {
    const total = leads.length;
    const won = leads.filter((l) => l.stage === "WON").length;
    const lost = leads.filter((l) => l.stage === "LOST").length;
    const active = leads.filter((l) => l.stage !== "WON" && l.stage !== "LOST");
    const pipeline = active.reduce((sum, l) => sum + l.estimatedValue, 0);
    const wonRev = leads.filter((l) => l.stage === "WON").reduce((sum, l) => sum + l.estimatedValue, 0);
    const convRate = total > 0 ? ((won / (won + lost || 1)) * 100).toFixed(1) : "0";

    return {
      newLeads: leads.filter((l) => l.stage === "NEW").length,
      activeLeads: active.length,
      pipelineValue: pipeline,
      wonRevenue: wonRev,
      conversionRate: `${convRate}%`,
      avgResponseHours: "1.8 hrs",
    };
  }, [leads]);

  // Data for Leads by Source Donut
  const sourceChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const src = l.source.replace("_", " ");
      counts[src] = (counts[src] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [leads]);

  // Data for Leads by Stage Funnel/Bar
  const stageChartData = useMemo(() => {
    const stages = [
      { key: "NEW", label: "New Enquiry" },
      { key: "CONTACTED", label: "Contacted" },
      { key: "TRIAL_BOOKED", label: "Trial Booked" },
      { key: "QUOTE_SENT", label: "Quote Sent" },
      { key: "WON", label: "Won / Member" },
      { key: "LOST", label: "Lost" },
    ];
    return stages.map((st) => ({
      stage: st.label,
      count: leads.filter((l) => l.stage === st.key).length,
      value: leads.filter((l) => l.stage === st.key).reduce((sum, l) => sum + l.estimatedValue, 0),
    }));
  }, [leads]);

  // Monthly Trend Data
  const trendData = [
    { month: "May", leads: 18, won: 4, revenue: 140000 },
    { month: "Jun", leads: 24, won: 7, revenue: 235000 },
    { month: "Jul", leads: 32, won: 10, revenue: 380000 },
    { month: "Aug", leads: 40, won: 13, revenue: 490000 },
    { month: "Sep", leads: 52, won: 18, revenue: 685000 },
    { month: "Oct", leads: 25, won: 9, revenue: 345000 },
  ];

  // Top Owners Leaderboard
  const ownerStats = useMemo(() => {
    return CRM_OWNERS.map((owner) => {
      const ownerLeads = leads.filter((l) => l.owner === owner.name);
      const won = ownerLeads.filter((l) => l.stage === "WON").length;
      const pipeline = ownerLeads
        .filter((l) => l.stage !== "WON" && l.stage !== "LOST")
        .reduce((sum, l) => sum + l.estimatedValue, 0);
      const wonValue = ownerLeads
        .filter((l) => l.stage === "WON")
        .reduce((sum, l) => sum + l.estimatedValue, 0);
      const closed = ownerLeads.filter((l) => l.stage === "WON" || l.stage === "LOST").length;
      const winRate = closed > 0 ? Math.round((won / closed) * 100) : 50;

      return {
        ...owner,
        totalLeads: ownerLeads.length,
        wonDeals: won,
        pipelineValue: pipeline,
        wonValue,
        winRate,
      };
    }).sort((a, b) => b.wonValue - a.wonValue);
  }, [leads]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        title="CRM Analytics & Sales Pipeline"
        description="Live overview of member prospect inquiries, deal flow velocity, conversion metrics, and sales rep performance."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white/8 rounded-full p-1 border border-white/14 text-xs">
              <button
                type="button"
                onClick={() => setTimeRange("30d")}
                className={`px-3 py-1 rounded-full font-medium transition-all ${
                  timeRange === "30d" ? "bg-volt-400 text-ink-900" : "text-white/70 hover:text-white"
                }`}
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("90d")}
                className={`px-3 py-1 rounded-full font-medium transition-all ${
                  timeRange === "90d" ? "bg-volt-400 text-ink-900" : "text-white/70 hover:text-white"
                }`}
              >
                Last Quarter
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("all")}
                className={`px-3 py-1 rounded-full font-medium transition-all ${
                  timeRange === "all" ? "bg-volt-400 text-ink-900" : "text-white/70 hover:text-white"
                }`}
              >
                All Time
              </button>
            </div>

            <Button variant="primary" size="sm" onClick={() => go("/crm/leads")}>
              View Lead Board
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        }
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          label="New Enquiries"
          stat={stats.newLeads}
          delta={{ value: "+22% vs last month", direction: "up" }}
          sparklineData={[8, 12, 14, 18, 22, 25]}
        />
        <KPICard
          label="Active Pipeline"
          stat={`₹${(stats.pipelineValue / 100000).toFixed(2)}L`}
          delta={{ value: "+15% velocity", direction: "up" }}
          sparklineData={[3.2, 4.1, 4.8, 5.5, 6.2, 7.8]}
        />
        <KPICard
          label="Lead Conversion"
          stat={stats.conversionRate}
          delta={{ value: "+4.2% YoY", direction: "up" }}
          sparklineData={[22, 24, 25, 27, 28, 31]}
        />
        <KPICard
          label="Avg Response Time"
          stat={stats.avgResponseHours}
          delta={{ value: "-45 mins faster", direction: "up" }}
          sparklineData={[4.2, 3.5, 2.8, 2.2, 1.9, 1.8]}
        />
        <KPICard
          label="Won Revenue"
          stat={`₹${(stats.wonRevenue / 100000).toFixed(2)}L`}
          delta={{ value: "+18% this month", direction: "up" }}
          sparklineData={[2.1, 2.8, 3.4, 4.2, 4.8, 5.2]}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stage Funnel Bar Chart */}
        <Card className="lg:col-span-8 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Pipeline Stages & Deal Volume</h3>
              <p className="text-xs text-white/50">Active prospects grouped across CRM sales cycle stages</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-white/50">Total Active Leads</span>
              <p className="text-sm font-bold text-volt-400">{stats.activeLeads} Prospects</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="stage" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-navy-900 border border-white/20 p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-semibold text-white">{data.stage}</p>
                          <p className="text-volt-400 font-bold">{data.count} Leads</p>
                          <p className="text-white/60">₹{data.value.toLocaleString("en-IN")} pipeline</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#d5f63a" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Source Donut Chart */}
        <Card className="lg:col-span-4 p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Leads by Inflow Source</h3>
            <p className="text-xs text-white/50">Channel breakdown for new prospect inquiries</p>
          </div>

          <div className="h-48 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {sourceChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0];
                      return (
                        <div className="bg-navy-900 border border-white/20 px-3 py-1.5 rounded-lg text-xs">
                          <span className="font-semibold text-white capitalize">{d.name}: </span>
                          <span className="text-volt-400 font-bold">{d.value} leads</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
            {sourceChartData.map((s, idx) => (
              <div key={s.name} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: SOURCE_COLORS[idx % SOURCE_COLORS.length] }}
                />
                <span className="text-white/70 capitalize truncate">{s.name}</span>
                <span className="font-semibold text-white ml-auto">{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Revenue Trend Area Chart */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-white">6-Month Acquisition & Revenue Growth</h3>
            <p className="text-xs text-white/50">Monthly lead intake volume vs. finalized membership revenue</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-volt-400" />
              <span className="text-white/70">Won Revenue (₹)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-sky-400" />
              <span className="text-white/70">Inflow Leads</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="voltGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d5f63a" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#d5f63a" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-navy-900 border border-white/20 p-3 rounded-xl text-xs space-y-1">
                        <p className="font-semibold text-white">{d.month} 2026</p>
                        <p className="text-volt-400 font-bold">Revenue: ₹{d.revenue.toLocaleString("en-IN")}</p>
                        <p className="text-sky-300">New Leads: {d.leads} (Won: {d.won})</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#d5f63a" strokeWidth={2.5} fillOpacity={1} fill="url(#voltGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Top Owners Leaderboard Table */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-base font-semibold text-white">Sales & Membership Rep Leaderboard</h3>
            <p className="text-xs text-white/50">Deal closing velocity, win rates, and managed accounts</p>
          </div>

          <Button variant="ghost" size="sm" onClick={() => go("/crm/leads")}>
            Manage Assignments
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/60 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Sales Advisor</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3 text-center">Active Pipeline</th>
                <th className="py-3 px-3 text-center">Deals Won</th>
                <th className="py-3 px-3 text-right">Won Revenue</th>
                <th className="py-3 px-3 text-right">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8 text-white">
              {ownerStats.map((o, idx) => (
                <tr key={o.name} className="hover:bg-white/4 transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white/40 text-xs w-4">#{idx + 1}</span>
                      <div className="w-7 h-7 rounded-full bg-volt-400/20 border border-volt-400/40 text-volt-400 font-bold flex items-center justify-center text-xs">
                        {o.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{o.name}</p>
                        <p className="text-[11px] text-white/50">{o.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-white/70">{o.role}</td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="bg-white/8 px-2.5 py-1 rounded-full text-white/90 font-medium">
                      {o.totalLeads - o.wonDeals} leads
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center font-semibold text-emerald-400">
                    {o.wonDeals} deals
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-volt-400">
                    ₹{o.wonValue.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <div className="w-16 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-volt-400 rounded-full"
                          style={{ width: `${Math.min(o.winRate, 100)}%` }}
                        />
                      </div>
                      <span className="font-bold text-xs">{o.winRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
