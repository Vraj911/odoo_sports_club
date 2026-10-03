import { FileSignature, Plus, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Money } from "@/components/shared/Money";
import { useGo } from "@/app/router/links";
import { useCan } from "@/lib/permissions";
import { cn } from "@/lib/cn";
import type { Quote } from "../types";

interface LeadQuotesListProps {
  leadId: string;
  quotes: Quote[];
}

export function LeadQuotesList({ leadId, quotes }: LeadQuotesListProps) {
  const go = useGo();
  const can = useCan();
  const canQuote = can("crm.quotes");

  return (
    <div className="rounded-2xl border border-white/14 bg-court-600/70 p-5 shadow-card space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <FileSignature className="w-4 h-4 text-volt-400" />
          <h3 className="text-sm font-semibold text-white">Quotations ({quotes.length})</h3>
        </div>

        {canQuote && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => go(`/crm/leads/${leadId}/quote`)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Build Quote
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {quotes.length === 0 ? (
          <div className="p-4 text-center rounded-xl bg-court-700/30 border border-dashed border-white/10 text-xs text-white/50">
            <span>No quotes generated for this lead yet.</span>
            {canQuote && (
              <div className="mt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => go(`/crm/leads/${leadId}/quote`)}
                >
                  Generate First Quote
                </Button>
              </div>
            )}
          </div>
        ) : (
          quotes.map((quote) => (
            <div
              key={quote.id}
              className="p-3.5 rounded-xl border border-white/10 bg-court-700/40 hover:border-white/20 transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-semibold text-white">{quote.quoteNumber}</span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                    quote.status === "SENT"
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                      : quote.status === "ACCEPTED" || quote.status === "INVOICED"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-white/10 text-white/70 border-white/20"
                  )}
                >
                  {quote.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">
                  {quote.items.length} item{quote.items.length > 1 ? "s" : ""} • Valid till {quote.validUntil}
                </span>
                <div className="font-semibold text-volt-400">
                  <Money amount={quote.grandTotal} />
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
                <span>Created {new Date(quote.createdAt).toLocaleDateString("en-IN")}</span>
                <button
                  type="button"
                  onClick={() => go(`/crm/leads/${leadId}/quote`)}
                  className="text-volt-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>View / Edit</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
