import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import {
  Megaphone,
  Mail,
  MessageSquare,
  Users,
  Send,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Clock,
  Eye,
  MousePointerClick,
  Plus,
} from "lucide-react";
import { useCrmStore, crmActions } from "../crmStore";
import type { Campaign } from "../types";

export default function CrmCampaignsPage() {
  const { campaigns } = useCrmStore();

  // Campaign Composer State
  const [title, setTitle] = useState("Weekend Sports & Social Mix-in Invitation");
  const [channel, setChannel] = useState<"EMAIL" | "SMS">("EMAIL");
  const [leadStage, setLeadStage] = useState("CONTACTED");
  const [tier, setTier] = useState("ALL");
  const [subject, setSubject] = useState("Exclusive Weekend Sparring Session at Champions Club 🎾");
  const [content, setContent] = useState(
    "Hi {first_name},\n\nWe're hosting a curated Friday Evening Social Mix-in across all 10 championship courts! Join fellow enthusiasts for friendly doubles, racket demos, and post-match drinks at Courtside Bar.\n\nUse code {offer_code} to confirm your attendance.\n\nWarm regards,\n{club_name} Team"
  );

  // Test Modal
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState("member.demo@championsclub.in");

  // Filter & Estimated audience
  const estimatedAudience = useMemo(() => {
    let base = 65;
    if (leadStage === "CONTACTED") base += 40;
    if (tier === "Gold") base += 30;
    return base;
  }, [leadStage, tier]);

  // Insert merge tag into content
  const insertTag = (tag: string) => {
    setContent((prev) => `${prev} ${tag}`);
  };

  // Live rendered preview
  const livePreview = useMemo(() => {
    return content
      .replace(/{first_name}/g, "Rohan")
      .replace(/{club_name}/g, "Champions Club")
      .replace(/{offer_code}/g, "CHAMPION26")
      .replace(/{trial_link}/g, "https://championsclub.in/trial");
  }, [content]);

  // Send Test Handler
  const handleSendTest = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestModalOpen(false);
    toast({
      type: "success",
      title: "Test Message Sent",
      message: `Test ${channel} dispatched to ${testRecipient}.`,
    });
  };

  // Launch Campaign Handler
  const handleLaunchCampaign = () => {
    if (!title.trim() || !content.trim()) return;

    const newCamp = crmActions.createCampaign({
      title,
      channel,
      segment: {
        leadStage: leadStage as any,
        tier: tier as any,
      },
      subject: channel === "EMAIL" ? subject : title,
      content,
    });

    crmActions.sendCampaign(newCamp.id);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      <PageHeader
        title="Marketing & Prospect Campaigns"
        description="Run targeted email and SMS engagement campaigns with dynamic merge tags, audience segmenting, and conversion analytics."
      />

      {/* Campaign Builder / Composer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Segment & Message (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-volt-400" />
                <h3 className="text-base font-semibold text-white">Create Targeted Campaign</h3>
              </div>
              <span className="text-xs bg-volt-400/20 text-volt-300 font-semibold px-2.5 py-0.5 rounded-full border border-volt-400/30">
                Estimated Audience: ~{estimatedAudience} recipients
              </span>
            </div>

            {/* Campaign Name & Channel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Campaign Name"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. October Racket Demo Invitational"
                />
              </div>

              <div>
                <label className="text-[13px] font-medium text-white/80 mb-1.5 block">Delivery Channel</label>
                <div className="grid grid-cols-2 gap-1.5 h-11 bg-white/8 p-1 rounded-xl border border-white/18">
                  <button
                    type="button"
                    onClick={() => setChannel("EMAIL")}
                    className={`rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      channel === "EMAIL" ? "bg-volt-400 text-ink-900 shadow-sm" : "text-white/70 hover:text-white"
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel("SMS")}
                    className={`rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      channel === "SMS" ? "bg-volt-400 text-ink-900 shadow-sm" : "text-white/70 hover:text-white"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>SMS</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Audience Segment Builder */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
              <Select
                label="Target Prospect Stage"
                value={leadStage}
                onChange={(val) => setLeadStage(val)}
                options={[
                  { value: "ALL", label: "All Active Leads" },
                  { value: "NEW", label: "New Inquiries" },
                  { value: "CONTACTED", label: "Contacted Leads" },
                  { value: "TRIAL_BOOKED", label: "Trial Booked" },
                  { value: "WON", label: "Converted Members" },
                ]}
              />

              <Select
                label="Membership Tier Filter"
                value={tier}
                onChange={(val) => setTier(val)}
                options={[
                  { value: "ALL", label: "All Tiers" },
                  { value: "Gold", label: "Gold Plan Leads" },
                  { value: "Silver", label: "Silver Regular" },
                  { value: "Junior", label: "Junior Academy" },
                ]}
              />
            </div>

            {/* Subject Line (if Email) */}
            {channel === "EMAIL" && (
              <Input
                label="Email Subject Line *"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Complimentary Padel Coaching Session"
              />
            )}

            {/* Message Body & Merge Tags */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-medium text-white/80">Message Body</label>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-white/50 text-[11px]">Insert Tag:</span>
                  <button
                    type="button"
                    onClick={() => insertTag("{first_name}")}
                    className="px-2 py-0.5 rounded bg-white/10 text-volt-300 hover:bg-white/20 text-[11px] font-mono"
                  >
                    {"{first_name}"}
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTag("{club_name}")}
                    className="px-2 py-0.5 rounded bg-white/10 text-volt-300 hover:bg-white/20 text-[11px] font-mono"
                  >
                    {"{club_name}"}
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTag("{offer_code}")}
                    className="px-2 py-0.5 rounded bg-white/10 text-volt-300 hover:bg-white/20 text-[11px] font-mono"
                  >
                    {"{offer_code}"}
                  </button>
                </div>
              </div>

              <textarea
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full rounded-2xl bg-white/8 border border-white/18 px-4 py-3 text-xs text-white placeholder-white/50 focus:border-volt-400 focus:ring-4 focus:ring-volt-400/25 transition-all outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTestModalOpen(true)}
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Send Test
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleLaunchCampaign}
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                Dispatch Campaign Now
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Live Preview Box (5 cols) */}
        <div className="lg:col-span-5 sticky top-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-volt-400" />
              Live Recipient Preview ({channel})
            </span>
            <span>Merged for: Rohan Kapadia</span>
          </div>

          <div className="rounded-2xl border border-white/20 bg-court-700/90 p-6 shadow-2xl space-y-4">
            {channel === "EMAIL" ? (
              <div className="space-y-4 text-xs">
                <div className="space-y-1 pb-3 border-b border-white/10 text-white/70">
                  <p>
                    <strong className="text-white">From:</strong> Champions Club &lt;outreach@championsclub.in&gt;
                  </p>
                  <p>
                    <strong className="text-white">To:</strong> rohan.kapadia@gmail.com
                  </p>
                  <p>
                    <strong className="text-white">Subject:</strong> {subject}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-court-600/80 border border-white/10 text-white/90 whitespace-pre-line leading-relaxed">
                  {livePreview}
                </div>
              </div>
            ) : (
              <div className="max-w-[280px] mx-auto p-4 rounded-2xl bg-court-800 border-2 border-white/20 shadow-inner space-y-2 text-xs">
                <div className="flex items-center justify-between text-[10px] text-white/40 pb-1 border-b border-white/10">
                  <span>SMS • Champions Club</span>
                  <span>Now</span>
                </div>
                <div className="bg-volt-400/20 border border-volt-400/30 text-white p-3 rounded-xl whitespace-pre-line leading-relaxed">
                  {livePreview}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sent Campaigns History */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-base font-semibold text-white">Campaign Performance & Delivery History</h3>
            <p className="text-xs text-white/50">Audience reach, engagement rates, and member conversions</p>
          </div>
          <span className="text-xs text-white/60">{campaigns.length} Total Campaigns</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/60 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Campaign</th>
                <th className="py-3 px-3">Channel</th>
                <th className="py-3 px-3">Date Sent</th>
                <th className="py-3 px-3 text-center">Recipients</th>
                <th className="py-3 px-3 text-center">Open Rate</th>
                <th className="py-3 px-3 text-center">Click Rate</th>
                <th className="py-3 px-3 text-right">Conversions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8 text-white">
              {campaigns.map((camp) => {
                const openPct = camp.recipientCount > 0 ? Math.round((camp.openCount / camp.recipientCount) * 100) : 0;
                const clickPct = camp.openCount > 0 ? Math.round((camp.clickCount / camp.openCount) * 100) : 0;

                return (
                  <tr key={camp.id} className="hover:bg-white/4 transition-colors">
                    <td className="py-3.5 px-3">
                      <div>
                        <p className="font-semibold text-white">{camp.title}</p>
                        <p className="text-[11px] text-white/50 line-clamp-1">{camp.subject}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white border border-white/14">
                        {camp.channel === "EMAIL" ? <Mail className="w-3 h-3 text-purple-400" /> : <MessageSquare className="w-3 h-3 text-amber-400" />}
                        {camp.channel}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-white/70">
                      {camp.sentAt ? new Date(camp.sentAt).toLocaleDateString("en-IN") : "Draft"}
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono font-semibold text-white/90">
                      {camp.recipientCount}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="font-semibold text-emerald-400">{openPct}%</span>
                        <span className="text-[10px] text-white/40">({camp.openCount})</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="font-semibold text-sky-400">{clickPct}%</span>
                        <span className="text-[10px] text-white/40">({camp.clickCount})</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <span className="inline-block px-2.5 py-1 rounded-full font-bold text-xs bg-volt-400/20 text-volt-300 border border-volt-400/30">
                        {camp.conversionCount} Leads Won
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Send Test Modal */}
      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title="Send Test Outreach Message"
      >
        <form onSubmit={handleSendTest} className="space-y-4 pt-2">
          <Input
            label={channel === "EMAIL" ? "Test Email Address" : "Test Phone Number"}
            value={testRecipient}
            onChange={(e) => setTestRecipient(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsTestModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Dispatch Test
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
