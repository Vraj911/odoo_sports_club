import { useState } from "react";
import { Plus, Check, Clock, AlertTriangle, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import { crmActions, isTaskOverdue } from "../crmStore";
import { CRM_OWNERS } from "../sampleData";
import type { FollowUpTask } from "../types";

interface LeadFollowUpsProps {
  leadId: string;
  tasks: FollowUpTask[];
}

export function LeadFollowUps({ leadId, tasks }: LeadFollowUpsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [assignedTo, setAssignedTo] = useState(CRM_OWNERS[0].name);
  const [notes, setNotes] = useState("");

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueAt) return;

    crmActions.addFollowUp(leadId, {
      title: title.trim(),
      dueAt: new Date(dueAt).toISOString(),
      assignedTo,
      notes: notes.trim() || undefined,
    });

    setTitle("");
    setDueAt("");
    setNotes("");
    setIsAdding(false);
  };

  return (
    <div className="rounded-2xl border border-white/14 bg-court-600/70 p-5 shadow-card space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Follow-up Tasks</h3>
          <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/70">
            {tasks.filter((t) => !t.completed).length} open
          </span>
        </div>

        {!isAdding && (
          <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Task
          </Button>
        )}
      </div>

      {/* Task Creation Form */}
      {isAdding && (
        <form onSubmit={handleCreateTask} className="space-y-3 p-3.5 rounded-xl bg-court-700/60 border border-white/10">
          <Input
            placeholder="Task description (e.g. Call regarding trial feedback)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              leftIcon={<Calendar className="w-4 h-4 text-white/50" />}
            />

            <Select
              value={assignedTo}
              onChange={(val) => setAssignedTo(val)}
              options={CRM_OWNERS.map((o) => ({ value: o.name, label: o.name }))}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={!title.trim() || !dueAt}>
              Save Task
            </Button>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="space-y-2.5">
        {tasks.length === 0 ? (
          <p className="text-xs text-white/50 text-center py-4">No follow-up tasks scheduled.</p>
        ) : (
          tasks.map((task) => {
            const overdue = isTaskOverdue(task);
            const formattedDue = new Date(task.dueAt).toLocaleString("en-IN", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border transition-all text-xs",
                  task.completed
                    ? "bg-white/4 border-white/5 opacity-60"
                    : overdue
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-court-700/40 border-white/10"
                )}
              >
                {/* Complete Checkbox */}
                <button
                  type="button"
                  onClick={() => crmActions.toggleFollowUp(task.id)}
                  className={cn(
                    "w-4 h-4 rounded mt-0.5 border flex items-center justify-center transition-all flex-shrink-0",
                    task.completed
                      ? "bg-emerald-500 border-emerald-500 text-ink-900"
                      : "border-white/30 hover:border-volt-400"
                  )}
                >
                  {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                </button>

                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "font-medium text-white",
                      task.completed && "line-through text-white/50"
                    )}
                  >
                    {task.title}
                  </p>

                  <div className="flex items-center gap-2 mt-1 text-[11px] text-white/50">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {task.assignedTo}
                    </span>
                    <span>•</span>
                    <span className={cn("flex items-center gap-1", overdue && "text-red-400 font-semibold")}>
                      {overdue ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {overdue ? `Overdue (${formattedDue})` : formattedDue}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
