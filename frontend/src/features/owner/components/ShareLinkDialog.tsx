import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { useOwnerStore } from "../ownerStore";
import type { TimeWindow, ShareLinkRecord } from "../types";
import { Share2, Mail, Link as LinkIcon, Copy, Check, ShieldCheck, Clock, ExternalLink } from "lucide-react";
import { toast } from "@/components/ui/Toast";

export interface ShareLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTimeWindow?: TimeWindow;
}

const SHARE_TABS: TabItem[] = [
  { id: "link", label: "Read-Only Link", icon: <LinkIcon className="size-3.5" /> },
  { id: "email", label: "Email Report", icon: <Mail className="size-3.5" /> },
];

export function ShareLinkDialog({ isOpen, onClose, defaultTimeWindow = "THIS_MONTH" }: ShareLinkDialogProps) {
  const { createShareLink } = useOwnerStore();

  const [activeTab, setActiveTab] = useState<string>("link");

  // Email form state
  const [emailRecipients, setEmailRecipients] = useState("");
  const [emailSubject, setEmailSubject] = useState("Champions Club - Executive Performance Report");
  const [emailMessage, setEmailMessage] = useState("Please find attached the latest executive performance report for Champions Sports Club.");
  const [emailFormat, setEmailFormat] = useState<"PDF" | "CSV" | "EXCEL">("PDF");

  // Link generation state
  const [linkTitle, setLinkTitle] = useState("Board Overview - October 2026");
  const [linkScope, setLinkScope] = useState<ShareLinkRecord["scope"]>("EXECUTIVE_OVERVIEW");
  const [linkExpiryDays, setLinkExpiryDays] = useState(7);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRecipients.trim()) {
      toast.error("Please enter at least one recipient email address.");
      return;
    }
    toast.success(`Executive report queued and emailed to ${emailRecipients}!`);
    onClose();
  };

  const handleGenerateLink = (e: React.FormEvent) => {
    e.preventDefault();
    const newLink = createShareLink({
      title: linkTitle,
      scope: linkScope,
      timeWindow: defaultTimeWindow,
      expiresInDays: linkExpiryDays,
    });

    const fullUrl = `${window.location.origin}/share/${newLink.token}`;
    setGeneratedLink(fullUrl);
    setCopied(false);
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success("Share link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-volt-400/20 text-volt-400">
            <Share2 className="size-4" />
          </div>
          <span>Share Executive Report</span>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex justify-center pb-2">
          <Tabs tabs={SHARE_TABS} activeId={activeTab} onChange={setActiveTab} />
        </div>

        {/* TAB 1: READ-ONLY LINK GENERATION */}
        {activeTab === "link" && (
          <div className="space-y-4 pt-2 text-xs">
            {!generatedLink ? (
              <form onSubmit={handleGenerateLink} className="space-y-4">
                <div className="space-y-1">
                  <label className="font-semibold text-chalk/80">Report Title</label>
                  <Input
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    placeholder="e.g. Q3 Strategic Performance Overview"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-chalk/80">Report Scope</label>
                    <select
                      value={linkScope}
                      onChange={(e) => setLinkScope(e.target.value as any)}
                      className="w-full h-12 rounded-xl bg-white/8 border border-white/18 text-chalk px-3 text-xs focus:border-volt-400 focus:outline-none"
                    >
                      <option value="EXECUTIVE_OVERVIEW" className="bg-navy-900 text-chalk">
                        Executive Overview (KPIs & Revenue)
                      </option>
                      <option value="FINANCIAL_DETAILED" className="bg-navy-900 text-chalk">
                        Financial Detailed (P&L, Taxes, Vendors)
                      </option>
                      <option value="OPERATIONS_CAPACITY" className="bg-navy-900 text-chalk">
                        Operations & Court Utilisation
                      </option>
                      <option value="FULL_BOARD_PACKAGE" className="bg-navy-900 text-chalk">
                        Full Board Comprehensive Package
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-chalk/80">Link Expiry</label>
                    <select
                      value={linkExpiryDays}
                      onChange={(e) => setLinkExpiryDays(Number(e.target.value))}
                      className="w-full h-12 rounded-xl bg-white/8 border border-white/18 text-chalk px-3 text-xs focus:border-volt-400 focus:outline-none"
                    >
                      <option value={3} className="bg-navy-900 text-chalk">Expires in 3 Days</option>
                      <option value={7} className="bg-navy-900 text-chalk">Expires in 7 Days (Standard)</option>
                      <option value={14} className="bg-navy-900 text-chalk">Expires in 14 Days</option>
                      <option value={30} className="bg-navy-900 text-chalk">Expires in 30 Days</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-xl border border-chalk/14 bg-court-700/60 p-3 text-[11px] text-chalk/70 space-y-1">
                  <p className="font-semibold text-chalk flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-volt-400" /> Secure Tokenized View
                  </p>
                  <p>
                    Recipients access an isolated public read-only report without login. Sensitive actions like edits and audit logs are completely omitted.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="gap-1.5">
                    <LinkIcon className="size-3.5" /> Generate Tokenized Link
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 py-2">
                <div className="rounded-2xl border border-volt-400/40 bg-volt-400/10 p-4 space-y-2">
                  <p className="text-xs font-bold text-volt-400 flex items-center gap-1.5">
                    <Check className="size-4" /> Share Link Active & Ready
                  </p>
                  <p className="text-[11px] text-chalk/80">
                    Anyone with this secure link can view this snapshot until it expires in {linkExpiryDays} days.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      value={generatedLink}
                      readOnly
                      className="font-mono text-xs select-all bg-court-800"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleCopyLink}
                      className="shrink-0 gap-1"
                    >
                      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <a
                    href={generatedLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-volt-400 hover:underline"
                  >
                    <ExternalLink className="size-3" /> Preview Public Report
                  </a>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setGeneratedLink(null);
                      onClose();
                    }}
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EMAIL REPORT DIRECTLY */}
        {activeTab === "email" && (
          <div className="space-y-4 pt-2 text-xs">
            <form onSubmit={handleSendEmail} className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold text-chalk/80">
                  Recipient Email(s) <span className="text-danger">*</span>
                </label>
                <Input
                  placeholder="e.g. director@championsclub.in, cfo@partner.com"
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="font-semibold text-chalk/80">Email Subject</label>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-chalk/80">Attachment Format</label>
                  <select
                    value={emailFormat}
                    onChange={(e) => setEmailFormat(e.target.value as any)}
                    className="w-full h-12 rounded-xl bg-white/8 border border-white/18 text-chalk px-3 text-xs focus:border-volt-400 focus:outline-none"
                  >
                    <option value="PDF" className="bg-navy-900 text-chalk">PDF Document</option>
                    <option value="EXCEL" className="bg-navy-900 text-chalk">Excel Spreadsheet</option>
                    <option value="CSV" className="bg-navy-900 text-chalk">CSV File</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-chalk/80">Accompanying Message</label>
                <textarea
                  rows={3}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full rounded-xl bg-white/8 border border-white/18 text-chalk p-3 text-xs focus:border-volt-400 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="gap-1.5">
                  <Mail className="size-3.5" /> Dispatch Report Email
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Modal>
  );
}
