import { useState } from "react";
import { ClubTable } from "../types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ArrowRightLeft, Combine, Users } from "lucide-react";

interface TransferMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceTable: ClubTable | null;
  availableTables: ClubTable[];
  onConfirm: (targetTableId: string, mode: "TRANSFER" | "MERGE") => void;
}

export function TransferMergeModal({
  isOpen,
  onClose,
  sourceTable,
  availableTables,
  onConfirm,
}: TransferMergeModalProps) {
  if (!sourceTable) return null;

  const [mode, setMode] = useState<"TRANSFER" | "MERGE">("TRANSFER");
  const [targetTableId, setTargetTableId] = useState<string>("");

  const candidateTables = availableTables.filter((t) => t.id !== sourceTable.id);

  const handleConfirm = () => {
    if (!targetTableId) {
      alert("Please select a target table.");
      return;
    }
    onConfirm(targetTableId, mode);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manage ${sourceTable.name}`}>
      <div className="space-y-4">
        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => setMode("TRANSFER")}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              mode === "TRANSFER"
                ? "bg-volt-400 text-ink-900 shadow-md font-bold"
                : "text-white/60 hover:text-white"
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Transfer Table
          </button>
          <button
            type="button"
            onClick={() => setMode("MERGE")}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              mode === "MERGE"
                ? "bg-volt-400 text-ink-900 shadow-md font-bold"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Combine className="w-3.5 h-3.5" />
            Merge Tables
          </button>
        </div>

        <p className="text-xs text-white/60">
          {mode === "TRANSFER"
            ? `Move all active rounds and covers from ${sourceTable.name} to another table.`
            : `Combine orders from ${sourceTable.name} into another occupied table's bill.`}
        </p>

        {/* Target Table Grid Selector */}
        <div>
          <label className="text-xs font-semibold text-white/80 mb-2 block">
            Select Destination Table
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
            {candidateTables.map((t) => {
              const isSelected = targetTableId === t.id;
              const isOccupied = t.status === "OCCUPIED" || t.status === "BILL_REQUESTED";

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTargetTableId(t.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "bg-volt-400 text-ink-900 border-volt-400 font-bold shadow-md"
                      : "bg-court-700/60 hover:bg-court-600/80 border-white/10 text-white"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-heading font-bold">{t.id}</span>
                    <span className="text-[10px] opacity-70 flex items-center gap-0.5">
                      <Users className="w-3 h-3" />
                      {t.seats}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] block mt-1 uppercase font-semibold ${
                      isSelected
                        ? "text-ink-900/80"
                        : isOccupied
                        ? "text-volt-300"
                        : "text-white/50"
                    }`}
                  >
                    {t.status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            className="bg-volt-400 hover:bg-volt-500 text-ink-900 font-bold"
          >
            Confirm {mode === "TRANSFER" ? "Transfer" : "Merge"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
