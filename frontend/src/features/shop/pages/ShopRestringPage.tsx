import { useState } from "react";
import { POSTopBar } from "../components/POSTopBar";
import { useShopConsole } from "../shopStore";
import type { RestringJob, RestringStatus } from "../types";
import { Money } from "@/components/shared/Money";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AppLink, useGo } from "@/app/router/links";
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  Check,
  ChevronRight,
  User,
  Phone,
  Sparkles,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

const STRING_TYPES = [
  "Babolat RPM Blast 1.25mm",
  "Yonex BG65 Ti Titanium",
  "Yonex BG80 Power",
  "Luxilon ALU Power 1.25mm",
  "Head Lynx Touch",
  "Solinco Hyper-G 1.20mm",
  "Tecnifibre Biphase One",
];

export default function ShopRestringPage() {
  const go = useGo();
  const {
    restringJobs,
    createRestringJob,
    updateRestringStatus,
    addRestringToPOS,
  } = useShopConsole();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("+91 ");
  const [memberId, setMemberId] = useState("");
  const [racketBrand, setRacketBrand] = useState("Babolat");
  const [racketModel, setRacketModel] = useState("Pure Drive 2023");
  const [stringType, setStringType] = useState(STRING_TYPES[0]);
  const [tensionMain, setTensionMain] = useState(54);
  const [tensionCross, setTensionCross] = useState(52);
  const [dueTime, setDueTime] = useState("Today, 20:00 IST");
  const [price, setPrice] = useState(1200);
  const [notes, setNotes] = useState("");

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error("Customer name is required.");
      return;
    }

    const job = createRestringJob({
      customerName,
      customerPhone,
      memberId: memberId || undefined,
      racketBrand,
      racketModel,
      stringType,
      tensionMain,
      tensionCross,
      dueTime,
      price,
      status: "RECEIVED",
      notes,
    });

    toast.success(`Job Ticket #${job.ticketNumber} created for ${customerName}!`);
    setIsModalOpen(false);

    // Reset
    setCustomerName("");
    setCustomerPhone("+91 ");
    setNotes("");
  };

  const handleAdvanceStatus = (job: RestringJob) => {
    const nextMap: Record<RestringStatus, RestringStatus | null> = {
      RECEIVED: "IN_PROGRESS",
      IN_PROGRESS: "READY",
      READY: "COLLECTED",
      COLLECTED: null,
    };

    const next = nextMap[job.status];
    if (next) {
      updateRestringStatus(job.id, next);
      toast.success(`Ticket #${job.ticketNumber} marked as ${next}`);
    }
  };

  const handleChargeAtPOS = (job: RestringJob) => {
    addRestringToPOS(job.id);
    toast.success(`Restring job #${job.ticketNumber} added to POS cart!`);
    go("/shop-console");
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-backdrop text-chalk font-sans">
      <POSTopBar activeModule="restring" />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto w-full flex flex-col min-h-0">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-chalk/12 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Wrench className="size-6 text-volt-400" />
              <h2 className="text-xl sm:text-2xl font-black text-chalk tracking-tight">
                Racquet Restringing Workshop
              </h2>
            </div>
            <p className="mt-1 text-xs text-chalk/60">
              Electronic tensioner job tickets: Received → In Progress → Ready → Collected. Ring up directly at POS.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="font-bold bg-volt-400 text-ink-900"
          >
            <Plus className="size-4 mr-1.5" />
            <span>New Restring Ticket</span>
          </Button>
        </div>

        {/* Tickets Grid */}
        <div className="grid flex-1 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4">
          {restringJobs.map((job) => {
            const isReady = job.status === "READY";
            const isCompleted = job.status === "COLLECTED";

            return (
              <div
                key={job.id}
                className={cn(
                  "rounded-[22px] border p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-md backdrop-blur-md",
                  isReady
                    ? "border-volt-400/50 bg-court-600/90 shadow-volt-400/10"
                    : "border-chalk/14 bg-court-600/60"
                )}
              >
                <div>
                  {/* Top Bar: Ticket # & Status Chip */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-chalk/8">
                    <span className="font-mono text-xs font-black text-volt-300">
                      #{job.ticketNumber}
                    </span>
                    <span
                      className={cn(
                        "rounded-pill px-2.5 py-0.5 text-[10px] font-bold uppercase",
                        job.status === "READY"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse"
                          : job.status === "IN_PROGRESS"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : job.status === "COLLECTED"
                          ? "bg-chalk/10 text-chalk/50"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                      )}
                    >
                      {job.status.replace("_", " ")}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-3">
                    <p className="font-bold text-sm text-chalk">{job.customerName}</p>
                    <p className="text-[11px] text-chalk/60">{job.customerPhone}</p>
                  </div>

                  {/* Racket & Tension Specs */}
                  <div className="rounded-xl border border-chalk/10 bg-court-700/60 p-3 text-xs space-y-1.5 mb-3">
                    <div className="flex justify-between">
                      <span className="text-chalk/60">Racquet:</span>
                      <span className="font-semibold text-chalk">
                        {job.racketBrand} {job.racketModel}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-chalk/60">String:</span>
                      <span className="font-semibold text-chalk/90 truncate max-w-[170px]">
                        {job.stringType}
                      </span>
                    </div>
                    <div className="flex justify-between text-volt-300 font-bold">
                      <span className="text-chalk/60 font-normal">Tension:</span>
                      <span>
                        Main {job.tensionMain} lbs / Cross {job.tensionCross} lbs
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-chalk/8 text-[11px]">
                      <span className="text-chalk/50">Due Time:</span>
                      <span className="font-medium text-chalk">{job.dueTime}</span>
                    </div>
                  </div>

                  {job.notes && (
                    <p className="text-[11px] text-chalk/70 italic mb-3">"{job.notes}"</p>
                  )}
                </div>

                {/* Bottom Bar: Price + Actions */}
                <div className="pt-3 border-t border-chalk/10 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-chalk/50 uppercase block font-semibold">
                      Service Fee
                    </span>
                    <span className="text-base font-black text-volt-400">
                      <Money amount={job.price} />
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!job.billedAtPOS && !isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleChargeAtPOS(job)}
                        className="flex h-8 items-center gap-1 rounded-pill bg-volt-400 px-3 text-xs font-bold text-ink-900 hover:bg-volt-500 shadow-sm"
                        title="Add to current counter POS cart to charge customer"
                      >
                        <ShoppingCart className="size-3.5" />
                        <span>Charge POS</span>
                      </button>
                    )}

                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus(job)}
                        className="flex h-8 items-center gap-1 rounded-pill border border-chalk/18 bg-chalk/8 px-2.5 text-xs font-semibold text-chalk hover:bg-chalk/16"
                      >
                        <span>Advance</span>
                        <ChevronRight className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ─── New Restring Ticket Modal ─── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Wrench className="size-5 text-volt-400" />
            <span>Create Racquet Restring Ticket</span>
          </div>
        }
        subtitle="Log stringing job, string tension specifications, and due time."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateTicket} className="flex flex-col gap-4 text-chalk">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Customer Name *"
              placeholder="e.g. Rahul Dravid"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
            <Input
              label="Phone Number"
              placeholder="+91 98201 12345"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Racket Brand *"
              placeholder="e.g. Babolat, Yonex"
              value={racketBrand}
              onChange={(e) => setRacketBrand(e.target.value)}
              required
            />
            <Input
              label="Racket Model *"
              placeholder="e.g. Pure Aero 2024"
              value={racketModel}
              onChange={(e) => setRacketModel(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-chalk/80 uppercase tracking-wider block mb-1.5">
              String Type *
            </label>
            <select
              value={stringType}
              onChange={(e) => setStringType(e.target.value)}
              className="h-10 w-full rounded-input border border-chalk/18 bg-court-700 px-3 text-xs text-white"
            >
              {STRING_TYPES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Tension Steppers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-chalk/14 bg-court-700/60 p-3">
              <label className="text-[11px] text-chalk/60 block mb-1">Main Tension (lbs)</label>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setTensionMain((t) => Math.max(20, t - 1))}
                  className="size-7 rounded-pill bg-chalk/10 text-chalk flex items-center justify-center font-bold"
                >
                  −
                </button>
                <span className="text-base font-bold text-volt-300">{tensionMain} lbs</span>
                <button
                  type="button"
                  onClick={() => setTensionMain((t) => Math.min(65, t + 1))}
                  className="size-7 rounded-pill bg-chalk/10 text-chalk flex items-center justify-center font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-chalk/14 bg-court-700/60 p-3">
              <label className="text-[11px] text-chalk/60 block mb-1">Cross Tension (lbs)</label>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setTensionCross((t) => Math.max(20, t - 1))}
                  className="size-7 rounded-pill bg-chalk/10 text-chalk flex items-center justify-center font-bold"
                >
                  −
                </button>
                <span className="text-base font-bold text-volt-300">{tensionCross} lbs</span>
                <button
                  type="button"
                  onClick={() => setTensionCross((t) => Math.min(65, t + 1))}
                  className="size-7 rounded-pill bg-chalk/10 text-chalk flex items-center justify-center font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Due Date/Time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
            />
            <Input
              label="Price (₹)"
              type="number"
              value={price.toString()}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 850)}
            />
          </div>

          <Input
            label="Special Instructions / Stencil"
            placeholder="e.g. Stencil Babolat logo on black strings..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="pt-2 border-t border-chalk/12 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="font-bold px-6">
              Create Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
