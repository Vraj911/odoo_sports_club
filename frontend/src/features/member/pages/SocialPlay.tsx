import { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  ChevronRight,
  UserCheck,
  UserPlus,
  LogOut,
  Flame,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { Money } from "@/components/shared/Money";
import { useSocialPlay } from "@/features/social/socialStore";
import type { SocialSession, SocialParticipant, MemberTier } from "@/features/booking/types";
import { SPORT_LABELS, SPORT_ICONS } from "@/features/booking/types";
import { cn } from "@/lib/cn";

export default function SocialPlay() {
  const { sessions, joinSession, leaveSession } = useSocialPlay();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [currentTier, setCurrentTier] = useState<MemberTier>("Silver");
  const [selectedSessionForList, setSelectedSessionForList] = useState<SocialSession | null>(null);
  const [confirmJoinSession, setConfirmJoinSession] = useState<SocialSession | null>(null);
  const [confirmLeaveSession, setConfirmLeaveSession] = useState<SocialSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Simulated initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleJoin = (session: SocialSession) => {
    setConfirmJoinSession(session);
  };

  const handleConfirmJoin = () => {
    if (!confirmJoinSession) return;
    setIsProcessing(true);

    setTimeout(() => {
      const res = joinSession(confirmJoinSession.id, "Arjun Mehta", currentTier);
      setIsProcessing(false);
      setConfirmJoinSession(null);

      if (!res.success) {
        toast.error("Registration Failed", res.message);
        return;
      }

      if (res.status === "WAITLISTED") {
        toast.warning(
          "Added to Waitlist",
          `Session is full (8/8). You are placed at Waitlist Position #${res.waitlistPosition}. You will be auto-promoted if anyone leaves!`
        );
      } else {
        toast.success(
          "Registration Confirmed",
          `You've joined ${confirmJoinSession.title}! (Fee: ₹${res.pricePaid})`
        );
      }
    }, 450);
  };

  const handleLeave = (session: SocialSession) => {
    setConfirmLeaveSession(session);
  };

  const handleConfirmLeave = () => {
    if (!confirmLeaveSession) return;
    setIsProcessing(true);

    setTimeout(() => {
      const res = leaveSession(confirmLeaveSession.id);
      setIsProcessing(false);
      setConfirmLeaveSession(null);

      if (res.success) {
        toast.info("Left Session", `You have vacated your spot for ${confirmLeaveSession.title}.`);

        // If someone was promoted from the waitlist:
        if (res.promotedParticipant) {
          setTimeout(() => {
            toast.success(
              "Waitlist Promoted!",
              `Spot filled: ${res.promotedParticipant?.name} was auto-promoted from the waitlist to active player!`
            );
          }, 600);
        }
      }
    }, 400);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-chalk/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-chalk">
              Friday Social Play
            </h1>
            <Badge live variant="volt" className="h-7 text-xs font-semibold">
              Live spots
            </Badge>
          </div>
          <p className="text-sm text-chalk/70 mt-1 max-w-2xl">
            Drop-in Friday mixers with rotating doubles, king-of-the-court rallies, courtside drinks, and community vibes.
          </p>
        </div>

        {/* Note chip: Rule BR-07 */}
        <div className="flex items-center gap-2 self-start md:self-center rounded-pill bg-white/8 border border-white/14 px-3.5 py-1.5 text-xs text-chalk/80">
          <Info className="size-3.5 text-volt-400 shrink-0" />
          <span>Counts toward your 2 bookings/day (Rule BR-07)</span>
        </div>
      </div>

      {/* Tier Switcher for demonstration */}
      <div className="flex items-center justify-between rounded-2xl bg-court-600/50 border border-chalk/10 p-3 px-4 text-xs">
        <span className="text-chalk/70">
          Your current membership tier: <span className="font-semibold text-volt-400">{currentTier}</span>
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-chalk/50 mr-1 hidden sm:inline">Simulate tier:</span>
          {(["Gold", "Silver", "Junior", "Guest"] as MemberTier[]).map((tier) => (
            <button
              key={tier}
              onClick={() => setCurrentTier(tier)}
              className={cn(
                "rounded-pill px-2.5 py-1 text-[11px] font-medium transition-all",
                currentTier === tier
                  ? "bg-volt-400 text-ink-900 font-semibold shadow-sm"
                  : "bg-chalk/8 text-chalk/70 hover:bg-chalk/14 hover:text-chalk"
              )}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="rounded-[24px] border border-chalk/14 bg-court-500/60 p-6 space-y-4 animate-pulse"
            >
              <Skeleton className="h-6 w-3/4 bg-chalk/10 rounded-lg" />
              <Skeleton className="h-4 w-1/2 bg-chalk/10 rounded-lg" />
              <Skeleton className="h-10 w-full bg-chalk/10 rounded-xl" />
              <Skeleton className="h-12 w-full bg-chalk/10 rounded-pill" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-3xl border border-chalk/14 bg-court-500/60 p-12 text-center">
          <EmptyState
            title="No Social Sessions Scheduled"
            description="All upcoming Friday social play sessions will be announced here."
          />
        </div>
      ) : (
        /* Sessions Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => {
            const isFull = session.participants.length >= session.capacity;
            const spotsLeft = Math.max(0, session.capacity - session.participants.length);
            const myParticipant = session.participants.find((p) => p.isSelf);
            const myWaitlist = session.waitlist.find((w) => w.isSelf);
            const isJoined = Boolean(myParticipant);
            const isWaitlisted = Boolean(myWaitlist);

            const userPrice = session.pricing[currentTier] ?? 150;

            // Formatted date
            const dateDisplay = (() => {
              try {
                const [y, m, d] = session.date.split("-").map(Number);
                if (!y || !m || !d) return session.date;
                return new Intl.DateTimeFormat("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                }).format(new Date(y, m - 1, d));
              } catch {
                return session.date;
              }
            })();

            return (
              <div
                key={session.id}
                className="group relative flex flex-col justify-between rounded-[24px] border border-chalk/14 bg-court-500 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-chalk/28 hover:shadow-2xl"
              >
                <div>
                  {/* Top: Sport icon + Title + Live badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-court-600 border border-chalk/14 text-xl">
                        {SPORT_ICONS[session.sport]}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-chalk leading-tight">
                          {session.title}
                        </h3>
                        <p className="text-xs text-chalk/60 mt-0.5">
                          {SPORT_LABELS[session.sport]} · {session.courtName}
                        </p>
                      </div>
                    </div>

                    {isWaitlisted ? (
                      <Badge variant="warning" className="h-6 text-[11px]">
                        Waitlist #{myWaitlist?.position}
                      </Badge>
                    ) : isJoined ? (
                      <Badge variant="success" className="h-6 text-[11px]">
                        Spot Confirmed
                      </Badge>
                    ) : null}
                  </div>

                  {/* Timing info */}
                  <div className="mt-4 flex items-center gap-3 text-xs text-chalk/80 font-mono">
                    <span className="flex items-center gap-1.5 text-chalk font-semibold">
                      <Calendar className="size-3.5 text-volt-400" />
                      {dateDisplay}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1.5 text-chalk/90">
                      <Clock className="size-3.5 text-volt-400" />
                      {session.startTime}–{session.endTime}
                    </span>
                  </div>

                  <p className="mt-2.5 text-xs text-chalk/70 line-clamp-2 leading-relaxed">
                    {session.description}
                  </p>

                  {/* Spots Progress Bar: Capacity 8 */}
                  <div className="mt-5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-chalk/80 flex items-center gap-1.5">
                        <Users className="size-3.5 text-volt-400" />
                        <span>Available Spots</span>
                      </span>
                      <span className="font-mono text-xs">
                        <span className="font-bold text-volt-400">
                          {session.participants.length}
                        </span>
                        <span className="text-chalk/40">/{session.capacity}</span>
                        {isFull ? (
                          <span className="ml-1.5 font-semibold text-danger text-[11px]">
                            (Full)
                          </span>
                        ) : (
                          <span className="ml-1.5 text-success text-[11px]">
                            ({spotsLeft} spots left)
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Visual Progress Bar (Capacity 8 blocks) */}
                    <div className="grid grid-cols-8 gap-1.5 h-3 w-full">
                      {Array.from({ length: session.capacity }).map((_, idx) => {
                        const isFilled = idx < session.participants.length;
                        return (
                          <div
                            key={idx}
                            className={cn(
                              "rounded-sm transition-all duration-300",
                              isFilled
                                ? isFull
                                  ? "bg-amber-400 shadow-sm"
                                  : "bg-volt-400 shadow-volt"
                                : "bg-white/10"
                            )}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Tier Pricing Chips */}
                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-chalk/60">
                      <span>Pricing by Tier</span>
                      <span className="text-volt-400 font-medium">
                        Your price: {userPrice === 0 ? "₹0 (Gold Perk)" : `₹${userPrice}`}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {(["Gold", "Silver", "Junior", "Guest"] as MemberTier[]).map((tier) => {
                        const price = session.pricing[tier] ?? 150;
                        const isUserTier = currentTier === tier;
                        return (
                          <div
                            key={tier}
                            className={cn(
                              "rounded-pill px-2.5 py-1 text-[11px] font-mono border transition-all",
                              isUserTier
                                ? "bg-volt-400/20 border-volt-400 text-volt-400 font-semibold ring-2 ring-volt-400/20"
                                : "bg-court-600/70 border-chalk/10 text-chalk/70"
                            )}
                          >
                            <span>{tier} </span>
                            <span className="font-bold">{price === 0 ? "₹0" : `₹${price}`}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Participants Avatar Stack + View List */}
                  <div className="mt-5 flex items-center justify-between border-t border-chalk/10 pt-4">
                    <div className="flex items-center -space-x-2 overflow-hidden">
                      {session.participants.slice(0, 4).map((p, idx) => (
                        <div
                          key={p.id}
                          title={`${p.name} (${p.tier})`}
                          className={cn(
                            "flex size-8 items-center justify-center rounded-full border-2 border-court-500 text-[10px] font-bold uppercase text-chalk shadow-sm",
                            p.isSelf
                              ? "bg-volt-400 text-ink-900 ring-2 ring-volt-400/50"
                              : idx % 3 === 0
                              ? "bg-indigo-600"
                              : idx % 3 === 1
                              ? "bg-emerald-600"
                              : "bg-amber-600"
                          )}
                        >
                          {p.name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                      ))}
                      {session.participants.length > 4 && (
                        <div className="flex size-8 items-center justify-center rounded-full border-2 border-court-500 bg-court-700 text-[10px] font-medium text-chalk/80">
                          +{session.participants.length - 4}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedSessionForList(session)}
                      className="text-xs text-chalk/70 hover:text-volt-400 transition-colors flex items-center gap-1 font-medium"
                    >
                      <span>View list ({session.participants.length})</span>
                      <ChevronRight className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bottom Action: Join / Leave / Waitlist */}
                <div className="mt-5 pt-4 border-t border-chalk/10">
                  {isJoined ? (
                    <Button
                      variant="danger"
                      onClick={() => handleLeave(session)}
                      leftIcon={<LogOut className="size-4" />}
                      className="w-full"
                    >
                      Leave Session
                    </Button>
                  ) : isWaitlisted ? (
                    <Button
                      variant="ghost"
                      onClick={() => handleLeave(session)}
                      className="w-full text-danger hover:bg-danger/10"
                    >
                      Leave Waitlist (#{myWaitlist?.position})
                    </Button>
                  ) : isFull ? (
                    <Button
                      variant="secondary"
                      onClick={() => handleJoin(session)}
                      leftIcon={<UserPlus className="size-4" />}
                      className="w-full text-amber-300 border-amber-400/30 hover:bg-amber-400/10"
                    >
                      Join Waitlist (Queue: {session.waitlist.length})
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => handleJoin(session)}
                      leftIcon={<CheckCircle2 className="size-4" />}
                      className="w-full"
                    >
                      Join Session · {userPrice === 0 ? "Free (Gold)" : `₹${userPrice}`}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Participant List Modal */}
      {selectedSessionForList && (
        <Modal
          isOpen={Boolean(selectedSessionForList)}
          onClose={() => setSelectedSessionForList(null)}
          maxWidth="md"
          title={
            <div className="flex items-center gap-2">
              <Users className="size-5 text-volt-400" />
              <span>Registered Participants ({selectedSessionForList.participants.length}/8)</span>
            </div>
          }
          subtitle={`${selectedSessionForList.title} · ${selectedSessionForList.date}`}
        >
          <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
            {/* Active confirmed participants */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-chalk/60">
                Active Players (Capacity 8)
              </h4>
              <div className="space-y-1.5">
                {selectedSessionForList.participants.map((p, idx) => (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-center justify-between rounded-xl p-2.5 px-3 border transition-colors",
                      p.isSelf
                        ? "bg-volt-400/15 border-volt-400/30"
                        : "bg-court-700/60 border-chalk/8"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs text-chalk/40 w-4">#{idx + 1}</span>
                      <div className="flex size-7 items-center justify-center rounded-full bg-court-600 text-[11px] font-bold text-chalk">
                        {p.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <span className="text-xs font-medium text-chalk">
                          {p.name} {p.isSelf && <span className="text-volt-400 font-bold">(You)</span>}
                        </span>
                      </div>
                    </div>

                    <span className="rounded-pill bg-chalk/10 px-2 py-0.5 font-mono text-[10px] text-chalk/80">
                      {p.tier}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Waitlist Queue */}
            {selectedSessionForList.waitlist.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-chalk/10">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300 flex items-center justify-between">
                  <span>Waitlist Queue</span>
                  <span>{selectedSessionForList.waitlist.length} waiting</span>
                </h4>
                <div className="space-y-1.5">
                  {selectedSessionForList.waitlist.map((w) => (
                    <div
                      key={w.id}
                      className={cn(
                        "flex items-center justify-between rounded-xl p-2.5 px-3 border",
                        w.isSelf
                          ? "bg-amber-400/15 border-amber-400/30"
                          : "bg-court-800/60 border-chalk/8"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-mono text-amber-300 font-bold">
                          #{w.position}
                        </span>
                        <span className="text-xs text-chalk/90 font-medium">
                          {w.name} {w.isSelf && <span className="text-amber-300 font-bold">(You)</span>}
                        </span>
                      </div>
                      <span className="text-[10px] text-chalk/50 font-mono">
                        Auto-promotes on leave
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Confirm Join Modal (Price confirmation & 2-day quota check) */}
      {confirmJoinSession && (
        <Modal
          isOpen={Boolean(confirmJoinSession)}
          onClose={() => setConfirmJoinSession(null)}
          maxWidth="md"
          title={
            <div className="flex items-center gap-2 text-volt-400">
              <CheckCircle2 className="size-5" />
              <span>Confirm Social Registration</span>
            </div>
          }
          subtitle={confirmJoinSession.title}
        >
          <div className="flex flex-col gap-4 text-xs">
            <div className="rounded-xl border border-chalk/14 bg-court-700/60 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-chalk/70">Session:</span>
                <span className="font-semibold text-chalk">{confirmJoinSession.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-chalk/70">Schedule:</span>
                <span className="font-mono text-chalk">
                  {confirmJoinSession.date} ({confirmJoinSession.startTime}–{confirmJoinSession.endTime})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-chalk/70">Membership Tier:</span>
                <span className="font-semibold text-volt-400">{currentTier}</span>
              </div>
              <div className="border-t border-chalk/10 pt-2 flex justify-between font-bold text-sm">
                <span className="text-chalk">Amount to Pay:</span>
                <span className="text-volt-400">
                  <Money amount={confirmJoinSession.pricing[currentTier] ?? 150} />
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-court-600/50 p-3 text-chalk/70 text-[11px] leading-relaxed border border-chalk/10">
              * Note: Enrolled sessions count towards your maximum 2 bookings per day (Rule BR-07).
              Cancellation policy: Free cancellation until 4 hours before.
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-chalk/10">
              <Button
                variant="ghost"
                onClick={() => setConfirmJoinSession(null)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmJoin}
                loading={isProcessing}
              >
                Confirm & Join
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Leave Modal (Highlights auto-promotion to waitlist) */}
      {confirmLeaveSession && (
        <Modal
          isOpen={Boolean(confirmLeaveSession)}
          onClose={() => setConfirmLeaveSession(null)}
          maxWidth="md"
          title={
            <div className="flex items-center gap-2 text-danger">
              <LogOut className="size-5" />
              <span>Vacate Your Spot?</span>
            </div>
          }
          subtitle={confirmLeaveSession.title}
        >
          <div className="flex flex-col gap-4 text-xs">
            <p className="text-chalk/80 leading-relaxed">
              Are you sure you want to leave this Friday social session?
            </p>

            {confirmLeaveSession.waitlist.length > 0 && (
              <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-amber-200">
                <span className="font-bold block text-amber-300">Waitlist Promotion Trigger:</span>
                Your spot will immediately be transferred to the first member in the waitlist (
                {confirmLeaveSession.waitlist[0]?.name}).
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-chalk/10">
              <Button
                variant="ghost"
                onClick={() => setConfirmLeaveSession(null)}
                disabled={isProcessing}
              >
                Stay Enrolled
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmLeave}
                loading={isProcessing}
              >
                Yes, Vacate Spot
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
