import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { Table, type Column } from "@/components/ui/Table";
import { useAdminConfigStore } from "../adminConfigStore";
import type { NotificationTemplate, NotificationTrigger, NotificationDeliveryLog } from "../types";
import {
  MailCheck,
  Mail,
  Smartphone,
  Bell,
  Send,
  Eye,
  Edit2,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { toast } from "@/components/ui/Toast";

const TRIGGER_LABELS: Record<NotificationTrigger, string> = {
  BOOKING_CONFIRMATION: "Booking Confirmation",
  BOOKING_REMINDER: "Booking Reminder (2h before)",
  BOOKING_CANCELLED: "Booking Cancellation & Refund",
  REGISTRATION_WELCOME: "New Member Welcome & QR Card",
  WAITLIST_OFFER: "Waitlist Slot Promotion",
  MEMBERSHIP_EXPIRY: "Membership Expiry Notice",
  PAYMENT_RECEIPT: "Tax Payment Receipt",
  ORDER_STATUS: "Pro Shop Order Ready / Dispatched",
  LOW_STOCK: "Inventory Low Stock Replenishment Alert",
  NEW_LEAD: "CRM New Inbound Inquiry Assigned",
  FOLLOWUP_DUE: "CRM Follow-up Reminder Due",
  LEAVE_DECISION: "HR Leave Approval / Rejection Note",
  PAYSLIP_READY: "Monthly Payslip Disbursed Notification",
  SCHEDULED_REPORT: "Automated Daily/Weekly Closing Flash",
};

export default function AdminNotificationTemplatesPage() {
  const {
    notificationTemplates,
    deliveryLogs,
    updateNotificationTemplate,
    sendTestNotification,
  } = useAdminConfigStore();

  const [selectedChannel, setSelectedChannel] = useState<"EMAIL" | "SMS_WHATSAPP" | "IN_APP">("EMAIL");
  const [selectedTrigger, setSelectedTrigger] = useState<NotificationTrigger>("BOOKING_CONFIRMATION");

  // Active Template being edited
  const currentTemplate = useMemo(() => {
    return (
      notificationTemplates.find(
        (t) => t.trigger === selectedTrigger && t.channel === selectedChannel
      ) || {
        id: `TMPL-NEW`,
        trigger: selectedTrigger,
        triggerLabel: TRIGGER_LABELS[selectedTrigger],
        channel: selectedChannel,
        subject: `${TRIGGER_LABELS[selectedTrigger]} Notification`,
        body: `Dear {{member_name}},\n\nThis is an automated notice regarding your club activity.\n\nWarm regards,\nThe Champions Club Concierge`,
        availableVariables: ["{{member_name}}", "{{court_name}}", "{{start_time}}", "{{booking_date}}"],
        active: true,
      }
    );
  }, [notificationTemplates, selectedTrigger, selectedChannel]);

  const [subjectText, setSubjectText] = useState(currentTemplate.subject || "");
  const [bodyText, setBodyText] = useState(currentTemplate.body);

  // Sync editor when trigger or channel changes
  const handleSelectTrigger = (trigger: NotificationTrigger) => {
    setSelectedTrigger(trigger);
    const tmpl = notificationTemplates.find((t) => t.trigger === trigger && t.channel === selectedChannel);
    if (tmpl) {
      setSubjectText(tmpl.subject || "");
      setBodyText(tmpl.body);
    } else {
      setSubjectText(`${TRIGGER_LABELS[trigger]} Notification`);
      setBodyText(`Dear {{member_name}},\n\nNotification regarding ${TRIGGER_LABELS[trigger]}.\n\nConcierge Desk`);
    }
  };

  const handleSelectChannel = (channel: "EMAIL" | "SMS_WHATSAPP" | "IN_APP") => {
    setSelectedChannel(channel);
    const tmpl = notificationTemplates.find((t) => t.trigger === selectedTrigger && t.channel === channel);
    if (tmpl) {
      setSubjectText(tmpl.subject || "");
      setBodyText(tmpl.body);
    } else {
      setSubjectText(`${TRIGGER_LABELS[selectedTrigger]} Notification`);
      setBodyText(`Dear {{member_name}},\n\nNotification regarding ${TRIGGER_LABELS[selectedTrigger]}.\n\nConcierge Desk`);
    }
  };

  // Test Send Dialog
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState(
    selectedChannel === "EMAIL" ? "director@championsclub.in" : "+91 98200 99001"
  );

  const handleSaveTemplate = () => {
    updateNotificationTemplate(currentTemplate.id, {
      ...currentTemplate,
      subject: selectedChannel === "EMAIL" ? subjectText : undefined,
      body: bodyText,
    });
  };

  const insertVariable = (variable: string) => {
    setBodyText((prev) => `${prev} ${variable}`);
  };

  const handleSendTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient.trim()) return;
    sendTestNotification(currentTemplate.id, testRecipient.trim());
    setIsTestModalOpen(false);
  };

  // Live preview replacement
  const previewRender = useMemo(() => {
    return bodyText
      .replace(/{{member_name}}/g, "Pratham Patel")
      .replace(/{{member_id}}/g, "CC-000123")
      .replace(/{{court_name}}/g, "Tennis Court 2 (Synthetic)")
      .replace(/{{sport_name}}/g, "Tennis")
      .replace(/{{booking_date}}/g, "05 Oct 2026")
      .replace(/{{start_time}}/g, "18:00")
      .replace(/{{end_time}}/g, "19:00")
      .replace(/{{amount_paid}}/g, "₹1,200")
      .replace(/{{days_left}}/g, "15")
      .replace(/{{expiry_date}}/g, "20 Oct 2026")
      .replace(/{{tier_name}}/g, "Gold All-Access");
  }, [bodyText]);

  const deliveryColumns: Column<NotificationDeliveryLog>[] = [
    {
      key: "time",
      header: "Timestamp",
      render: (log) => (
        <span className="font-mono text-xs text-white/70">
          {new Date(log.sentAt).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
      ),
    },
    {
      key: "trigger",
      header: "Trigger Event",
      render: (log) => (
        <span className="text-xs font-semibold text-white">
          {TRIGGER_LABELS[log.trigger] || log.trigger}
        </span>
      ),
    },
    {
      key: "channel",
      header: "Channel",
      render: (log) => (
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/8 text-white/80">
          {log.channel}
        </span>
      ),
    },
    {
      key: "recipient",
      header: "Recipient Destination",
      render: (log) => (
        <div className="flex flex-col text-xs">
          <span className="font-medium text-white">{log.recipientName}</span>
          <span className="font-mono text-[11px] text-white/50">{log.recipient}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (log) => (
        <StatusPill variant={log.status === "DELIVERED" ? "success" : "warning"}>
          {log.status === "DELIVERED" ? "Delivered" : "Queued"}
        </StatusPill>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Templates & Delivery Engine"
        subtitle="Manage omnichannel notification copy across Email, SMS/WhatsApp, and In-App push. Live token interpolation with automated audit delivery logs."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trigger Selector List */}
        <Card className="p-4 bg-court-500 border-white/14 lg:col-span-1 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/60 px-2">
            System Event Triggers (14)
          </h3>
          <div className="max-h-[560px] overflow-y-auto space-y-1 pr-1">
            {(Object.keys(TRIGGER_LABELS) as NotificationTrigger[]).map((trig) => {
              const isSelected = selectedTrigger === trig;
              return (
                <button
                  key={trig}
                  onClick={() => handleSelectTrigger(trig)}
                  className={`w-full text-left p-3 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-volt-400 text-ink-900 font-semibold shadow-md"
                      : "text-white/80 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <span className="truncate">{TRIGGER_LABELS[trig]}</span>
                  {isSelected && <CheckCircle2 className="size-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Editor and Live Preview */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-court-500 border-white/14 space-y-5">
            {/* Channel Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white">
                  {TRIGGER_LABELS[selectedTrigger]}
                </h3>
                <span className="text-xs text-volt-400 font-mono">
                  Trigger ID: {selectedTrigger}
                </span>
              </div>

              {/* Channel Selector */}
              <div className="flex rounded-lg bg-white/6 p-1 border border-white/10">
                <button
                  onClick={() => handleSelectChannel("EMAIL")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                    selectedChannel === "EMAIL"
                      ? "bg-volt-400 text-ink-900 shadow-sm"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  <Mail className="size-3.5" />
                  <span>Email</span>
                </button>
                <button
                  onClick={() => handleSelectChannel("SMS_WHATSAPP")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                    selectedChannel === "SMS_WHATSAPP"
                      ? "bg-volt-400 text-ink-900 shadow-sm"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  <Smartphone className="size-3.5" />
                  <span>SMS / WhatsApp</span>
                </button>
                <button
                  onClick={() => handleSelectChannel("IN_APP")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                    selectedChannel === "IN_APP"
                      ? "bg-volt-400 text-ink-900 shadow-sm"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  <Bell className="size-3.5" />
                  <span>In-App</span>
                </button>
              </div>
            </div>

            {/* Email Subject Line (if channel is email) */}
            {selectedChannel === "EMAIL" && (
              <Input
                label="Email Subject Line *"
                value={subjectText}
                onChange={(e) => setSubjectText(e.target.value)}
                placeholder="e.g. Confirmed: {{court_name}} on {{booking_date}}"
              />
            )}

            {/* Variable Insertion Chips */}
            <div>
              <span className="text-xs font-medium text-white/70 mb-1.5 block">
                Click to Insert Dynamic Token:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentTemplate.availableVariables.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVariable(v)}
                    className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-white/8 hover:bg-volt-400 hover:text-ink-900 text-volt-300 border border-white/10 transition-colors"
                  >
                    + {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Body Editor */}
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Template Message Body *
              </label>
              <textarea
                rows={6}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/8 border border-white/18 text-xs text-white font-mono leading-relaxed placeholder-white/40 focus:outline-none focus:border-volt-400"
              />
            </div>

            {/* Live Render Preview */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Eye className="size-3.5" /> Live Render Preview (Sample Member Context)
              </span>
              {selectedChannel === "EMAIL" && (
                <div className="pb-2 border-b border-white/10 text-xs">
                  <strong className="text-white/60">Subject: </strong>
                  <span className="text-white font-semibold">
                    {subjectText.replace(/{{court_name}}/g, "Tennis Court 2").replace(/{{booking_date}}/g, "05 Oct 2026")}
                  </span>
                </div>
              )}
              <div className="text-xs text-white/90 whitespace-pre-line leading-relaxed font-sans bg-court-700/60 p-3 rounded-xl border border-white/10">
                {previewRender}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setTestRecipient(
                    selectedChannel === "EMAIL" ? "director@championsclub.in" : "+91 98200 99001"
                  );
                  setIsTestModalOpen(true);
                }}
                className="gap-2 text-xs"
              >
                <Send className="size-3.5" />
                <span>Send Test Message</span>
              </Button>

              <Button variant="primary" size="sm" onClick={handleSaveTemplate} className="gap-2">
                <CheckCircle2 className="size-4" />
                <span>Save Template</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Delivery Logs Table */}
      <Card className="p-0 overflow-hidden bg-court-500 border-white/14">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-volt-400" />
            <h3 className="text-sm font-semibold text-white">Recent Transmission Audit Log</h3>
          </div>
          <span className="text-xs text-white/50">{deliveryLogs.length} transmissions logged</span>
        </div>
        <Table
          data={deliveryLogs}
          columns={deliveryColumns}
          keyExtractor={(item) => item.id}
          emptyTitle="No Delivery Records"
          emptySubtitle="No notification transmissions recorded."
        />
      </Card>

      {/* Send Test Modal */}
      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title="Send Test Transmission"
        subtitle={`Dispatch a simulated ${selectedChannel} message using live club data.`}
      >
        <form onSubmit={handleSendTest} className="space-y-4">
          <Input
            label={selectedChannel === "EMAIL" ? "Destination Email Address *" : "Destination Mobile Phone *"}
            value={testRecipient}
            onChange={(e) => setTestRecipient(e.target.value)}
            required
            autoFocus
          />

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70">
            Simulated dispatch records immediately to the delivery audit ledger without consuming external SMS gateway units.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setIsTestModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="gap-2">
              <Send className="size-3.5" />
              <span>Dispatch Now</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
