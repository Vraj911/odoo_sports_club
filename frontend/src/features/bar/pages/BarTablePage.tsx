import { useState } from "react";
import { useGo } from "@/app/router/links";
import { useBarStore } from "../barStore";
import { MenuItem, MenuCategory, OrderLineItem } from "../types";
import { MenuItemTile } from "../components/MenuItemTile";
import { ModifiersModal } from "../components/ModifiersModal";
import { CourtOrderLinkModal } from "../components/CourtOrderLinkModal";
import { AdminPinDialog } from "@/components/shared/AdminPinDialog";
import {
  ArrowLeft,
  Search,
  Send,
  Receipt,
  UserCheck,
  UserX,
  Lock,
  Plus,
  Minus,
  Trash2,
  Activity,
  CheckCircle2,
  Beer,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// Demo club members for quick picker
const DEMO_MEMBERS = [
  { memberId: "M-1011", name: "Pratham Shah", tier: "GOLD" as const, phone: "+91 99300 22119" },
  { memberId: "M-1002", name: "Vikramaditya Singhania", tier: "PLATINUM" as const, phone: "+91 98111 88990" },
  { memberId: "M-1004", name: "Ananya Birla", tier: "GOLD" as const, phone: "+91 98201 44552" },
  { memberId: "M-1009", name: "Devansh Mehta", tier: "SILVER" as const, phone: "+91 99100 88221" },
  { memberId: "M-1015", name: "Kunal Kapoor", tier: "JUNIOR" as const, phone: "+91 98765 43210" },
];

export function BarTablePage() {
  const go = useGo();

  // Extract table ID from path or URL
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const tableIdMatch = pathname.match(/\/bar\/table\/([^/]+)/);
  const tableId = tableIdMatch ? tableIdMatch[1] : "T1";

  const {
    tables,
    menuItems,
    getOrderForTable,
    addItemToOrder,
    updateLineQuantity,
    updateLineModifiers,
    voidOrCompLine,
    sendOrderToStation,
    markLineServed,
    setCustomerOnOrder,
    clearCustomerFromOrder,
    requestBillForTable,
    attachOrderToCourt,
  } = useBarStore();

  const currentTable = tables.find((t) => t.id === tableId) || {
    id: tableId,
    name: tableId === "T-QUICK" ? "Quick Takeaway" : `Table ${tableId.replace("T", "")}`,
    number: 1,
    seats: 4,
    section: "MAIN_BAR" as const,
    status: "FREE" as const,
  };

  const order = getOrderForTable(tableId);

  // Menu Search & Category
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | MenuCategory>("ALL");

  // Modifiers Modal State
  const [modifierItem, setModifierItem] = useState<MenuItem | null>(null);

  // Court Link Modal State
  const [isCourtModalOpen, setIsCourtModalOpen] = useState(false);

  // Admin PIN Dialog state for void/comp of sent lines
  const [lineToVoid, setLineToVoid] = useState<OrderLineItem | null>(null);
  const [isAdminPinOpen, setIsAdminPinOpen] = useState(false);
  const [isCompAction, setIsCompAction] = useState(false);

  // Member Search State
  const [showMemberPicker, setShowMemberPicker] = useState(false);

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleAddItem = (item: MenuItem) => {
    const res = addItemToOrder(order.id, item);
    if (!res.success && res.error) {
      alert(res.error);
    }
  };

  const handleSendToStation = () => {
    const res = sendOrderToStation(order.id);
    if (res.sentCount > 0) {
      alert(`Sent ${res.sentCount} items to Kitchen & Bar displays!`);
    } else {
      alert("No new un-sent items to dispatch.");
    }
  };

  const handleRequestBill = () => {
    requestBillForTable(tableId);
    go(`/bar/bill/${order.id}`);
  };

  const handleLineVoidTrigger = (line: OrderLineItem, isComp = false) => {
    if (line.status === "NEW") {
      // Direct remove
      updateLineQuantity(order.id, line.lineId, -line.quantity);
    } else {
      // Sent line requires Admin PIN
      setLineToVoid(line);
      setIsCompAction(isComp);
      setIsAdminPinOpen(true);
    }
  };

  const handleConfirmAdminPin = (reason: string, pin?: string) => {
    if (lineToVoid && pin) {
      const res = voidOrCompLine(order.id, lineToVoid.lineId, reason, pin, isCompAction);
      if (!res.success && res.error) {
        alert(res.error);
      }
    }
    setIsAdminPinOpen(false);
    setLineToVoid(null);
  };

  return (
    <div className="min-h-screen bg-court-800 text-white flex flex-col">
      {/* Top Bar */}
      <div className="bg-court-700/80 border-b border-white/10 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => go("/bar")}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-colors flex items-center gap-1 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Floor</span>
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div>
            <h2 className="text-base font-bold font-heading text-white flex items-center gap-2">
              <span>{currentTable.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-volt-400/20 text-volt-300 font-mono">
                Order #{order.orderNumber}
              </span>
            </h2>
          </div>
        </div>

        {/* Quick Link to Court button */}
        <div className="flex items-center gap-2">
          {order.courtBookingRef ? (
            <button
              onClick={() => setIsCourtModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-volt-400/15 border border-volt-400/30 text-volt-300 text-xs font-semibold flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5 text-volt-400" />
              <span>Linked: {order.courtBookingRef}</span>
            </button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCourtModalOpen(true)}
              className="h-8 text-xs border-white/20 text-white/70 hover:text-white"
            >
              <Activity className="w-3.5 h-3.5 mr-1" />
              Send to Court
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleRequestBill}
            className="bg-amber-400 hover:bg-amber-500 text-ink-900 font-bold h-8 text-xs"
          >
            <Receipt className="w-3.5 h-3.5 mr-1" />
            Request Bill
          </Button>
        </div>
      </div>

      {/* Main Content: 7 Columns Menu, 5 Columns Order */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ─── LEFT: 7 Columns Catalog ─── */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          {/* Search + Category Tabs */}
          <div className="space-y-2 bg-court-700/50 p-3 rounded-2xl border border-white/10">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search food, beverages, snacks, cocktails..."
                className="pl-9 h-10 text-xs"
              />
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {(["ALL", "FOOD", "SOFT_DRINKS", "BEVERAGES", "SNACKS"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-volt-400 text-ink-900 font-bold shadow-sm"
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {cat.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5 overflow-y-auto max-h-[calc(100vh-210px)] pr-1">
            {filteredMenuItems.map((item) => (
              <MenuItemTile
                key={item.id}
                item={item}
                onAdd={() => handleAddItem(item)}
                onOpenModifiers={() => setModifierItem(item)}
              />
            ))}
          </div>
        </div>

        {/* ─── RIGHT: 5 Columns Order Summary (court-600) ─── */}
        <div className="lg:col-span-5 flex flex-col bg-court-600/90 rounded-2xl border border-white/15 p-4 shadow-xl">
          {/* Customer / Member Header */}
          <div className="pb-3 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Guest / Member
              </span>
              <button
                type="button"
                onClick={() => setShowMemberPicker(!showMemberPicker)}
                className="text-xs text-volt-300 hover:underline flex items-center gap-1 font-medium"
              >
                <UserCheck className="w-3.5 h-3.5" />
                {order.customer ? "Change Member" : "Find Member (Tier Discount)"}
              </button>
            </div>

            {/* Selected Member Display with Auto-Discount */}
            {order.customer && order.customer.tier !== "NONE" ? (
              <div className="bg-volt-400/15 border border-volt-400/30 p-2.5 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{order.customer.name}</span>
                    <span className="px-1.5 py-0.2 rounded bg-volt-400 text-ink-900 font-bold text-[10px]">
                      {order.customer.tier}
                    </span>
                  </div>
                  <span className="text-[11px] text-volt-300 font-semibold mt-0.5 block">
                    ✓ {order.customer.discountPercent}% Member Discount Applied Automatically
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => clearCustomerFromOrder(order.id)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"
                  title="Remove member"
                >
                  <UserX className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 p-2 rounded-xl text-xs text-white/60 flex items-center justify-between">
                <span>Walk-in Guest (No discount)</span>
                <button
                  type="button"
                  onClick={() => setShowMemberPicker(true)}
                  className="text-volt-300 hover:underline font-semibold"
                >
                  Scan / Search Member
                </button>
              </div>
            )}

            {/* Quick Member Selector Drawer / Dropdown */}
            {showMemberPicker && (
              <div className="mt-2 p-2 bg-navy-900 rounded-xl border border-white/20 space-y-1">
                <span className="text-[10px] text-white/50 block mb-1">Select demo club member:</span>
                {DEMO_MEMBERS.map((m) => (
                  <button
                    key={m.memberId}
                    type="button"
                    onClick={() => {
                      setCustomerOnOrder(order.id, m);
                      setShowMemberPicker(false);
                    }}
                    className="w-full text-left p-1.5 rounded hover:bg-white/10 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-white">{m.name}</span>
                    <span className="px-1.5 py-0.2 rounded bg-volt-400 text-ink-900 font-bold text-[10px]">
                      {m.tier}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Line Items List */}
          <div className="flex-1 my-3 overflow-y-auto max-h-[380px] space-y-2 pr-1">
            {order.items.length === 0 ? (
              <div className="py-16 text-center text-white/40 text-xs">
                Tap items from the menu on the left to add them to this order.
              </div>
            ) : (
              order.items.map((line) => {
                const isSent = line.status !== "NEW";
                const isVoided = line.status === "VOIDED";
                const isReady = line.status === "READY";

                return (
                  <div
                    key={line.lineId}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isVoided
                        ? "bg-red-950/20 border-red-500/30 opacity-50 line-through"
                        : isReady
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-court-700/60 border-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-white">{line.name}</span>
                          {/* Station chip */}
                          <span
                            className={`text-[9px] font-bold px-1 rounded uppercase ${
                              line.station === "KITCHEN"
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-cyan-500/20 text-cyan-300"
                            }`}
                          >
                            {line.station}
                          </span>

                          {/* Status Pill */}
                          <span
                            onClick={() => {
                              if (isReady) markLineServed(order.id, line.lineId);
                            }}
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full cursor-pointer ${
                              isReady
                                ? "bg-volt-400 text-ink-900 animate-pulse hover:bg-volt-500"
                                : line.status === "PREPARING"
                                ? "bg-amber-400/20 text-amber-300"
                                : line.status === "SENT"
                                ? "bg-blue-400/20 text-blue-300"
                                : "bg-white/15 text-white/70"
                            }`}
                            title={isReady ? "Click to mark SERVED" : undefined}
                          >
                            {line.status} {isReady && "✓ (Tap to Serve)"}
                          </span>
                        </div>

                        {/* Modifiers & Notes */}
                        {(line.modifiers?.length || line.notes) && (
                          <div className="text-[11px] text-volt-300/80 mt-0.5 font-medium">
                            {line.modifiers && line.modifiers.length > 0 && (
                              <span>[{line.modifiers.join(", ")}] </span>
                            )}
                            {line.notes && <span className="italic">"{line.notes}"</span>}
                          </div>
                        )}

                        {/* Void reason audit */}
                        {isVoided && line.voidReason && (
                          <div className="text-[10px] text-red-400 mt-0.5">
                            Reason: {line.voidReason} ({line.voidedBy})
                          </div>
                        )}
                      </div>

                      {/* Line Total */}
                      <span className="text-xs font-mono font-bold text-volt-300">
                        ₹{(line.price * line.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* Quantity Stepper & Void Controls */}
                    {!isVoided && (
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/10">
                        <div className="flex items-center gap-1.5 bg-white/5 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (!isSent) {
                                updateLineQuantity(order.id, line.lineId, -1);
                              } else {
                                handleLineVoidTrigger(line, false);
                              }
                            }}
                            className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs"
                            title={isSent ? "Void sent line (Admin PIN)" : "Decrease quantity"}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-mono font-bold text-white">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (!isSent) {
                                updateLineQuantity(order.id, line.lineId, 1);
                              } else {
                                alert("Sent items are locked. Add extra units as a new line.");
                              }
                            }}
                            className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
                              !isSent
                                ? "bg-white/10 hover:bg-white/20 text-white"
                                : "bg-white/5 text-white/30 cursor-not-allowed"
                            }`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Sent line lock / void action */}
                        {isSent ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleLineVoidTrigger(line, true)}
                              className="text-[10px] text-amber-300 hover:underline px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 flex items-center gap-0.5"
                              title="Comp line with Admin PIN"
                            >
                              <Lock className="w-2.5 h-2.5" />
                              Comp
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLineVoidTrigger(line, false)}
                              className="text-[10px] text-red-300 hover:underline px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/30 flex items-center gap-0.5"
                              title="Void line with Admin PIN"
                            >
                              <Lock className="w-2.5 h-2.5" />
                              Void
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateLineQuantity(order.id, line.lineId, -line.quantity)}
                            className="text-white/40 hover:text-red-400 p-1"
                            title="Remove line"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Financial Totals Strip */}
          <div className="space-y-1.5 pt-3 border-t border-white/10 text-xs">
            <div className="flex justify-between text-white/70">
              <span>Subtotal:</span>
              <span className="font-mono">₹{order.subtotal.toLocaleString("en-IN")}</span>
            </div>

            {order.discountAmount > 0 && (
              <div className="flex justify-between text-volt-300 font-semibold">
                <span>{order.discountDescription || "Member Discount"}:</span>
                <span className="font-mono">−₹{order.discountAmount.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div className="flex justify-between text-white/70">
              <span>GST (F&B / Alcohol):</span>
              <span className="font-mono">₹{order.taxAmount.toLocaleString("en-IN")}</span>
            </div>

            <div className="flex justify-between items-center text-base font-bold text-white pt-1 border-t border-white/10">
              <span>Total:</span>
              <span className="font-mono text-xl font-bold text-volt-300">
                ₹{order.total.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Action Buttons: Send to Kitchen / Request Bill */}
          <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2 mt-2">
            <Button
              onClick={handleSendToStation}
              className="bg-volt-400 hover:bg-volt-500 text-ink-900 font-bold h-12 text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-volt-400/20"
            >
              <Send className="w-4 h-4" />
              Send to Kitchen/Bar
            </Button>

            <Button
              variant="outline"
              onClick={handleRequestBill}
              className="border-white/20 hover:bg-white/10 text-white font-semibold h-12 text-xs flex items-center justify-center gap-1.5"
            >
              <Receipt className="w-4 h-4" />
              Request Bill
            </Button>
          </div>
        </div>
      </div>

      {/* Modifiers Modal */}
      {modifierItem && (
        <ModifiersModal
          isOpen={!!modifierItem}
          onClose={() => setModifierItem(null)}
          menuItem={modifierItem}
          onConfirm={(mods, notes) => {
            addItemToOrder(order.id, modifierItem, 1, mods, notes);
          }}
        />
      )}

      {/* Court Link Modal */}
      <CourtOrderLinkModal
        isOpen={isCourtModalOpen}
        onClose={() => setIsCourtModalOpen(false)}
        currentCourt={order.courtBookingRef}
        onConfirm={(court) => attachOrderToCourt(order.id, court)}
      />

      {/* Admin PIN Dialog for Void / Comp */}
      <AdminPinDialog
        isOpen={isAdminPinOpen}
        onClose={() => {
          setIsAdminPinOpen(false);
          setLineToVoid(null);
        }}
        onConfirm={handleConfirmAdminPin}
        title={isCompAction ? "Admin Approval: Comp Item" : "Admin Approval: Void Sent Item"}
        description="Editing or cancelling sent tickets requires administrator authorization and an audit rationale."
      />
    </div>
  );
}
export default BarTablePage;
