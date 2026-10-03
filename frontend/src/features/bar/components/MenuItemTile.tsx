import { MenuItem } from "../types";
import { ChefHat, Wine, SlidersHorizontal, Plus, Ban } from "lucide-react";

interface MenuItemTileProps {
  item: MenuItem;
  onAdd: () => void;
  onOpenModifiers: () => void;
}

export function MenuItemTile({ item, onAdd, onOpenModifiers }: MenuItemTileProps) {
  const isAvailable = item.isAvailable;

  return (
    <div
      className={`relative group flex flex-col justify-between p-3.5 rounded-2xl border transition-all duration-150 select-none ${
        isAvailable
          ? "bg-court-600/70 hover:bg-court-500/80 border-white/10 hover:border-volt-400/40 cursor-pointer active:scale-[0.98]"
          : "bg-court-800/40 border-white/5 opacity-50 cursor-not-allowed"
      }`}
      onClick={() => {
        if (isAvailable) onAdd();
      }}
    >
      {/* 86'd Overlay Banner */}
      {!isAvailable && (
        <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center z-10 p-2 text-center">
          <Ban className="w-5 h-5 text-red-400 mb-1" />
          <span className="text-[11px] font-bold text-red-300 uppercase tracking-wider">
            86'd · Unavailable
          </span>
          <span className="text-[10px] text-white/50">Out of ingredients</span>
        </div>
      )}

      {/* Header: Station Chip & Modifiers Button */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            item.station === "KITCHEN"
              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
              : "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
          }`}
        >
          {item.station === "KITCHEN" ? (
            <ChefHat className="w-3 h-3" />
          ) : (
            <Wine className="w-3 h-3" />
          )}
          {item.station}
        </span>

        {/* Modifiers sheet trigger */}
        {isAvailable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenModifiers();
            }}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-white/60 hover:text-volt-300 transition-colors"
            title="Custom preparation & notes"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Item Title and Description */}
      <div className="flex-1 my-1">
        <h4 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-volt-300 transition-colors">
          {item.name}
        </h4>
        <p className="text-[11px] text-white/50 line-clamp-2 mt-0.5 leading-snug">
          {item.description}
        </p>
      </div>

      {/* Price + Quick Add Button */}
      <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/10">
        <span className="text-sm font-bold text-volt-300 font-mono">
          ₹{item.price.toLocaleString("en-IN")}
        </span>

        {isAvailable && (
          <div className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-volt-400 group-hover:text-ink-900 text-white flex items-center justify-center transition-colors">
            <Plus className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
}
