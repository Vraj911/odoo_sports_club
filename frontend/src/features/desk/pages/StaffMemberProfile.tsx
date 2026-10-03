import { useState, useMemo } from "react";
import { useGo } from "@/app/router/links";
import {
  User,
  IdCard,
  Calendar,
  Wallet,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Plus,
  Trash2,
  RefreshCw,
  Zap,
  ShoppingBag,
  Beer,
  Receipt,
  History,
  Users,
  Tag,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Ban,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { Table, type Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ReasonDialog } from "@/components/shared/ReasonDialog";
import {
  DESK_MEMBERS,
  SAMPLE_DESK_BOOKINGS,
  SAMPLE_DESK_PAYMENTS,
  performDeskCheckin,
} from "../sampleData";
import type { DeskMember, MemberNote } from "../types";

export default function StaffMemberProfile({ params }: { params?: Record<string, string> | undefined }) {
  const id = params?.["id"] ?? (typeof window !== "undefined" ? window.location.pathname.split("/").pop() : "CC-000123");
  const navigate = useGo();

  // Find member or fallback to first
  const [member, setMember] = useState<DeskMember>(() => {
    const found = DESK_MEMBERS.find((m: DeskMember) => m.id === id);
    return found ?? DESK_MEMBERS[0]!;
  });

  const [activeTab, setActiveTab] = useState<
    "overview" | "bookings" | "shop" | "bar" | "invoices" | "history" | "social" | "notes"
  >("overview");

  // Tag management
  const [newTagInput, setNewTagInput] = useState("");
  const [isAddTagOpen, setIsAddTagOpen] = useState(false);

  // Staff note management
  const [newNoteText, setNewNoteText] = useState("");
  const [isNotePrivate, setIsNotePrivate] = useState(true);

  // Sensitive actions dialog
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
  const [isConvertPlanOpen, setIsConvertPlanOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Booking tab filter
  const [bookingFilter, setBookingFilter] = useState<string>("ALL");

  // Member bookings
  const memberBookings = useMemo(() => {
    return SAMPLE_DESK_BOOKINGS.filter(
      (b) => b.memberId === member.id || b.memberName === member.name
    );
  }, [member]);

  const filteredBookings = useMemo(() => {
    if (bookingFilter === "ALL") return memberBookings;
    return memberBookings.filter((b) => b.status === bookingFilter);
  }, [memberBookings, bookingFilter]);

  // Member payments
  const memberPayments = useMemo(() => {
    return SAMPLE_DESK_PAYMENTS.filter(
      (p) => p.memberId === member.id || p.memberName === member.name
    );
  }, [member]);

  // Check-in action
  const handleCheckin = () => {
    const res = performDeskCheckin(member.id);
    if (res.success) {
      setToastMessage(res.message);
      if (member.nextBooking) {
        setMember((prev) => ({
          ...prev,
          nextBooking: prev.nextBooking
            ? { ...prev.nextBooking, status: "CHECKED_IN" }
            : undefined,
        }));
      }
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Suspend action
  const handleConfirmSuspend = (reason: string) => {
    setMember((prev) => ({ ...prev, status: "SUSPENDED" }));
    setToastMessage(`Member ${member.name} suspended. Reason: ${reason}`);
    setIsSuspendOpen(false);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add Tag
  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (!member.tags.includes(trimmed)) {
      setMember((prev) => ({ ...prev, tags: [...prev.tags, trimmed] }));
    }
    setNewTagInput("");
    setIsAddTagOpen(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setMember((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  // Add Staff Note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const note: MemberNote = {
      id: `NOTE-${Date.now()}`,
      staffName: "Anita (Front Desk)",
      timestamp: Date.now(),
      text: newNoteText.trim(),
      isPrivate: isNotePrivate,
    };

    setMember((prev) => ({ ...prev, notes: [note, ...prev.notes] }));
    setNewNoteText("");
    setToastMessage("Private staff note appended.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Columns for Bookings Table
  const bookingColumns: Column<(typeof memberBookings)[0]>[] = [
    {
      key: "id",
      header: "Booking ID",
      render: (b) => <span className="font-mono text-xs text-volt-400">{b.id}</span>,
    },
    {
      key: "court",
      header: "Court & Sport",
      render: (b) => (
        <div>
          <p className="font-semibold text-white">{b.courtName}</p>
          <p className="text-[11px] text-white/50 uppercase">{b.sport}</p>
        </div>
      ),
    },
    {
      key: "time",
      header: "Schedule",
      render: (b) => (
        <div>
          <p className="text-white">{b.date}</p>
          <p className="text-[11px] text-volt-400 font-mono">
            {b.startTime} – {b.endTime}
          </p>
        </div>
      ),
    },
    {
      key: "price",
      header: "Fee",
      render: (b) => (
        <span className="font-mono text-white">₹{b.price.toLocaleString("en-IN")}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (b) => (
        <StatusPill
          variant={
            b.status === "CONFIRMED"
              ? "info"
              : b.status === "CHECKED_IN"
              ? "success"
              : b.status === "NO_SHOW"
              ? "warning"
              : "danger"
          }
        >
          {b.status}
        </StatusPill>
      ),
    },
  ];

  // Columns for Payments Table
  const paymentColumns: Column<(typeof memberPayments)[0]>[] = [
    {
      key: "id",
      header: "Invoice #",
      render: (p) => (
        <div>
          <p className="font-mono text-xs text-volt-400">{p.invoiceNumber}</p>
          <p className="text-[10px] text-white/50">{p.id}</p>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (p) => <span className="text-xs text-white">{p.date}</span>,
    },
    {
      key: "category",
      header: "Category",
      render: (p) => (
        <span className="px-2 py-0.5 rounded-full bg-white/5 text-[11px] text-white/80 border border-white/10 uppercase">
          {p.category}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (p) => (
        <span className="font-mono font-semibold text-volt-400">
          ₹{p.amount.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "method",
      header: "Method",
      render: (p) => <span className="text-xs text-white/80">{p.method}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <StatusPill variant="success">{p.status}</StatusPill>,
    },
  ];

  const isJuniorMember = member.tier === "Junior" || Boolean(member.guardian);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 rounded-pill bg-navy-800 border-l-4 border-volt-400 px-5 py-3 shadow-2xl text-sm font-medium text-white flex items-center gap-3 animate-slide-in">
          <CheckCircle2 className="size-4 text-volt-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER STRIP */}
      <Card className="p-6 bg-court-600/90 border-white/15 shadow-xl flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Member Photo & Core Identifiers */}
          <div className="flex items-start sm:items-center gap-4">
            <img
              src={member.avatar}
              alt={member.name}
              className="size-20 rounded-2xl object-cover border-2 border-volt-400/40 shadow-glow-volt"
            />
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">{member.name}</h1>
                <span className="px-2.5 py-0.5 rounded-pill bg-volt-400 text-ink-900 font-bold text-xs uppercase">
                  {member.tier}
                </span>
                <StatusPill
                  variant={
                    member.status === "ACTIVE"
                      ? "success"
                      : member.status === "EXPIRING_SOON"
                      ? "warning"
                      : "danger"
                  }
                >
                  {member.status}
                </StatusPill>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-white/60 font-mono mt-0.5">
                <span>{member.id}</span>
                <span>•</span>
                <span>{member.phone}</span>
                <span>•</span>
                <span>Member since {member.memberSince}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics (Remaining, Dues, Next Booking) */}
          <div className="grid grid-cols-3 gap-3 bg-navy-950/60 p-3 rounded-2xl border border-white/10 text-center">
            <div className="px-3 py-1">
              <span className="text-[10px] uppercase tracking-wider text-white/50 block">
                Validity
              </span>
              <span className="text-sm font-bold text-white font-mono">
                ⏳ {member.daysRemaining}d left
              </span>
            </div>
            <div className="px-3 py-1 border-l border-white/10">
              <span className="text-[10px] uppercase tracking-wider text-white/50 block">
                Tab Dues
              </span>
              <span
                className={`text-sm font-bold font-mono ${
                  member.dues > 0 ? "text-warning" : "text-volt-400"
                }`}
              >
                ₹{member.dues.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="px-3 py-1 border-l border-white/10">
              <span className="text-[10px] uppercase tracking-wider text-white/50 block">
                Next Slot
              </span>
              <span className="text-xs font-semibold text-white">
                {member.nextBooking ? member.nextBooking.time : "None"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="primary"
              onClick={handleCheckin}
              className="flex items-center gap-1.5"
            >
              <CheckCircle2 className="size-4" /> Check in
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/desk/walk-in")}
              className="flex items-center gap-1.5"
            >
              <Zap className="size-4 text-volt-400" /> Book Court
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsRenewOpen(true)}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className="size-4 text-volt-400" /> Renew
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsChangePlanOpen(true)}
              className="text-xs text-white/70"
            >
              Change Plan
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="danger"
              onClick={() => setIsSuspendOpen(true)}
              className="text-xs flex items-center gap-1.5"
            >
              <Ban className="size-3.5" /> Suspend
            </Button>
          </div>
        </div>
      </Card>

      {/* JUNIOR TURN 18 NOTICE (IF JUNIOR MEMBER) */}
      {isJuniorMember && (
        <div className="p-4 rounded-2xl bg-volt-400/15 border border-volt-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-volt-400 text-ink-900 flex items-center justify-center font-bold">
              18
            </div>
            <div>
              <p className="font-semibold text-white text-sm">
                Junior Member Lifecycle Alert
              </p>
              <p className="text-xs text-white/80">
                Turns 18 on 12 Mar 2027: Prompt adult conversion to Silver / Gold tier (BR-15 window open).
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={() => setIsConvertPlanOpen(true)}
            className="text-xs shrink-0"
          >
            <Sparkles className="size-3.5 mr-1" /> Convert Plan
          </Button>
        </div>
      )}

      {/* 8 TABS NAVIGATION */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-white/10">
        {[
          { key: "overview", label: "Overview", icon: User },
          { key: "bookings", label: "Bookings", icon: Calendar },
          { key: "shop", label: "Shop Orders", icon: ShoppingBag },
          { key: "bar", label: "Bar & Tabs", icon: Beer },
          { key: "invoices", label: "Payments & Invoices", icon: Receipt },
          { key: "history", label: "Membership History", icon: History },
          { key: "social", label: "Social", icon: Users },
          { key: "notes", label: "Notes & Tags", icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-colors ${
                isActive
                  ? "bg-volt-400 text-ink-900 shadow-glow-volt font-bold"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="size-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Entitlements + Details */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="p-5 flex flex-col gap-4">
              <h3 className="text-base font-semibold text-white">Tier Entitlements &amp; Benefits</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5">
                  <span className="size-2 rounded-full bg-volt-400" />
                  <span>Unlimited court bookings across all 10 courts</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5">
                  <span className="size-2 rounded-full bg-volt-400" />
                  <span>7 days advance priority booking window</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5">
                  <span className="size-2 rounded-full bg-volt-400" />
                  <span>15% discount on Pro Shop &amp; Courtside Bar</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5">
                  <span className="size-2 rounded-full bg-volt-400" />
                  <span>2 free guest day passes / month</span>
                </div>
              </div>
            </Card>

            {/* Mini Timeline of Last 10 Activities */}
            <Card className="p-5 flex flex-col gap-4">
              <h3 className="text-base font-semibold text-white">Recent Member Activity Timeline</h3>
              <div className="space-y-3">
                {[
                  { title: "Checked in for Tennis 2", time: "Today 17:58", staff: "Desk Turnstile A" },
                  { title: "Bar Tab Opened: Courtside Lounge", time: "Today 18:30", staff: "Server Rohan" },
                  { title: "Booked Padel Court 1 for Oct 5", time: "Yesterday 11:20", staff: "Member Mobile App" },
                  { title: "Purchased Wilson Pro Overgrips (3pk)", time: "28 Sep 2026", staff: "Pro Shop POS" },
                  { title: "Completed Social Ladder Match vs Karthik I.", time: "25 Sep 2026", staff: "Club Ladder System" },
                ].map((act, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <span className="size-2 rounded-full bg-volt-400 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-white">{act.title}</p>
                      <p className="text-[11px] text-white/50">{act.time} · {act.staff}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right: Personal & Guardian Info + Tags */}
          <div className="flex flex-col gap-6">
            <Card className="p-5 flex flex-col gap-4">
              <h3 className="text-base font-semibold text-white">Contact &amp; Emergency</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="size-4 text-volt-400 shrink-0 mt-0.5" />
                  <span className="text-white/80">{member.address}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="size-4 text-volt-400 shrink-0" />
                  <span className="text-white/80">{member.email}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="size-4 text-volt-400 shrink-0" />
                  <span className="text-white/80">{member.phone}</span>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <span className="text-[11px] uppercase tracking-wider text-white/40 block">Emergency Contact</span>
                  <p className="text-white font-medium mt-0.5">{member.emergencyContact.name}</p>
                  <p className="text-volt-400 font-mono">{member.emergencyContact.phone}</p>
                </div>
              </div>
            </Card>

            {/* Tags Box */}
            <Card className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Tag className="size-4 text-volt-400" />
                  <span>Member Tags</span>
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  className="!h-7 !px-2 text-xs text-volt-400 hover:text-volt-300"
                  onClick={() => setIsAddTagOpen(true)}
                >
                  <Plus className="size-3 mr-1" /> Add Tag
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {member.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-white/5 border border-white/10 text-xs text-white/90"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-white/40 hover:text-danger ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: BOOKINGS */}
      {activeTab === "bookings" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(["ALL", "CONFIRMED", "CHECKED_IN", "CANCELLED", "NO_SHOW"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setBookingFilter(st)}
                  className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-colors ${
                    bookingFilter === st
                      ? "bg-volt-400 text-ink-900"
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <Button
              type="button"
              variant="primary"
              className="text-xs"
              onClick={() => navigate("/desk/walk-in")}
            >
              <Plus className="size-3.5 mr-1" /> New Booking
            </Button>
          </div>

          <Table
            columns={bookingColumns}
            data={filteredBookings}
            keyExtractor={(b) => b.id}
            emptyTitle="No bookings found"
            emptySubtitle="No court reservations match the selected filter."
          />
        </div>
      )}

      {/* TAB 3: SHOP ORDERS */}
      {activeTab === "shop" && (
        <Card className="p-6">
          <h3 className="text-base font-semibold text-white mb-4">Pro Shop Purchases</h3>
          <div className="space-y-3">
            {[
              { id: "ORD-9421", date: "28 Sep 2026", items: "Wilson Pro Overgrip 3-Pack, Babolat Dampener", amount: 650, method: "UPI" },
              { id: "ORD-8812", date: "14 Sep 2026", items: "Head Gravity Tour Tennis Racket Stringing (Gut 54lbs)", amount: 1400, method: "Member Tab" },
              { id: "ORD-7910", date: "02 Sep 2026", items: "Yonex Super Grap, CCMS Club Cap", amount: 950, method: "Card" },
            ].map((o) => (
              <div key={o.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-white">{o.items}</p>
                  <p className="text-white/50">{o.id} · {o.date} · via {o.method}</p>
                </div>
                <span className="text-sm font-mono font-bold text-volt-400">
                  ₹{o.amount.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 4: BAR & TABS */}
      {activeTab === "bar" && (
        <Card className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
            <div>
              <p className="text-xs uppercase text-white/60">Current Outstanding Bar Tab</p>
              <h2 className="text-3xl font-bold font-mono text-warning mt-1">
                ₹{member.dues.toLocaleString("en-IN")}
              </h2>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setMember((prev) => ({ ...prev, dues: 0 }));
                setToastMessage("Tab settled in full via front desk payment!");
                setTimeout(() => setToastMessage(null), 3000);
              }}
            >
              <Wallet className="size-4 mr-2" /> Settle Tab in Full
            </Button>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Recent Tab Charges</h4>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-navy-950/60 border border-white/10 flex justify-between">
                <div>
                  <p className="font-semibold text-white">2x Tender Coconut Water, 1x Protein Shake</p>
                  <p className="text-white/50">Courtside Lounge Bar · 03 Oct 16:45</p>
                </div>
                <span className="font-mono text-white">₹380</span>
              </div>
              <div className="p-3 rounded-lg bg-navy-950/60 border border-white/10 flex justify-between">
                <div>
                  <p className="font-semibold text-white">Club Sandwich &amp; Espresso</p>
                  <p className="text-white/50">Cafe Terraces · 01 Oct 19:15</p>
                </div>
                <span className="font-mono text-white">₹260</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 5: PAYMENTS & INVOICES */}
      {activeTab === "invoices" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Payment &amp; GST Invoices</h3>
            <Button
              type="button"
              variant="secondary"
              className="text-xs"
              onClick={() => navigate("/desk/payments")}
            >
              View Global Payments Register
            </Button>
          </div>

          <Table
            columns={paymentColumns}
            data={memberPayments}
            keyExtractor={(p) => p.id}
            emptyTitle="No invoices found"
            emptySubtitle="This member has not yet had payments recorded."
          />
        </div>
      )}

      {/* TAB 6: MEMBERSHIP HISTORY */}
      {activeTab === "history" && (
        <Card className="p-6">
          <h3 className="text-base font-semibold text-white mb-4">Membership Lifecycle Log</h3>
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Annual Membership Renewed (Gold Tier)</p>
                <p className="text-white/50">14 Nov 2025 · Handled by Front Desk</p>
              </div>
              <span className="font-mono text-volt-400">₹35,000</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Initial Onboarding Registration (Gold Tier)</p>
                <p className="text-white/50">14 Nov 2023 · Handled by System Admin</p>
              </div>
              <span className="font-mono text-volt-400">₹32,000</span>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 7: SOCIAL */}
      {activeTab === "social" && (
        <Card className="p-6">
          <h3 className="text-base font-semibold text-white mb-4">Social Play &amp; Club Ladder Rating</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs text-white/60 block">Club Ladder Ranking</span>
              <span className="text-2xl font-bold font-mono text-volt-400 mt-1 block">#14</span>
              <span className="text-[11px] text-white/50">Tennis Advanced Flight</span>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs text-white/60 block">Rating (UTR equivalent)</span>
              <span className="text-2xl font-bold font-mono text-volt-400 mt-1 block">7.8</span>
              <span className="text-[11px] text-white/50">Last updated 25 Sep</span>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs text-white/60 block">Social Sessions Attended</span>
              <span className="text-2xl font-bold font-mono text-volt-400 mt-1 block">28</span>
              <span className="text-[11px] text-white/50">92% attendance rate</span>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 8: STAFF PRIVATE NOTES */}
      {activeTab === "notes" && (
        <Card className="p-6 flex flex-col gap-6">
          <div className="flex items-center gap-2 text-warning text-xs bg-warning/10 p-3 rounded-xl border border-warning/30">
            <Lock className="size-4 shrink-0" />
            <span>
              Private Staff Notes: Visible only to front desk and managerial staff. Never shared with members or guests.
            </span>
          </div>

          <form onSubmit={handleAddNote} className="flex flex-col gap-3">
            <Input
              label="Append Private Staff Note"
              placeholder="e.g. Member prefers new balls, requests court 2 mornings..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNotePrivate}
                  onChange={(e) => setIsNotePrivate(e.target.checked)}
                  className="rounded accent-volt-400"
                />
                <span>Private to Staff Only (Locked)</span>
              </label>
              <Button type="submit" variant="primary" className="text-xs">
                Add Note
              </Button>
            </div>
          </form>

          <div className="space-y-3 pt-4 border-t border-white/10">
            {member.notes.map((n) => (
              <div key={n.id} className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-volt-400 flex items-center gap-1.5">
                    <Lock className="size-3 text-warning" />
                    <span>{n.staffName}</span>
                  </span>
                  <span className="text-[10px] text-white/40">
                    {new Date(n.timestamp).toLocaleDateString("en-IN")}
                  </span>
                </div>
                <p className="text-white/90">{n.text}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ADD TAG MODAL */}
      <Modal
        isOpen={isAddTagOpen}
        onClose={() => setIsAddTagOpen(false)}
        title="Add Staff Tag"
        subtitle="Tags assist staff in recognizing member habits and preferences"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Tag Name"
            placeholder="e.g. Morning Tennis Regular, VIP Courtside"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsAddTagOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleAddTag}>
              Save Tag
            </Button>
          </div>
        </div>
      </Modal>

      {/* REASON DIALOG FOR SUSPENSION */}
      <ReasonDialog
        isOpen={isSuspendOpen}
        onClose={() => setIsSuspendOpen(false)}
        onConfirm={handleConfirmSuspend}
        title="Suspend Member Account"
        description="Suspension revokes court booking rights and turnstile access immediately. Audited reason is mandatory under club bylaws."
        actionLabel="Confirm Suspension"
        variant="danger"
      />
    </div>
  );
}
