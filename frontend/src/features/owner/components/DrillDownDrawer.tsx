import { useMemo } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Table, type Column } from "@/components/ui/Table";
import { StatusPill } from "@/components/ui/StatusPill";
import { useOwnerStore, downloadCSV, formatINR } from "../ownerStore";
import type { DrillDownItem } from "../types";
import { Download, FileSpreadsheet, X, Layers } from "lucide-react";

export function DrillDownDrawer() {
  const { drillDown, closeDrillDown } = useOwnerStore();
  const { isOpen, title, subtitle, items } = drillDown;

  const handleExportCSV = () => {
    if (!items.length) return;
    const headers = ["ID", "Timestamp", "Source", "Description", "Customer", "Payment Method", "Amount", "Status"];
    const rows = items.map((i) => [
      i.id,
      i.timestamp,
      i.source,
      i.description,
      i.customerName || "N/A",
      i.method,
      i.amount,
      i.status,
    ]);
    downloadCSV(`ccms-drilldown-${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`, headers, rows);
  };

  const columns: Column<DrillDownItem>[] = [
    {
      key: "item",
      header: "Transaction & Time",
      render: (i) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-chalk text-xs">{i.description}</p>
          <p className="text-[11px] text-chalk/50 font-mono">
            {i.id} · {new Date(i.timestamp).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
          </p>
          {i.customerName && <p className="text-[10px] text-chalk/70">{i.customerName}</p>}
        </div>
      ),
    },
    {
      key: "source",
      header: "Channel",
      render: (i) => (
        <div className="space-y-1">
          <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-court-700 border border-chalk/10 text-chalk">
            {i.source}
          </span>
          <p className="text-[10px] font-mono text-chalk/60">{i.method}</p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (i) => (
        <span className="font-mono text-xs font-bold text-volt-400">
          {formatINR(i.amount)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (i) => (
        <StatusPill variant={i.status === "COMPLETED" ? "success" : i.status === "PENDING" ? "warning" : "neutral"}>
          {i.status}
        </StatusPill>
      ),
    },
  ];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={closeDrillDown}
      title={
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-volt-400/20 text-volt-400">
            <Layers className="size-4" />
          </div>
          <span>{title}</span>
        </div>
      }
      subtitle={subtitle || "Detailed transaction ledger drill-down"}
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-chalk/60 font-mono">
            {items.length} records in this view
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5 text-xs text-volt-400 hover:text-volt-300"
          >
            <Download className="size-3.5" /> Export View CSV
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Table
          data={items}
          columns={columns}
          keyExtractor={(i) => i.id}
          emptyTitle="No records found"
          emptySubtitle="There are no transaction items matching this drill-down filter."
        />
      </div>
    </Drawer>
  );
}
