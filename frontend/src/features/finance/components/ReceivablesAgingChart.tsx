import { useMemo } from "react";
import type { InvoiceRecord } from "../types";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "../financeStore";
import { formatINR } from "@/components/shared/Money";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";
import { AlertCircle, Clock } from "lucide-react";

export interface ReceivablesAgingProps {
  invoices: InvoiceRecord[];
}

export function ReceivablesAgingChart({ invoices }: ReceivablesAgingProps) {
  const agingData = useMemo(() => {
    const today = new Date().getTime();

    let bucket0to30 = 0;
    let count0to30 = 0;
    let bucket31to60 = 0;
    let count31to60 = 0;
    let bucket60Plus = 0;
    let count60Plus = 0;

    const unpaidInvoices = invoices.filter(
      (inv) => inv.status !== "PAID" && inv.status !== "VOID" && inv.balanceDue > 0
    );

    unpaidInvoices.forEach((inv) => {
      const dueTime = new Date(inv.dueDate).getTime();
      const diffDays = Math.max(0, Math.floor((today - dueTime) / (1000 * 60 * 60 * 24)));

      if (diffDays <= 30) {
        bucket0to30 += inv.balanceDue;
        count0to30 += 1;
      } else if (diffDays <= 60) {
        bucket31to60 += inv.balanceDue;
        count31to60 += 1;
      } else {
        bucket60Plus += inv.balanceDue;
        count60Plus += 1;
      }
    });

    const total = bucket0to30 + bucket31to60 + bucket60Plus;

    return {
      chart: [
        {
          name: "0-30 Days",
          amount: bucket0to30,
          count: count0to30,
          color: "#34d399", // emerald
        },
        {
          name: "31-60 Days",
          amount: bucket31to60,
          count: count31to60,
          color: "#fbbf24", // amber
        },
        {
          name: "60+ Days",
          amount: bucket60Plus,
          count: count60Plus,
          color: "#f87171", // red
        },
      ],
      bucket0to30,
      count0to30,
      bucket31to60,
      count31to60,
      bucket60Plus,
      count60Plus,
      total,
      totalInvoices: count0to30 + count31to60 + count60Plus,
    };
  }, [invoices]);

  return (
    <Card className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-chalk flex items-center gap-2">
            <Clock className="size-4 text-volt-400" /> Receivables Aging Report (FIN-06)
          </h3>
          <p className="text-xs text-chalk/60 mt-0.5">
            Outstanding invoices categorized by delinquency age buckets
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-chalk/60">Total Unpaid Receivables:</span>
          <p className="text-xl font-bold font-mono text-volt-400">
            {formatCurrency(agingData.total)}
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={agingData.chart} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="rgba(255,255,255,0.6)"
              tick={{ fill: "rgba(255,255,255,0.8)", fontSize: 12 }}
            />
            <YAxis
              stroke="rgba(255,255,255,0.6)"
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0]?.payload as { name: string; amount: number; count: number } | undefined;
                  if (!data) return null;
                  return (
                    <div className="rounded-xl border border-chalk/14 bg-court-700 p-3 text-xs shadow-xl text-chalk">
                      <p className="font-bold text-sm text-volt-400">{data.name}</p>
                      <p className="mt-1 font-mono font-semibold">
                        Outstanding: {formatCurrency(data.amount)}
                      </p>
                      <p className="text-chalk/70">{data.count} invoice(s)</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
              {agingData.chart.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-xl border border-chalk/14 bg-court-600/50">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-court-700/80 text-chalk/70 font-semibold uppercase text-[10px] tracking-wider border-b border-chalk/10">
            <tr>
              <th className="py-2.5 px-4">Aging Bracket</th>
              <th className="py-2.5 px-4 text-center">Unpaid Invoices</th>
              <th className="py-2.5 px-4 text-right">Outstanding Amount</th>
              <th className="py-2.5 px-4 text-right">% of Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-chalk/8 text-chalk/90">
            <tr>
              <td className="py-3 px-4 font-medium flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-emerald-400" /> Current (0–30 Days)
              </td>
              <td className="py-3 px-4 text-center font-mono">{agingData.count0to30}</td>
              <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                {formatINR(agingData.bucket0to30)}
              </td>
              <td className="py-3 px-4 text-right font-mono text-chalk/70">
                {agingData.total > 0
                  ? ((agingData.bucket0to30 / agingData.total) * 100).toFixed(1)
                  : 0}
                %
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-medium flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-amber-400" /> Overdue (31–60 Days)
              </td>
              <td className="py-3 px-4 text-center font-mono">{agingData.count31to60}</td>
              <td className="py-3 px-4 text-right font-mono font-semibold text-amber-400">
                {formatINR(agingData.bucket31to60)}
              </td>
              <td className="py-3 px-4 text-right font-mono text-chalk/70">
                {agingData.total > 0
                  ? ((agingData.bucket31to60 / agingData.total) * 100).toFixed(1)
                  : 0}
                %
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-medium flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-rose-400" /> Severely Overdue (60+ Days)
              </td>
              <td className="py-3 px-4 text-center font-mono">{agingData.count60Plus}</td>
              <td className="py-3 px-4 text-right font-mono font-semibold text-rose-400">
                {formatINR(agingData.bucket60Plus)}
              </td>
              <td className="py-3 px-4 text-right font-mono text-chalk/70">
                {agingData.total > 0
                  ? ((agingData.bucket60Plus / agingData.total) * 100).toFixed(1)
                  : 0}
                %
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}
