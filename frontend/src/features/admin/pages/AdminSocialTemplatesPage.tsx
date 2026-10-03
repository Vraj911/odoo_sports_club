import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { Table, type Column } from "@/components/ui/Table";
import { useAdminConfigStore } from "../adminConfigStore";
import type { SocialTemplate } from "../types";
import {
  MessageSquare,
  Users,
  PlusCircle,
  Calendar,
  Clock,
  Edit2,
  CheckCircle2,
  Coffee,
  Sparkles,
} from "lucide-react";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminSocialTemplatesPage() {
  const { socialTemplates, courts, sports, updateSocialTemplate } = useAdminConfigStore();

  const [activeTemplate, setActiveTemplate] = useState<SocialTemplate | null>(null);
  const [formData, setFormData] = useState<SocialTemplate | null>(null);

  const handleOpenEdit = (template: SocialTemplate) => {
    setActiveTemplate(template);
    setFormData({ ...template });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    updateSocialTemplate(formData.id, formData);
    setActiveTemplate(null);
    setFormData(null);
  };

  const toggleCourtSelection = (courtId: string) => {
    if (!formData) return;
    const exists = formData.courtIds.includes(courtId);
    const updated = exists
      ? formData.courtIds.filter((id) => id !== courtId)
      : [...formData.courtIds, courtId];
    setFormData({ ...formData, courtIds: updated });
  };

  const columns: Column<SocialTemplate>[] = [
    {
      key: "title",
      header: "Session Title & Discipline",
      render: (t) => (
        <div className="flex flex-col">
          <span className="font-semibold text-white">{t.title}</span>
          <span className="text-[11px] text-volt-400 capitalize">{t.sport} Mixer</span>
        </div>
      ),
    },
    {
      key: "schedule",
      header: "Recurring Schedule",
      render: (t) => (
        <div className="flex items-center gap-1.5 text-xs text-white/90">
          <Calendar className="size-3.5 text-white/50" />
          <span>
            Every {t.recurrenceDay} ({t.startTime} – {t.endTime})
          </span>
        </div>
      ),
    },
    {
      key: "courts",
      header: "Reserved Courts",
      render: (t) => (
        <div className="flex flex-wrap gap-1">
          {t.courtIds.map((cid) => (
            <span
              key={cid}
              className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/90 border border-white/14"
            >
              {cid}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "capacity",
      header: "Player Capacity",
      render: (t) => (
        <span className="font-bold text-sm text-white">
          {t.capacity} Players Max
        </span>
      ),
    },
    {
      key: "pricing",
      header: "Tier Pricing (Gold / Silver / Guest)",
      render: (t) => (
        <div className="text-xs text-white/80 space-x-1">
          <span className="text-volt-400 font-semibold">
            {t.pricePerTier.Gold === 0 ? "Gold: Free" : `Gold: ₹${t.pricePerTier.Gold}`}
          </span>
          <span>·</span>
          <span>Silver: ₹{t.pricePerTier.Silver}</span>
          <span>·</span>
          <span>Guest: ₹{t.pricePerTier.Guest}</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (t) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleOpenEdit(t)}
          className="text-xs text-white/70 hover:text-white gap-1"
        >
          <Edit2 className="size-3.5" />
          <span>Edit</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Social Session Templates"
        subtitle="Configure weekly recurring mixer formats (Friday Night Social, Americano Ladders), court multi-blocks, player quotas, and tier pricing."
      />

      {/* Templates Table */}
      <Card className="p-0 overflow-hidden bg-court-500 border-white/14">
        <Table
          data={socialTemplates}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyTitle="No Social Templates"
          emptySubtitle="No recurring social session templates found."
        />
      </Card>

      {/* Edit Social Template Modal */}
      {formData && (
        <Modal
          isOpen={!!activeTemplate}
          onClose={() => {
            setActiveTemplate(null);
            setFormData(null);
          }}
          title={`Edit ${formData.title}`}
          subtitle="Configure recurring weekday, reserved court blocks, quotas, and per-tier rates."
        >
          <form onSubmit={handleSave} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <Input
              label="Session Title *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1.5">
                  Recurrence Day *
                </label>
                <select
                  value={formData.recurrenceDay}
                  onChange={(e) =>
                    setFormData({ ...formData, recurrenceDay: e.target.value as any })
                  }
                  className="w-full h-11 px-3 rounded-xl bg-navy-800 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
                >
                  <option value="Monday">Every Monday</option>
                  <option value="Tuesday">Every Tuesday</option>
                  <option value="Wednesday">Every Wednesday</option>
                  <option value="Thursday">Every Thursday</option>
                  <option value="Friday">Every Friday</option>
                  <option value="Saturday">Every Saturday</option>
                  <option value="Sunday">Every Sunday</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/80 mb-1.5">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full h-11 px-2.5 rounded-xl bg-white/8 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/80 mb-1.5">
                  End Time *
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full h-11 px-2.5 rounded-xl bg-white/8 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
                  required
                />
              </div>
            </div>

            {/* Reserved Courts Multi-Select */}
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Reserved Multi-Courts Block *
              </label>
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                {courts
                  .filter((c) => c.sport === formData.sport)
                  .map((court) => {
                    const isSelected = formData.courtIds.includes(court.id);
                    return (
                      <label
                        key={court.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border text-xs transition-colors ${
                          isSelected
                            ? "bg-volt-400/10 border-volt-400/40 text-white"
                            : "bg-white/4 border-white/10 text-white/60 hover:bg-white/8"
                        }`}
                      >
                        <span>{court.name}</span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCourtSelection(court.id)}
                          className="accent-volt-400 size-4"
                        />
                      </label>
                    );
                  })}
              </div>
            </div>

            {/* Capacity and Refreshments */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Maximum Player Quota *"
                type="number"
                min={4}
                max={64}
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: Number(e.target.value) })
                }
                required
              />

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 self-end h-11">
                <span className="text-xs text-white flex items-center gap-1.5">
                  <Coffee className="size-3.5 text-amber-400" />
                  <span>Refreshments Included</span>
                </span>
                <input
                  type="checkbox"
                  checked={formData.includesRefreshments}
                  onChange={(e) =>
                    setFormData({ ...formData, includesRefreshments: e.target.checked })
                  }
                  className="accent-volt-400 size-4"
                />
              </div>
            </div>

            {/* Tier Pricing Grid */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-volt-400 block">
                Session Fee by Tier (₹)
              </span>
              <div className="grid grid-cols-4 gap-2">
                <Input
                  label="Gold (₹)"
                  type="number"
                  min={0}
                  value={formData.pricePerTier.Gold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricePerTier: { ...formData.pricePerTier, Gold: Number(e.target.value) },
                    })
                  }
                  required
                />
                <Input
                  label="Silver (₹)"
                  type="number"
                  min={0}
                  value={formData.pricePerTier.Silver}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricePerTier: { ...formData.pricePerTier, Silver: Number(e.target.value) },
                    })
                  }
                  required
                />
                <Input
                  label="Junior (₹)"
                  type="number"
                  min={0}
                  value={formData.pricePerTier.Junior}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricePerTier: { ...formData.pricePerTier, Junior: Number(e.target.value) },
                    })
                  }
                  required
                />
                <Input
                  label="Guest (₹)"
                  type="number"
                  min={0}
                  value={formData.pricePerTier.Guest}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricePerTier: { ...formData.pricePerTier, Guest: Number(e.target.value) },
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setActiveTemplate(null);
                  setFormData(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Update Social Template
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
