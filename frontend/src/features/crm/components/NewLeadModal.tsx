import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useCan } from "@/lib/permissions";
import { User, Phone, Mail, Sparkles, Building, Calendar, FileText } from "lucide-react";
import { CRM_OWNERS } from "../sampleData";
import { crmActions } from "../crmStore";
import type { LeadSource } from "../types";

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (leadId: string) => void;
}

const SOURCE_OPTIONS = [
  { value: "PHONE", label: "Phone Enquiry" },
  { value: "WALK_IN", label: "Front Desk Walk-in" },
  { value: "WEBSITE", label: "Website Form" },
  { value: "REFERRAL", label: "Member Referral" },
  { value: "TRIAL", label: "Trial Booking" },
];

const INTEREST_OPTIONS = [
  { value: "Gold All-Access Annual", label: "Gold All-Access Annual (₹35,000)" },
  { value: "Silver Regular Padel", label: "Silver Regular Padel (₹22,000)" },
  { value: "Badminton Coaching Clinic", label: "Badminton Coaching Clinic (₹18,000)" },
  { value: "Junior Academy Tennis (<18)", label: "Junior Academy Tennis (<18) (₹14,000)" },
  { value: "Corporate Sports Pass", label: "Corporate Sports Pass (Custom)" },
  { value: "Cricket Automated Net Pass", label: "Cricket Automated Net Pass (₹15,000)" },
];

export function NewLeadModal({ isOpen, onClose, onSuccess }: NewLeadModalProps) {
  const can = useCan();
  const canManage = can("crm.leads.manage");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [source, setSource] = useState<LeadSource>("PHONE");
  const [interest, setInterest] = useState("Gold All-Access Annual");
  const [owner, setOwner] = useState(CRM_OWNERS[0].name);
  const [estimatedValue, setEstimatedValue] = useState("35000");
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!name.trim()) errs.name = "Full name is required";
    if (!phone.trim()) errs.phone = "Phone number is required";
    if (!email.trim() || !email.includes("@")) errs.email = "Valid email is required";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const created = crmActions.addLead({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        companyName: companyName.trim() || undefined,
        source,
        interest,
        owner: canManage ? owner : "Priya Sharma",
        estimatedValue: Number(estimatedValue) || 25000,
        nextFollowUp: nextFollowUp ? new Date(nextFollowUp).toISOString() : undefined,
        notes: notes.trim() || undefined,
      });

      setIsSubmitting(false);
      onClose();
      if (onSuccess) onSuccess(created.id);

      // Reset form
      setName("");
      setPhone("");
      setEmail("");
      setCompanyName("");
      setNotes("");
      setNextFollowUp("");
      setErrors({});
    }, 300);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-volt-400" />
          <span>Create New Enquiry / Lead</span>
        </div>
      }
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Prospect Full Name *"
            placeholder="e.g. Rahul Sen"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            leftIcon={<User className="w-4 h-4 text-white/50" />}
          />

          <Input
            label="Phone Number *"
            placeholder="e.g. +91 98200 12345"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
            leftIcon={<Phone className="w-4 h-4 text-white/50" />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Email Address *"
            type="email"
            placeholder="e.g. rahul@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            leftIcon={<Mail className="w-4 h-4 text-white/50" />}
          />

          <Input
            label="Company / Organisation (Optional)"
            placeholder="e.g. Wipro Bangalore"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            leftIcon={<Building className="w-4 h-4 text-white/50" />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Enquiry Source"
            value={source}
            onChange={(val) => setSource(val as LeadSource)}
            options={SOURCE_OPTIONS}
          />

          <Select
            label="Primary Interest"
            value={interest}
            onChange={(val) => {
              setInterest(val);
              if (val.includes("35,000")) setEstimatedValue("35000");
              else if (val.includes("22,000")) setEstimatedValue("22000");
              else if (val.includes("18,000")) setEstimatedValue("18000");
              else if (val.includes("14,000")) setEstimatedValue("14000");
              else if (val.includes("15,000")) setEstimatedValue("15000");
            }}
            options={INTEREST_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {canManage ? (
            <Select
              label="Assigned Sales Owner"
              value={owner}
              onChange={(val) => setOwner(val)}
              options={CRM_OWNERS.map((o) => ({ value: o.name, label: `${o.name} (${o.role})` }))}
            />
          ) : (
            <Input
              label="Assigned Sales Owner"
              value="Front Desk Team"
              disabled
              hint="CRM group assigns personal owners"
            />
          )}

          <Input
            label="Estimated Deal Value (₹)"
            type="number"
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Follow-up Date"
            type="date"
            value={nextFollowUp}
            onChange={(e) => setNextFollowUp(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4 text-white/50" />}
          />

          <div>
            <label className="block text-[13px] font-medium text-white/80 mb-1.5">
              Enquiry Notes / Requirements
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Asked for weekend morning coaching batch..."
              rows={2}
              className="w-full rounded-2xl bg-white/8 border border-white/18 px-4 py-2.5 text-sm text-white placeholder-white/50 focus:border-volt-400 focus:ring-4 focus:ring-volt-400/25 transition-all outline-none resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            Create Lead
          </Button>
        </div>
      </form>
    </Modal>
  );
}
