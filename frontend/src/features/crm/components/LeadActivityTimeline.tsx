import { useState } from "react";
import {
  FileText,
  PhoneCall,
  Mail,
  ArrowRightCircle,
  FileSignature,
  Calendar,
  CheckCircle2,
  XCircle,
  Send,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useAuth } from "@/app/providers/AuthProvider";
import { crmActions } from "../crmStore";
import type { LeadActivity } from "../types";

interface LeadActivityTimelineProps {
  leadId: string;
  activities: LeadActivity[];
}

export function LeadActivityTimeline({ leadId, activities }: LeadActivityTimelineProps) {
  const { user } = useAuth();
  const authorName = user?.name || "Staff Member";

  const [activeTab, setActiveTab] = useState<"NOTE" | "CALL" | "EMAIL">("NOTE");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      crmActions.addActivity(leadId, {
        type: activeTab,
        title:
          activeTab === "NOTE"
            ? subject.trim() || "Staff Internal Note"
            : activeTab === "CALL"
            ? subject.trim() || "Phone Conversation Log"
            : subject.trim() || "Email Communication",
        content: content.trim(),
        author: authorName,
        authorRole: "Staff",
      });

      setContent("");
      setSubject("");
      setIsSubmitting(false);
    }, 250);
  };

  // Activity Icon mapping
  const renderActivityIcon = (type: LeadActivity["type"]) => {
    switch (type) {
      case "NOTE":
        return <FileText className="w-4 h-4 text-blue-400" />;
      case "CALL":
        return <PhoneCall className="w-4 h-4 text-amber-400" />;
      case "EMAIL":
        return <Mail className="w-4 h-4 text-purple-400" />;
      case "STAGE_CHANGE":
        return <ArrowRightCircle className="w-4 h-4 text-sky-400" />;
      case "QUOTE_CREATED":
      case "QUOTE_SENT":
        return <FileSignature className="w-4 h-4 text-volt-400" />;
      case "TRIAL_BOOKED":
        return <Calendar className="w-4 h-4 text-emerald-400" />;
      case "CONVERTED":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "LOST":
        return <XCircle className="w-4 h-4 text-rose-400" />;
      default:
        return <MessageSquare className="w-4 h-4 text-white/50" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Activity Composer */}
      <div className="rounded-2xl border border-white/14 bg-court-600/70 p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("NOTE")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all",
              activeTab === "NOTE"
                ? "bg-volt-400 text-ink-900 shadow-sm"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Note</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("CALL")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all",
              activeTab === "CALL"
                ? "bg-volt-400 text-ink-900 shadow-sm"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Log Call</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("EMAIL")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all",
              activeTab === "EMAIL"
                ? "bg-volt-400 text-ink-900 shadow-sm"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Log Email</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {(activeTab === "CALL" || activeTab === "EMAIL") && (
            <input
              type="text"
              placeholder={activeTab === "CALL" ? "Call outcome summary (e.g. Discussed peak slots)" : "Email Subject"}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl bg-white/8 border border-white/18 px-3.5 py-2 text-sm text-white placeholder-white/50 focus:border-volt-400 focus:ring-2 focus:ring-volt-400/25 outline-none"
            />
          )}

          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              activeTab === "NOTE"
                ? "Add an internal note or requirement observation..."
                : activeTab === "CALL"
                ? "Record key takeaways from the phone call..."
                : "Paste or summarize email communication sent to prospect..."
            }
            className="w-full rounded-2xl bg-white/8 border border-white/18 px-4 py-2.5 text-sm text-white placeholder-white/50 focus:border-volt-400 focus:ring-4 focus:ring-volt-400/25 transition-all outline-none resize-none"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-white/40">Posting as {authorName}</span>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={!content.trim()}
              loading={isSubmitting}
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {activeTab === "NOTE" ? "Save Note" : activeTab === "CALL" ? "Log Call" : "Log Email"}
            </Button>
          </div>
        </form>
      </div>

      {/* Chronological Timeline */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60">
          Activity History ({activities.length})
        </h3>

        {activities.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-white/10 bg-court-700/40 text-white/50 text-sm">
            No activity logged yet. Use the composer above to log your first interaction.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
            {activities.map((act) => {
              const formattedDate = new Date(act.createdAt).toLocaleString("en-IN", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div key={act.id} className="relative group">
                  {/* Timeline Node Icon */}
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-court-700 border border-white/20 flex items-center justify-center">
                    {renderActivityIcon(act.type)}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-court-600/50 p-4 transition-all group-hover:border-white/20 group-hover:bg-court-600/80">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <h4 className="text-sm font-semibold text-white">{act.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5">
                          <span>{act.author}</span>
                          {act.authorRole && (
                            <>
                              <span>•</span>
                              <span>{act.authorRole}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] text-white/40 flex-shrink-0">{formattedDate}</span>
                    </div>

                    <p className="text-xs text-white/80 leading-relaxed whitespace-pre-line mt-2">
                      {act.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
