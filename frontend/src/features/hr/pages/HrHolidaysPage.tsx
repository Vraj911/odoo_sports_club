import { useState } from "react";
import { useGo } from "@/app/router/links";
import { useHrStore } from "../hrStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { Holiday } from "../types";
import {
  PartyPopper,
  Plus,
  Calendar,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

export default function HrHolidaysPage() {
  const go = useGo();
  const { holidays, addHoliday, removeHoliday } = useHrStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [closesBookings, setClosesBookings] = useState(false);
  const [description, setDescription] = useState("");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) {
      toast.error("Holiday name and date are required.");
      return;
    }

    addHoliday({
      name: name.trim(),
      date,
      closesBookings,
      description: description.trim() || undefined,
    });

    setIsAddModalOpen(false);
    setName("");
    setDate("");
    setDescription("");
    setClosesBookings(false);
  };

  const handleRemove = (id: string, hName: string) => {
    removeHoliday(id);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Club Holiday Calendar & Operations Closures"
        subtitle="Manage recognized national and festival holidays, maintenance shut-downs, and facility booking blocks (HR-09)."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1.5"
          >
            <Plus className="size-3.5" /> Declare Holiday
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {holidays.map((h) => (
          <Card
            key={h.id}
            className={cn(
              "p-5 space-y-4 border transition-all hover:border-chalk/28 hover:-translate-y-0.5",
              h.closesBookings
                ? "border-rose-500/30 bg-gradient-to-br from-court-500 to-rose-950/20"
                : "border-chalk/14 bg-court-500"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl border",
                    h.closesBookings
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : "bg-purple-500/20 text-purple-300 border-purple-500/40"
                  )}
                >
                  <PartyPopper className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-chalk text-sm">{h.name}</h4>
                  <p className="text-xs font-mono text-chalk/60 mt-0.5">{h.date}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemove(h.id, h.name)}
                className="text-chalk/40 hover:text-rose-400 transition-colors p-1"
                title="Remove Holiday"
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            {h.description && (
              <p className="text-xs text-chalk/70 leading-relaxed bg-court-700/50 p-2.5 rounded-lg border border-chalk/10">
                {h.description}
              </p>
            )}

            <div className="pt-2 border-t border-chalk/10 flex items-center justify-between text-xs">
              <span className="text-chalk/50">Club Operations:</span>
              {h.closesBookings ? (
                <span className="inline-flex items-center gap-1 font-bold text-rose-300 rounded bg-rose-500/10 px-2 py-0.5 border border-rose-500/30 text-[11px]">
                  <Lock className="size-3" /> Facility & Bookings Closed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 text-[11px]">
                  <CheckCircle2 className="size-3" /> Courts Open (Special Sessions)
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Declare Holiday Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        maxWidth="md"
        title={
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-volt-400/20 text-volt-400">
              <PartyPopper className="size-4" />
            </div>
            <span>Declare Club Holiday</span>
          </div>
        }
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-chalk/80">Holiday Title *</label>
            <Input
              placeholder="e.g. Diwali - Laxmi Pujan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-chalk/80">Date *</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-chalk/80">Description / Member Notice</label>
            <Input
              placeholder="e.g. Facility closed from 2 PM onwards for festival puja"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Closes Bookings Toggle */}
          <div className="rounded-xl border border-chalk/14 bg-court-700/60 p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="font-semibold text-chalk flex items-center gap-1.5">
                <Lock className="size-3.5 text-rose-400" /> Closes Court Bookings
              </p>
              <p className="text-[11px] text-chalk/60">
                If checked, court booking slots on this date will be blocked across member and public portals.
              </p>
            </div>
            <input
              type="checkbox"
              checked={closesBookings}
              onChange={(e) => setClosesBookings(e.target.checked)}
              className="size-4 accent-volt-400 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-chalk/10">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Holiday
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
