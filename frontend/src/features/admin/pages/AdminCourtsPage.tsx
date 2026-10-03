import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { Table, type Column } from "@/components/ui/Table";
import { useAdminConfigStore } from "../adminConfigStore";
import type { AdminCourt } from "../types";
import {
  LandPlot,
  PlusCircle,
  Search,
  Filter,
  SlidersHorizontal,
  Edit2,
  CheckCircle2,
  Wrench,
  Sun,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

export default function AdminCourtsPage() {
  const { courts, sports, addCourt, updateCourt, addSportType } = useAdminConfigStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [sportFilter, setSportFilter] = useState("ALL");

  // Court Drawer State (Create or Edit)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null);

  // Form State
  const [courtName, setCourtName] = useState("");
  const [courtSport, setCourtSport] = useState("tennis");
  const [courtSurface, setCourtSurface] = useState("Red Clay");
  const [isIndoor, setIsIndoor] = useState(false);
  const [courtStatus, setCourtStatus] = useState<"OPERATIONAL" | "MAINTENANCE">("OPERATIONAL");
  const [isActive, setIsActive] = useState(true);
  const [lightingFee, setLightingFee] = useState<number>(0);

  // New Sport Modal State
  const [isSportModalOpen, setIsSportModalOpen] = useState(false);
  const [newSportName, setNewSportName] = useState("");
  const [newSportSlotMinutes, setNewSportSlotMinutes] = useState(60);

  const filteredCourts = useMemo(() => {
    return courts.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.surface.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSport = sportFilter === "ALL" || c.sport.toLowerCase() === sportFilter.toLowerCase();
      return matchesSearch && matchesSport;
    });
  }, [courts, searchQuery, sportFilter]);

  const handleOpenCreateDrawer = () => {
    setEditingCourtId(null);
    setCourtName("");
    setCourtSport(sports[0]?.id || "tennis");
    setCourtSurface("Red Clay");
    setIsIndoor(false);
    setCourtStatus("OPERATIONAL");
    setIsActive(true);
    setLightingFee(0);
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (court: AdminCourt) => {
    setEditingCourtId(court.id);
    setCourtName(court.name);
    setCourtSport(court.sport);
    setCourtSurface(court.surface);
    setIsIndoor(court.isIndoor);
    setCourtStatus(court.status);
    setIsActive(court.active);
    setLightingFee(court.lightingFeePerHour || 0);
    setIsDrawerOpen(true);
  };

  const handleSaveCourt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courtName.trim()) return;

    if (editingCourtId) {
      updateCourt(editingCourtId, {
        name: courtName,
        sport: courtSport,
        surface: courtSurface,
        isIndoor,
        status: courtStatus,
        active: isActive,
        lightingFeePerHour: lightingFee > 0 ? lightingFee : undefined,
      });
    } else {
      addCourt({
        name: courtName,
        sport: courtSport,
        surface: courtSurface,
        isIndoor,
        status: courtStatus,
        active: isActive,
        lightingFeePerHour: lightingFee > 0 ? lightingFee : undefined,
      });
    }
    setIsDrawerOpen(false);
  };

  const handleCreateSport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSportName.trim()) return;
    addSportType(newSportName.trim(), newSportSlotMinutes);
    setIsSportModalOpen(false);
    setNewSportName("");
  };

  const columns: Column<AdminCourt>[] = [
    {
      key: "id",
      header: "Court Reference",
      render: (c) => (
        <div className="flex flex-col">
          <span className="font-semibold text-white">{c.name}</span>
          <span className="font-mono text-[11px] text-volt-400">{c.id}</span>
        </div>
      ),
    },
    {
      key: "sport",
      header: "Sport Type",
      render: (c) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/8 text-white/90 border border-white/14 capitalize">
          {c.sport}
        </span>
      ),
    },
    {
      key: "surface",
      header: "Surface & Environment",
      render: (c) => (
        <div className="flex flex-col">
          <span className="text-xs text-white/90">{c.surface}</span>
          <span className="text-[11px] text-white/50">
            {c.isIndoor ? "Indoor (Covered)" : "Outdoor"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Condition Status",
      render: (c) => (
        <StatusPill variant={c.status === "OPERATIONAL" ? "success" : "warning"}>
          {c.status === "OPERATIONAL" ? "Operational" : "Maintenance"}
        </StatusPill>
      ),
    },
    {
      key: "active",
      header: "Active Booking State",
      render: (c) => (
        <button
          onClick={() => updateCourt(c.id, { active: !c.active })}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            c.active ? "bg-volt-400" : "bg-white/20"
          }`}
          title={c.active ? "Active: Available in booking engine" : "Inactive: Hidden from members"}
        >
          <span
            className={`pointer-events-none inline-block size-4 transform rounded-full bg-ink-900 shadow ring-0 transition duration-200 ease-in-out ${
              c.active ? "translate-x-4" : "translate-x-0 bg-white"
            }`}
          />
        </button>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (c) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleOpenEditDrawer(c)}
          className="text-xs text-white/80 hover:text-volt-400 gap-1"
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
        title="Courts & Facility Inventory"
        subtitle="Manage court resources, surfaces, indoor/outdoor classifications, lighting tariffs, and active booking availability."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setIsSportModalOpen(true)} className="gap-2">
              <Sparkles className="size-4" />
              <span>+ Add Sport Type</span>
            </Button>
            <Button variant="primary" onClick={handleOpenCreateDrawer} className="gap-2">
              <PlusCircle className="size-4" />
              <span>Add Court</span>
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-court-500 border-white/14">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
            <input
              type="text"
              placeholder="Search court name, surface, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-9 pr-4 rounded-xl bg-white/8 border border-white/18 text-sm text-white placeholder-white/40 focus:outline-none focus:border-volt-400"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-white/60 shrink-0">Sport:</span>
            <div className="flex rounded-lg bg-white/6 p-1 border border-white/10 shrink-0">
              <button
                onClick={() => setSportFilter("ALL")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  sportFilter === "ALL"
                    ? "bg-volt-400 text-ink-900 shadow-sm"
                    : "text-white/70 hover:text-white"
                }`}
              >
                All Sports
              </button>
              {sports.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSportFilter(s.id)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all capitalize ${
                    sportFilter === s.id
                      ? "bg-volt-400 text-ink-900 shadow-sm"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Courts Table */}
      <Card className="p-0 overflow-hidden bg-court-500 border-white/14">
        <Table
          data={filteredCourts}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyTitle="No Courts Found"
          emptySubtitle="No facility courts match your current search and sport filter criteria."
        />
      </Card>

      {/* Court Create / Edit Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingCourtId ? "Edit Court Configuration" : "Add Facility Court"}
        subtitle="Specify court dimensions, sport classification, surfaces, and lighting parameters."
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="ghost" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveCourt}>
              {editingCourtId ? "Save Court Changes" : "Create Court Resource"}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveCourt} className="space-y-4">
          <Input
            label="Court Name *"
            placeholder="e.g. Tennis Court 4 (Synthetic Hard)"
            value={courtName}
            onChange={(e) => setCourtName(e.target.value)}
            required
            autoFocus
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-white/80">Sport Type *</label>
              <button
                type="button"
                onClick={() => setIsSportModalOpen(true)}
                className="text-[11px] text-volt-400 hover:underline"
              >
                + Add new sport
              </button>
            </div>
            <select
              value={courtSport}
              onChange={(e) => setCourtSport(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-navy-800 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400 capitalize"
            >
              {sports.map((s) => (
                <option key={s.id} value={s.id} className="bg-navy-800 text-white capitalize">
                  {s.name} ({s.defaultSlotMinutes}m default session)
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Court Surface Material *"
            placeholder="e.g. Red Clay, Teak Wood, Mondo Turf, Plexicushion"
            value={courtSurface}
            onChange={(e) => setCourtSurface(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Environment *
              </label>
              <select
                value={isIndoor ? "INDOOR" : "OUTDOOR"}
                onChange={(e) => setIsIndoor(e.target.value === "INDOOR")}
                className="w-full h-11 px-3 rounded-xl bg-navy-800 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
              >
                <option value="OUTDOOR" className="bg-navy-800 text-white">
                  Outdoor (Open Air)
                </option>
                <option value="INDOOR" className="bg-navy-800 text-white">
                  Indoor (Weatherproof)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Facility Status *
              </label>
              <select
                value={courtStatus}
                onChange={(e) => setCourtStatus(e.target.value as any)}
                className="w-full h-11 px-3 rounded-xl bg-navy-800 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
              >
                <option value="OPERATIONAL" className="bg-navy-800 text-white">
                  Operational
                </option>
                <option value="MAINTENANCE" className="bg-navy-800 text-white">
                  Maintenance / Service
                </option>
              </select>
            </div>
          </div>

          <Input
            label="Floodlight Surcharge (₹ / hr)"
            type="number"
            placeholder="0"
            value={lightingFee}
            onChange={(e) => setLightingFee(Number(e.target.value))}
          />

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div>
              <span className="text-xs font-medium text-white block">Active in Online Booking</span>
              <span className="text-[11px] text-white/60">
                Turn off to temporarily hide court from member reservation calendars.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isActive ? "bg-volt-400" : "bg-white/20"
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-ink-900 shadow ring-0 transition duration-200 ease-in-out ${
                  isActive ? "translate-x-5" : "translate-x-0 bg-white"
                }`}
              />
            </button>
          </div>
        </form>
      </Drawer>

      {/* Add Sport Type Modal */}
      <Modal
        isOpen={isSportModalOpen}
        onClose={() => setIsSportModalOpen(false)}
        title="Add Sport Type"
        subtitle="Expand club offerings with a new racquet or turf discipline."
      >
        <form onSubmit={handleCreateSport} className="space-y-4">
          <Input
            label="Sport Discipline Name *"
            placeholder="e.g. Cricket Net, Table Tennis, Squash 57"
            value={newSportName}
            onChange={(e) => setNewSportName(e.target.value)}
            required
            autoFocus
          />

          <div>
            <label className="block text-xs font-medium text-white/80 mb-1.5">
              Default Booking Slot Length (Minutes) *
            </label>
            <select
              value={newSportSlotMinutes}
              onChange={(e) => setNewSportSlotMinutes(Number(e.target.value))}
              className="w-full h-11 px-3 rounded-xl bg-navy-800 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
            >
              <option value={30}>30 Minutes</option>
              <option value={45}>45 Minutes (Squash standard)</option>
              <option value={60}>60 Minutes (Standard 1 hour)</option>
              <option value={90}>90 Minutes (Padel matches)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setIsSportModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Sport Type
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
