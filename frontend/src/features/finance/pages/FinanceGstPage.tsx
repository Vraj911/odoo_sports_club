import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Table, type Column } from "@/components/ui/Table";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { useFinanceStore, formatCurrency } from "../financeStore";
import { PeriodLockedBanner } from "../components/PeriodLockedBanner";
import { PeriodLockModal } from "../components/PeriodLockModal";
import { formatINR } from "@/components/shared/Money";
import { useGo } from "@/app/router/links";
import {
  Percent,
  Download,
  Calendar,
  Building,
  ShieldCheck,
  FileSpreadsheet,
  ArrowRight,
  Calculator,
  SlidersHorizontal,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";

export default function FinanceGstPage() {
  const go = useGo();
  const { invoices, vendorBills, clubProfile } = useFinanceStore();

  const [period, setPeriod] = useState("October 2026");
  const [activeTab, setActiveTab] = useState<string>("SALES");

  // Output Tax calculations (from Invoices)
  const outputGstSummary = useMemo(() => {
    let taxableTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    // Rate breakdown
    const rateBreakdown: Record<string, { taxable: number; tax: number }> = {
      "18%": { taxable: 0, tax: 0 },
      "12%": { taxable: 0, tax: 0 },
      "5%": { taxable: 0, tax: 0 },
      "0%": { taxable: 0, tax: 0 },
    };

    invoices
      .filter((inv) => inv.status !== "VOID")
      .forEach((inv) => {
        taxableTotal += inv.subtotal;
        cgstTotal += inv.cgstTotal;
        sgstTotal += inv.sgstTotal;
        igstTotal += inv.igstTotal;

        inv.items.forEach((item) => {
          const rateKey = `${item.gstRate}%`;
          if (!rateBreakdown[rateKey]) {
            rateBreakdown[rateKey] = { taxable: 0, tax: 0 };
          }
          rateBreakdown[rateKey].taxable += item.taxableAmount;
          rateBreakdown[rateKey].tax += item.cgst + item.sgst + item.igst;
        });
      });

    const totalOutputTax = cgstTotal + sgstTotal + igstTotal;

    return {
      taxableTotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      totalOutputTax,
      rateBreakdown,
    };
  }, [invoices]);

  // Input Tax Credit (ITC) calculations (from Vendor Bills)
  const inputGstSummary = useMemo(() => {
    let totalTaxable = 0;
    let totalItc = 0;

    vendorBills.forEach((b) => {
      totalTaxable += b.amount - b.taxAmount;
      totalItc += b.taxAmount;
    });

    return {
      totalTaxable,
      totalItc,
      cgstItc: totalItc / 2,
      sgstItc: totalItc / 2,
    };
  }, [vendorBills]);

  const netGstPayable = Math.max(
    0,
    outputGstSummary.totalOutputTax - inputGstSummary.totalItc
  );

  const tabs: TabItem[] = [
    { id: "SALES", label: "GSTR-1 Sales Register (Outward Supplies)" },
    { id: "PURCHASE", label: "GSTR-2B Purchase Register (ITC Inward Supplies)" },
  ];

  // Sales Register Columns
  const salesColumns: Column<any>[] = [
    {
      key: "docNo",
      header: "Invoice No / Date",
      render: (inv) => (
        <div>
          <span className="font-mono font-bold text-volt-400">{inv.invoiceNumber}</span>
          <p className="text-[11px] text-chalk/60 font-mono">{inv.date}</p>
        </div>
      ),
    },
    {
      key: "party",
      header: "Recipient / GSTIN",
      render: (inv) => (
        <div>
          <span className="font-semibold text-chalk text-xs">{inv.customerName}</span>
          {inv.customerGstin ? (
            <p className="text-[11px] font-mono text-amber-300">
              {inv.customerGstin} (B2B)
            </p>
          ) : (
            <p className="text-[11px] text-chalk/50 italic">B2C Consumer</p>
          )}
        </div>
      ),
    },
    {
      key: "pos",
      header: "Place of Supply",
      render: (inv) => (
        <span className="font-mono text-xs text-chalk/80">
          {inv.customerGstin && !inv.customerGstin.startsWith("27")
            ? "Inter-State (IGST)"
            : "27-Maharashtra (Intra)"}
        </span>
      ),
    },
    {
      key: "taxable",
      header: "Taxable Value",
      align: "right",
      render: (inv) => (
        <span className="font-mono text-xs font-semibold text-chalk">
          {formatINR(inv.subtotal)}
        </span>
      ),
    },
    {
      key: "cgst",
      header: "CGST",
      align: "right",
      render: (inv) => (
        <span className="font-mono text-xs text-chalk/80">{formatINR(inv.cgstTotal)}</span>
      ),
    },
    {
      key: "sgst",
      header: "SGST",
      align: "right",
      render: (inv) => (
        <span className="font-mono text-xs text-chalk/80">{formatINR(inv.sgstTotal)}</span>
      ),
    },
    {
      key: "igst",
      header: "IGST",
      align: "right",
      render: (inv) => (
        <span className="font-mono text-xs text-chalk/80">{formatINR(inv.igstTotal)}</span>
      ),
    },
    {
      key: "total",
      header: "Invoice Total",
      align: "right",
      render: (inv) => (
        <span className="font-mono text-xs font-bold text-volt-400">
          {formatINR(inv.totalAmount)}
        </span>
      ),
    },
  ];

  // Purchase Register Columns
  const purchaseColumns: Column<any>[] = [
    {
      key: "billNo",
      header: "Bill No / Date",
      render: (b) => (
        <div>
          <span className="font-mono font-bold text-chalk">{b.billNumber}</span>
          <p className="text-[11px] text-chalk/60 font-mono">{b.date}</p>
        </div>
      ),
    },
    {
      key: "vendor",
      header: "Supplier Name",
      render: (b) => (
        <div>
          <span className="font-semibold text-chalk text-xs">{b.vendorName}</span>
          <p className="text-[11px] text-chalk/60 truncate max-w-xs">{b.itemsDescription}</p>
        </div>
      ),
    },
    {
      key: "taxable",
      header: "Taxable Value",
      align: "right",
      render: (b) => (
        <span className="font-mono text-xs text-chalk">
          {formatINR(b.amount - b.taxAmount)}
        </span>
      ),
    },
    {
      key: "tax",
      header: "Input Tax Credit (ITC)",
      align: "right",
      render: (b) => (
        <span className="font-mono text-xs font-bold text-emerald-400">
          {formatINR(b.taxAmount)}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total Bill",
      align: "right",
      render: (b) => (
        <span className="font-mono text-xs font-semibold text-chalk">
          {formatINR(b.amount)}
        </span>
      ),
    },
  ];

  const handleExportCSV = () => {
    let csvData = "";
    if (activeTab === "SALES") {
      const headers = [
        "Invoice Number",
        "Invoice Date",
        "Customer Name",
        "Customer GSTIN",
        "Taxable Value",
        "CGST",
        "SGST",
        "IGST",
        "Total",
      ];
      const rows = invoices.map((inv) => [
        inv.invoiceNumber,
        inv.date,
        `"${inv.customerName}"`,
        inv.customerGstin || "URP",
        inv.subtotal,
        inv.cgstTotal,
        inv.sgstTotal,
        inv.igstTotal,
        inv.totalAmount,
      ]);
      csvData = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    } else {
      const headers = [
        "Bill Number",
        "Bill Date",
        "Vendor Name",
        "Taxable Value",
        "Input Tax (ITC)",
        "Bill Total",
      ];
      const rows = vendorBills.map((b) => [
        b.billNumber,
        b.date,
        `"${b.vendorName}"`,
        b.amount - b.taxAmount,
        b.taxAmount,
        b.amount,
      ]);
      csvData = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    }

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvData);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `GST_${activeTab}_Register_${period.replace(" ", "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="GST Compliance & Tax Registers"
        subtitle="GSTR-1 outward sales, GSTR-2B input tax credit reconciliation, and net tax payable calculation (FIN-07, FIN-13)."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => go("/admin/taxes")}
              className="gap-1.5"
            >
              <Calculator className="size-3.5" /> Tax Config (/admin/taxes)
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportCSV} className="gap-1.5">
              <Download className="size-3.5" /> Export Register CSV
            </Button>
          </div>
        }
      />

      <PeriodLockedBanner />
      <PeriodLockModal />

      {/* Period Picker & Club GSTIN Card */}
      <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-volt-400/20 text-volt-400">
            <Percent className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-chalk/60">
              Taxpayer Legal Entity
            </p>
            <p className="text-sm font-bold text-chalk">{clubProfile.legalName}</p>
            <p className="text-xs font-mono text-amber-300">
              GSTIN: {clubProfile.gstin} · State Code: 27 (Maharashtra)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-chalk/70">Filing Period:</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="h-10 rounded-input border border-chalk/14 bg-court-700 px-3 text-xs text-chalk focus:outline-none focus:ring-2 focus:ring-volt-400"
          >
            <option value="October 2026">October 2026 (Active)</option>
            <option value="September 2026">September 2026</option>
            <option value="August 2026">August 2026</option>
            <option value="Q2 FY2026-27">Q2 FY 2026-27</option>
          </select>
        </div>
      </Card>

      {/* Summary KPI Cards: Output Tax, Input Tax Credit, Net Payable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-court-600">
          <p className="text-xs font-semibold text-chalk/70 uppercase tracking-wider">
            Total Output Tax (Sales)
          </p>
          <p className="mt-1 text-2xl font-bold font-mono text-volt-400">
            {formatCurrency(outputGstSummary.totalOutputTax)}
          </p>
          <p className="text-[11px] text-chalk/60 mt-1">
            CGST: {formatINR(outputGstSummary.cgstTotal)} • SGST: {formatINR(outputGstSummary.sgstTotal)}
          </p>
        </Card>

        <Card className="p-5 bg-court-600">
          <p className="text-xs font-semibold text-chalk/70 uppercase tracking-wider">
            Input Tax Credit (ITC)
          </p>
          <p className="mt-1 text-2xl font-bold font-mono text-emerald-400">
            {formatCurrency(inputGstSummary.totalItc)}
          </p>
          <p className="text-[11px] text-chalk/60 mt-1">
            From verified vendor invoices & equipment
          </p>
        </Card>

        <Card className="p-5 bg-court-600 border-amber-400/30">
          <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
            Net GST Payable (GSTR-3B)
          </p>
          <p className="mt-1 text-2xl font-bold font-mono text-amber-300">
            {formatCurrency(netGstPayable)}
          </p>
          <p className="text-[11px] text-chalk/60 mt-1">Output Tax minus Eligible ITC</p>
        </Card>

        <Card className="p-5 bg-court-600">
          <p className="text-xs font-semibold text-chalk/70 uppercase tracking-wider">
            Total Taxable Turnover
          </p>
          <p className="mt-1 text-2xl font-bold font-mono text-chalk">
            {formatCurrency(outputGstSummary.taxableTotal)}
          </p>
          <p className="text-[11px] text-chalk/60 mt-1">Excludes exempt services</p>
        </Card>
      </div>

      {/* Output Tax by Rate Breakdown */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-bold text-chalk uppercase tracking-wider">
          Tax Liability Breakdown by GST Slab Rate
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(outputGstSummary.rateBreakdown).map(([rate, data]) => (
            <div
              key={rate}
              className="rounded-xl border border-chalk/10 bg-court-700/50 p-3.5 space-y-1 text-xs"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-volt-400">{rate} Slab</span>
                <span className="text-[10px] text-chalk/50 font-mono">HSN SAC</span>
              </div>
              <p className="text-chalk/70">
                Taxable: <span className="font-mono text-chalk font-semibold">{formatINR(data.taxable)}</span>
              </p>
              <p className="text-chalk/70">
                Tax: <span className="font-mono text-volt-400 font-semibold">{formatINR(data.tax)}</span>
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Sales Register and Purchase Register Tabs & Table */}
      <Card className="p-5 space-y-4">
        <div className="border-b border-chalk/10 pb-3">
          <Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />
        </div>

        {activeTab === "SALES" ? (
          <Table
            columns={salesColumns}
            data={invoices.filter((i) => i.status !== "VOID")}
            keyExtractor={(inv) => inv.id}
            emptyTitle="No sales invoices"
            emptySubtitle="No outward taxable invoices for this period."
          />
        ) : (
          <Table
            columns={purchaseColumns}
            data={vendorBills}
            keyExtractor={(b) => b.id}
            emptyTitle="No vendor purchase bills"
            emptySubtitle="No inward ITC bills recorded for this period."
          />
        )}
      </Card>
    </div>
  );
}
