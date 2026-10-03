import { useState } from "react";
import { useGo } from "@/app/router/links";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Table, type Column } from "@/components/ui/Table";
import { StatusPill } from "@/components/ui/StatusPill";
import { ShareLinkDialog } from "../components/ShareLinkDialog";
import { useOwnerStore } from "../ownerStore";
import type { ShareLinkRecord } from "../types";
import {
  Link2,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  ShieldAlert,
  ArrowLeft,
  Eye,
} from "lucide-react";
import { toast } from "@/components/ui/Toast";

export default function OwnerShareLinksPage() {
  const go = useGo();
  const { shareLinks, revokeShareLink } = useOwnerStore();

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (link: ShareLinkRecord) => {
    const fullUrl = `${window.location.origin}/share/${link.token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(link.id);
    toast.success("Public report link copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const columns: Column<ShareLinkRecord>[] = [
    {
      key: "title",
      header: "Report Title & Token",
      render: (l) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-chalk text-xs">{l.title}</p>
          <p className="text-[11px] text-chalk/50 font-mono">
            {l.id} · <span className="text-volt-400">/share/{l.token}</span>
          </p>
          {l.notes && <p className="text-[10px] text-chalk/60 italic">{l.notes}</p>}
        </div>
      ),
    },
    {
      key: "scope",
      header: "Access Scope",
      render: (l) => (
        <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-court-700 text-chalk border border-chalk/10 font-mono">
          {l.scope.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "timeline",
      header: "Created / Expiry",
      render: (l) => (
        <div className="text-xs font-mono space-y-0.5">
          <p className="text-chalk/80">Created: {new Date(l.createdAt).toLocaleDateString("en-IN")}</p>
          <p className="text-chalk/50">Expires: {new Date(l.expiresAt).toLocaleDateString("en-IN")}</p>
        </div>
      ),
    },
    {
      key: "views",
      header: "Views",
      render: (l) => (
        <span className="font-mono text-xs font-bold text-volt-400">
          {l.viewsCount} visits
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (l) => (
        <StatusPill
          variant={
            l.status === "ACTIVE"
              ? "success"
              : l.status === "EXPIRED"
              ? "warning"
              : "danger"
          }
        >
          {l.status}
        </StatusPill>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (l) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy(l)}
            className="text-xs text-chalk/70 hover:text-chalk gap-1"
            title="Copy URL"
          >
            {copiedId === l.id ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
            {copiedId === l.id ? "Copied" : "Copy"}
          </Button>

          {l.status === "ACTIVE" && (
            <a
              href={`/share/${l.token}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-volt-400 hover:text-volt-300 font-semibold px-2 py-1 rounded hover:bg-white/5"
            >
              <ExternalLink className="size-3" /> View
            </a>
          )}

          {l.status === "ACTIVE" && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => revokeShareLink(l.id)}
              className="text-xs gap-1"
            >
              <ShieldAlert className="size-3" /> Revoke
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => go("/owner")}
          className="gap-1 text-xs"
        >
          <ArrowLeft className="size-3.5" /> Back to Dashboard
        </Button>
      </div>

      <PageHeader
        title="Public Read-Only Share Links"
        subtitle="Manage secure tokenized URLs issued to board members, external advisors, and commercial partners (RPT-10)."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsShareModalOpen(true)}
            className="gap-1.5 text-xs font-bold"
          >
            <Plus className="size-4" /> Create Share Link
          </Button>
        }
      />

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="size-4 text-volt-400" />
            <h3 className="text-sm font-semibold text-chalk">Active & Archived Share Tokens</h3>
          </div>
          <span className="text-xs text-chalk/50 font-mono">
            {shareLinks.length} total links generated
          </span>
        </div>

        <Table
          data={shareLinks}
          columns={columns}
          keyExtractor={(l) => l.id}
          emptyTitle="No share links found"
          emptySubtitle="Generate a new tokenized share link to grant external read-only access."
        />
      </Card>

      {/* Share Dialog */}
      <ShareLinkDialog
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
