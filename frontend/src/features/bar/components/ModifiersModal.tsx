import { useState } from "react";
import { MenuItem } from "../types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ChefHat, Check, Plus } from "lucide-react";

interface ModifiersModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: MenuItem | null;
  onConfirm: (modifiers: string[], notes: string) => void;
}

export function ModifiersModal({ isOpen, onClose, menuItem, onConfirm }: ModifiersModalProps) {
  if (!menuItem) return null;

  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState("");

  const toggleModifier = (mod: string) => {
    if (selectedModifiers.includes(mod)) {
      setSelectedModifiers(selectedModifiers.filter((m) => m !== mod));
    } else {
      setSelectedModifiers([...selectedModifiers, mod]);
    }
  };

  const handleAdd = () => {
    onConfirm(selectedModifiers, customNote.trim());
    setSelectedModifiers([]);
    setCustomNote("");
    onClose();
  };

  const popularModifiers = menuItem.popularModifiers || [
    "Less spicy",
    "Extra crispy",
    "No onion/garlic (Jain)",
    "Sauce on the side",
    "Extra lemon wedge",
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Item Modifiers: ${menuItem.name}`}>
      <div className="space-y-4">
        {/* Item Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h4 className="text-white font-semibold text-base">{menuItem.name}</h4>
            <p className="text-white/60 text-xs">{menuItem.description}</p>
          </div>
          <span className="text-volt-300 font-bold font-mono text-lg">
            ₹{menuItem.price.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Preset Modifiers Chips */}
        <div>
          <label className="text-xs font-semibold text-white/80 mb-2 block">
            Kitchen & Bar Preferences
          </label>
          <div className="flex flex-wrap gap-2">
            {popularModifiers.map((mod) => {
              const isSelected = selectedModifiers.includes(mod);
              return (
                <button
                  key={mod}
                  type="button"
                  onClick={() => toggleModifier(mod)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-volt-400 text-ink-900 border-volt-400 font-semibold shadow-sm"
                      : "bg-white/5 text-white/80 border-white/15 hover:bg-white/10"
                  }`}
                >
                  {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 text-white/40" />}
                  <span>{mod}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Chef / Bartender Note */}
        <div>
          <label className="text-xs font-semibold text-white/80 mb-1.5 block">
            Special Instructions / Table Note
          </label>
          <Input
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="e.g. Serve with dessert spoon, extra chilled glass..."
            className="w-full text-xs"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <Button variant="ghost" onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button onClick={handleAdd} size="sm" className="bg-volt-400 text-ink-900 font-bold hover:bg-volt-500">
            Add to Order
          </Button>
        </div>
      </div>
    </Modal>
  );
}
