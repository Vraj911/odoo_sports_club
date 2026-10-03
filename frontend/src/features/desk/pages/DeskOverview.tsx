import { useState, useMemo } from "react";
import { useGo } from "@/app/router/links";
import {
  UserPlus,
  Zap,
  CheckCircle2,
  Wallet,
  PhoneCall,
  QrCode,
  Radio,
  Clock,
  ArrowRight,
  Send,
  RefreshCw,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { KPICard } from "@/components/ui/KPICard";
import { StatusPill } from "@/components/ui/StatusPill";
import { Drawer } from "@/components/ui/Drawer";
import { MemberSearch } from "../components/MemberSearch";
import { ScanDialog } from "../components/ScanDialog";
import {
  getTodayDeskStats,
  getArrivingNext60Min,
  getExpiringSoonMembers,
  performDeskCheckin,
  DESK_MEMBERS,
} from "../sampleData";
import { COURTS, TIME_SLOTS } from "@/features/booking/sampleData";

export default function DeskOverview() {
  const navigate = useGo();
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isPhoneEnquiryOpen, setIsPhoneEnquiryOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const stats = useMemo(() => getTodayDeskStats(), []);
  const [arrivingList, setArrivingList] = useState(() => getArrivingNext60Min());
  const expiringList = useMemo(() => getExpiringSoonMembers(), []);

  // Quick check-in inline
  const handleInlineCheckin = (memberId: string, bookingId: string) => {
    const res = performDeskCheckin(memberId);
    if (res.success) {
      setToastMessage(res.message);
      setArrivingList((prev) =>
        prev.map((item) =>
          item.bookingId === bookingId ? { ...item, status: "CHECKED_IN" } : item
        )
      );
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleRemindMember = (name: string) => {
    setToastMessage(`SMS & Email renewal reminder sent to ${name}.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sparkline data
  const sparkData1 = [{ v: 20 }, { v: 28 }, { v: 34 }, { v: 42 }];
  const sparkData2 = [{ v: 25 }, { v: 30 }, { v: 33 }, { v: 38 }];
  const sparkData3 = [{ v: 8 }, { v: 6 }, { v: 5 }, { v: 3 }];
  const sparkData4 = [{ v: 12 }, { v: 9 }, { v: 6 }, { v: 4 }];

  // Mini live grid courts (all 10 courts) across active slots: 16:30, 17:00, 17:30, 18:00, 18:30, 19:00, 19:30, 20:00
  const miniSlots = ["16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 rounded-pill bg-navy-800 border-l-4 border-volt-400 px-5 py-3 shadow-2xl text-sm font-medium text-white flex items-center gap-3 animate-slide-in">
          <CheckCircle2 className="size-4 text-volt-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Topbar: Typeahead Search + QR Scan Button + Live Indicator */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-court-600/70 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
        <div className="flex-1 max-w-2xl">
          <MemberSearch
            placeholder="Search by Member Name, Phone, or ID (e.g. CC-000123)..."
            onSelectMember={(member) => navigate(`/desk/members/${member.id}`)}
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsScanOpen(true)}
            className="flex items-center gap-2"
          >
            <QrCode className="size-4 text-volt-400" />
            <span>Scan QR / Wedge</span>
          </Button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-pill bg-white/5 border border-white/10 text-xs font-medium text-white">
            <Radio className="size-3 text-volt-400 animate-pulse" />
            <span>Live Sync</span>
          </div>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => navigate("/desk/register")}
          className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl bg-court-500 hover:bg-court-400/80 border border-white/10 hover:border-volt-400/40 transition-all text-center group"
        >
          <div className="size-11 rounded-pill bg-volt-400/15 border border-volt-400/30 flex items-center justify-center text-volt-400 group-hover:scale-110 transition-transform">
            <UserPlus className="size-5" />
          </div>
          <span className="text-xs font-semibold text-white">Register Member</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/desk/walk-in")}
          className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl bg-court-500 hover:bg-court-400/80 border border-white/10 hover:border-volt-400/40 transition-all text-center group"
        >
          <div className="size-11 rounded-pill bg-volt-400/15 border border-volt-400/30 flex items-center justify-center text-volt-400 group-hover:scale-110 transition-transform">
            <Zap className="size-5" />
          </div>
          <span className="text-xs font-semibold text-white">Walk-in Booking</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/desk/checkin")}
          className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl bg-court-500 hover:bg-court-400/80 border border-white/10 hover:border-volt-400/40 transition-all text-center group"
        >
          <div className="size-11 rounded-pill bg-volt-400/15 border border-volt-400/30 flex items-center justify-center text-volt-400 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="size-5" />
          </div>
          <span className="text-xs font-semibold text-white">Check-in</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/desk/payments")}
          className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl bg-court-500 hover:bg-court-400/80 border border-white/10 hover:border-volt-400/40 transition-all text-center group"
        >
          <div className="size-11 rounded-pill bg-volt-400/15 border border-volt-400/30 flex items-center justify-center text-volt-400 group-hover:scale-110 transition-transform">
            <Wallet className="size-5" />
          </div>
          <span className="text-xs font-semibold text-white">Take Payment</span>
        </button>

        <button
          type="button"
          onClick={() => setIsPhoneEnquiryOpen(true)}
          className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl bg-court-500 hover:bg-court-400/80 border border-white/10 hover:border-volt-400/40 transition-all text-center group"
        >
          <div className="size-11 rounded-pill bg-volt-400/15 border border-volt-400/30 flex items-center justify-center text-volt-400 group-hover:scale-110 transition-transform">
            <PhoneCall className="size-5" />
          </div>
          <span className="text-xs font-semibold text-white">Phone Enquiry</span>
        </button>
      </div>

      {/* Today KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Check-ins Today"
          value={stats.checkinsToday}
          delta={{ value: "+14%", isPositive: true }}
          sparklineData={sparkData1}
        />
        <KPICard
          label="Bookings Today"
          value={stats.bookingsToday}
          delta={{ value: "+8%", isPositive: true }}
          sparklineData={sparkData2}
        />
        <KPICard
          label="Courts Free Now"
          value={stats.courtsFreeNow}
          delta={{ value: "3 available", isPositive: true }}
          sparklineData={sparkData3}
        />
        <KPICard
          label="Expiring ≤ 15 Days"
          value={stats.expiringSoon}
          delta={{ value: "Action required", isPositive: false }}
          sparklineData={sparkData4}
        />
      </div>

      {/* Main Grid: Mini Live Availability + Arriving Next 60 Min */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Mini Live Availability Grid (Now -1h to +3h) */}
        <Card className="lg:col-span-2 flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-volt-400" />
              <h3 className="text-base font-semibold text-white">
                Live Court Occupancy (Now &amp; Next 3 Hours)
              </h3>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/desk/availability")}
              className="text-xs text-volt-400 hover:text-volt-300"
            >
              Full Staff Grid <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10 bg-navy-950/40">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-court-700 text-white/70">
                  <th className="py-2.5 px-3 text-left font-medium border-b border-white/10 min-w-[120px]">
                    Court
                  </th>
                  {miniSlots.map((time) => (
                    <th
                      key={time}
                      className="py-2.5 px-2 text-center font-medium border-b border-white/10 min-w-[64px]"
                    >
                      {time}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {COURTS.map((court, idx) => (
                  <tr
                    key={court.id}
                    className={idx % 2 === 1 ? "bg-white/[0.02]" : "bg-transparent"}
                  >
                    <td className="py-2 px-3 font-medium text-white/90 whitespace-nowrap">
                      {court.name}
                    </td>
                    {miniSlots.map((time) => {
                      // Deterministic mock pattern for realistic occupancy
                      const isFree =
                        (court.id === "t1" && time === "18:00") ||
                        (court.id === "b2" && time === "19:00") ||
                        (court.id === "p1" && time === "19:30") ||
                        time === "20:00";
                      const isCheckedIn = court.id === "t2" && (time === "17:00" || time === "17:30");

                      return (
                        <td key={time} className="p-1 text-center">
                          {isFree ? (
                            <span className="inline-block w-full py-1 rounded bg-volt-400/10 text-volt-400 font-mono text-[10px] border border-volt-400/20">
                              Free
                            </span>
                          ) : isCheckedIn ? (
                            <span className="inline-block w-full py-1 rounded bg-success/20 text-success font-mono text-[10px] border border-success/30">
                              Playing
                            </span>
                          ) : (
                            <span className="inline-block w-full py-1 rounded bg-court-700/60 text-white/40 font-mono text-[10px]">
                              Booked
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right: Arriving Next 60 Min */}
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-volt-400" />
              <h3 className="text-base font-semibold text-white">Arriving Next 60 Min</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-volt-400/10 text-volt-400 border border-volt-400/20 font-medium">
              {arrivingList.length} expected
            </span>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[380px]">
            {arrivingList.map((item) => {
              const isCheckedIn = item.status === "CHECKED_IN";
              return (
                <div
                  key={item.bookingId}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.member.avatar}
                      alt={item.member.name}
                      className="size-9 rounded-full object-cover border border-white/20"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          {item.member.name}
                        </span>
                        <span className="text-[10px] font-mono text-volt-400">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-xs text-white/60">
                        {item.court} · {item.member.tier}
                      </p>
                    </div>
                  </div>

                  {isCheckedIn ? (
                    <span className="text-xs font-medium text-success flex items-center gap-1 bg-success/15 px-2.5 py-1 rounded-pill border border-success/30">
                      <CheckCircle2 className="size-3" /> Checked In
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      className="!h-8 !px-3 text-xs"
                      onClick={() => handleInlineCheckin(item.member.id, item.bookingId)}
                    >
                      Check in
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Expiring Soon Members (<= 15 Days) */}
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-warning" />
            <h3 className="text-base font-semibold text-white">
              Memberships Expiring Soon (≤ 15 Days Left)
            </h3>
          </div>
          <span className="text-xs text-white/60">Proactive desk retention outreach</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {expiringList.map((member) => (
            <div
              key={member.id}
              className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between hover:border-warning/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="size-10 rounded-full object-cover border border-white/20"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{member.name}</span>
                    <StatusPill variant="warning">{member.daysRemaining}d left</StatusPill>
                  </div>
                  <p className="text-xs text-white/60">
                    {member.tier} · {member.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  className="!h-8 !w-8 !p-0 text-white/70 hover:text-white"
                  title="Send SMS/Email Reminder"
                  onClick={() => handleRemindMember(member.name)}
                >
                  <Send className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="!h-8 !px-2.5 text-xs text-volt-400 border-volt-400/40 hover:bg-volt-400/10"
                  onClick={() => navigate(`/desk/members/${member.id}`)}
                >
                  <RefreshCw className="size-3 mr-1" /> Renew
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Phone Enquiry Availability Drawer */}
      <Drawer
        isOpen={isPhoneEnquiryOpen}
        onClose={() => setIsPhoneEnquiryOpen(false)}
        title="Phone Enquiry — Rapid Availability Look-up"
        subtitle="Live court view so staff never put callers on hold or phone around"
      >
        <div className="flex flex-col gap-5">
          <div className="p-3 rounded-xl bg-volt-400/10 border border-volt-400/30 text-xs text-volt-400 flex items-center gap-2">
            <PhoneCall className="size-4 shrink-0" />
            <span>Caller on line: Check slots and directly click to book walk-in/phone slot.</span>
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wider font-semibold text-white/70">
              Immediate Openings (Next 2 Hours)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="font-semibold text-white">Tennis Court 1</p>
                <p className="text-volt-400 font-mono mt-1">18:00 – 19:00 (Free)</p>
                <p className="text-[11px] text-white/50">₹1,200/hr (Clay, Floodlit)</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="font-semibold text-white">Badminton Court 2</p>
                <p className="text-volt-400 font-mono mt-1">19:00 – 20:00 (Free)</p>
                <p className="text-[11px] text-white/50">₹700/hr (Wooden court)</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="font-semibold text-white">Padel Court 1</p>
                <p className="text-volt-400 font-mono mt-1">19:30 – 20:30 (Free)</p>
                <p className="text-[11px] text-white/50">₹1,400/hr (Panoramic)</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="font-semibold text-white">Squash Court 1</p>
                <p className="text-volt-400 font-mono mt-1">20:00 – 21:00 (Free)</p>
                <p className="text-[11px] text-white/50">₹600/hr (Glass-back)</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
            <Button
              type="button"
              variant="primary"
              className="w-full"
              onClick={() => {
                setIsPhoneEnquiryOpen(false);
                navigate("/desk/walk-in");
              }}
            >
              Book for Caller (Phone Mode)
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setIsPhoneEnquiryOpen(false);
                navigate("/desk/availability");
              }}
            >
              View Full Interactive Matrix
            </Button>
          </div>
        </div>
      </Drawer>

      {/* QR / Wedge Scan Dialog */}
      <ScanDialog
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onScanSuccess={(member) => {
          navigate(`/desk/members/${member.id}`);
        }}
      />
    </div>
  );
}
