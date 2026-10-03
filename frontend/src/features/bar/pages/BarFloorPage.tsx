import { useState } from "react";
import { useGo } from "@/app/router/links";
import { useBarStore } from "../barStore";
import { FloorHeader } from "../components/FloorHeader";
import { TableCard } from "../components/TableCard";
import { BarStockTab } from "../components/BarStockTab";
import { TransferMergeModal } from "../components/TransferMergeModal";
import { CourtOrderLinkModal } from "../components/CourtOrderLinkModal";
import { ClubTable, TableStatus } from "../types";
import { LayoutGrid, Package, PlusCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";

export function BarFloorPage() {
  const go = useGo();
  const { tables, orders, getOrderForTable, transferOrMergeTable } = useBarStore();

  const [activeTab, setActiveTab] = useState<"FLOOR" | "STOCK">("FLOOR");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TableStatus>("ALL");
  const [sectionFilter, setSectionFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Transfer / Merge Modal State
  const [selectedTableForTransfer, setSelectedTableForTransfer] = useState<ClubTable | null>(null);

  // Quick No-Table Order Handler
  const handleNewOrderNoTable = () => {
    // Jump to table/takeaway mode
    go("/bar/table/T-QUICK");
  };

  const filteredTables = tables.filter((t) => {
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchesSection = sectionFilter === "ALL" || t.section === sectionFilter;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.waiterName && t.waiterName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSection && matchesSearch;
  });

  const counts = {
    all: tables.length,
    free: tables.filter((t) => t.status === "FREE").length,
    occupied: tables.filter((t) => t.status === "OCCUPIED").length,
    billRequested: tables.filter((t) => t.status === "BILL_REQUESTED").length,
    reserved: tables.filter((t) => t.status === "RESERVED").length,
  };

  return (
    <div className="min-h-screen bg-court-800 text-white flex flex-col">
      {/* Slim Top Bar */}
      <FloorHeader onNewOrderNoTable={handleNewOrderNoTable} />

      {/* Main Floor Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Navigation Tabs (Floor Map vs Bar Stock) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab("FLOOR")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === "FLOOR"
                  ? "bg-volt-400 text-ink-900 shadow-md font-bold"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Floor Map ({counts.all} Tables)
            </button>
            <button
              onClick={() => setActiveTab("STOCK")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === "STOCK"
                  ? "bg-volt-400 text-ink-900 shadow-md font-bold"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Package className="w-4 h-4" />
              Bar Stock & 86'd Items
            </button>
          </div>

          {/* Section filter pills */}
          {activeTab === "FLOOR" && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {["ALL", "MAIN_BAR", "LOUNGE", "TERRACE", "COURTSIDE"].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSectionFilter(sec)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    sectionFilter === sec
                      ? "bg-white/20 text-white border border-white/30 font-semibold"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  {sec.replace("_", " ")}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab 1: Floor View */}
        {activeTab === "FLOOR" && (
          <div className="space-y-4">
            {/* Status Filter Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-court-700/50 p-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    statusFilter === "ALL"
                      ? "bg-volt-400 text-ink-900 font-bold shadow-sm"
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  All ({counts.all})
                </button>
                <button
                  onClick={() => setStatusFilter("FREE")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    statusFilter === "FREE"
                      ? "bg-emerald-400 text-ink-900 font-bold shadow-sm"
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Free ({counts.free})
                </button>
                <button
                  onClick={() => setStatusFilter("OCCUPIED")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    statusFilter === "OCCUPIED"
                      ? "bg-volt-400 text-ink-900 font-bold shadow-sm"
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-volt-400" />
                  Occupied ({counts.occupied})
                </button>
                <button
                  onClick={() => setStatusFilter("BILL_REQUESTED")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    statusFilter === "BILL_REQUESTED"
                      ? "bg-amber-400 text-ink-900 font-bold shadow-sm"
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Bill Requested ({counts.billRequested})
                </button>
                <button
                  onClick={() => setStatusFilter("RESERVED")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    statusFilter === "RESERVED"
                      ? "bg-purple-400 text-ink-900 font-bold shadow-sm"
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Reserved ({counts.reserved})
                </button>
              </div>

              {/* Quick Search input */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find table, server..."
                  className="pl-8 h-9 text-xs"
                />
              </div>
            </div>

            {/* Floor Grid (12 Tables) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {filteredTables.map((table) => {
                const order = table.currentOrderId
                  ? orders.find((o) => o.id === table.currentOrderId)
                  : undefined;

                return (
                  <TableCard
                    key={table.id}
                    table={table}
                    order={order}
                    onClick={() => go(`/bar/table/${table.id}`)}
                    onQuickAction={(action) => {
                      if (action === "TRANSFER") {
                        setSelectedTableForTransfer(table);
                      } else if (action === "BILL") {
                        if (table.currentOrderId) {
                          go(`/bar/bill/${table.currentOrderId}`);
                        }
                      }
                    }}
                  />
                );
              })}
            </div>

            {filteredTables.length === 0 && (
              <div className="py-16 text-center text-white/40 text-xs">
                No tables found matching your active filters.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Bar Stock & 86'd Items */}
        {activeTab === "STOCK" && <BarStockTab />}
      </div>

      {/* Transfer / Merge Modal */}
      {selectedTableForTransfer && (
        <TransferMergeModal
          isOpen={!!selectedTableForTransfer}
          onClose={() => setSelectedTableForTransfer(null)}
          sourceTable={selectedTableForTransfer}
          availableTables={tables}
          onConfirm={(targetId, mode) => {
            const res = transferOrMergeTable(selectedTableForTransfer.id, targetId, mode);
            alert(res.message);
          }}
        />
      )}
    </div>
  );
}
export default BarFloorPage;
