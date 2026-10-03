import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Activity, Trophy, Check } from "lucide-react";

interface CourtOrderLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (courtName: string) => void;
  currentCourt?: string;
}

const COURTS = [
  { id: "CRT-1", name: "Court 1 - Badminton Premier", sport: "Badminton" },
  { id: "CRT-2", name: "Court 2 - Tennis Clay Center", sport: "Tennis" },
  { id: "CRT-3", name: "Court 3 - Squash Championship", sport: "Squash" },
  { id: "CRT-4", name: "Court 4 - Padel Panoramic", sport: "Padel" },
  { id: "CRT-5", name: "Court 5 - Table Tennis Arena", sport: "Table Tennis" },
  { id: "CRT-6", name: "Court 6 - Swimming Deck Lounge", sport: "Poolside" },
];

export function CourtOrderLinkModal({
  isOpen,
  onClose,
  onConfirm,
  currentCourt,
}: CourtOrderLinkModalProps) {
  const [selectedCourt, setSelectedCourt] = useState(currentCourt || COURTS[0].name);

  const handleConfirm = () => {
    onConfirm(selectedCourt);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Link Order to Court Session">
      <div className="space-y-4">
        <p className="text-xs text-white/60">
          Route snacks, electrolytes, and beverages directly to active players courtside.
        </p>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {COURTS.map((court) => {
            const isSelected = selectedCourt === court.name;
            return (
              <button
                key={court.id}
                type="button"
                onClick={() => setSelectedCourt(court.name)}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? "bg-volt-400 text-ink-900 border-volt-400 font-bold shadow-md"
                    : "bg-court-700/60 hover:bg-court-600/80 border-white/10 text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Activity className={`w-4 h-4 ${isSelected ? "text-ink-900" : "text-volt-300"}`} />
                  <div>
                    <span className="text-xs font-semibold block">{court.name}</span>
                    <span className={`text-[10px] block ${isSelected ? "text-ink-900/70" : "text-white/50"}`}>
                      {court.sport} Session Active
                    </span>
                  </div>
                </div>

                {isSelected && <Check className="w-4 h-4 text-ink-900" />}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            className="bg-volt-400 hover:bg-volt-500 text-ink-900 font-bold"
          >
            Attach to Court
          </Button>
        </div>
      </div>
    </Modal>
  );
}
