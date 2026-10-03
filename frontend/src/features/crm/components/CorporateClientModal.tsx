import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Briefcase, Building, Mail, Phone, MapPin, Receipt, ShieldCheck } from "lucide-react";
import { crmActions } from "../crmStore";
import type { Lead, CorporateClientPayload } from "../types";

interface CorporateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onSuccess?: () => void;
}

const RATE_PLAN_OPTIONS = [
  { value: "CORP_ANNUAL", label: "Corporate Annual Pass (₹1,95,000/yr - 20 pax)" },
  { value: "CORP_TOURNAMENT", label: "Tournament / League Sponsorship (₹1,50,000)" },
  { value: "EXECUTIVE_WELLNESS", label: "Executive Tier Wellness Credits (₹2,50,000)" },
];

export function CorporateClientModal({ isOpen, onClose, lead, onSuccess }: CorporateClientModalProps) {
  const [companyName, setCompanyName] = useState(lead.companyName || lead.name);
  const [contactName, setContactName] = useState(lead.name);
  const [email, setEmail] = useState(lead.email);
  const [phone, setPhone] = useState(lead.phone);
  const [gstin, setGstin] = useState("29AABCU9603R1Z7");
  const [billingAddress, setBillingAddress] = useState("Level 4, Prestige Tech Park, Marathahalli-Sarjapur Ring Rd");
  const [city, setCity] = useState("Bengaluru");
  const [pincode, setPincode] = useState("560103");
  const [ratePlan, setRatePlan] = useState<CorporateClientPayload["ratePlan"]>("CORP_ANNUAL");
  const [notes, setNotes] = useState("Approved under CCMS Corporate Wellness Tier.");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!companyName.trim()) errs.companyName = "Company name is required";
    if (!gstin.trim() || gstin.length < 15) errs.gstin = "Valid 15-digit GSTIN is required";
    if (!billingAddress.trim()) errs.billingAddress = "Billing address is required";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      crmActions.convertLeadToBusinessClient(lead.id, {
        companyName,
        contactName,
        email,
        phone,
        gstin,
        billingAddress,
        city,
        pincode,
        ratePlan,
        notes,
      });

      setLoading(false);
      onClose();
      if (onSuccess) onSuccess();
    }, 400);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-volt-400" />
          <span>Convert Lead to Corporate Business Client</span>
        </div>
      }
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="p-3 bg-court-600/70 border border-white/10 rounded-2xl text-xs text-white/80 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-volt-400 flex-shrink-0" />
          <span>
            Converting this lead will mark <strong>{lead.name}</strong> as <strong>WON</strong> and register their business billing account in the Finance module.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Corporate Entity / Company Name *"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            error={errors.companyName}
            leftIcon={<Building className="w-4 h-4 text-white/50" />}
          />

          <Input
            label="Key Contact Representative *"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            leftIcon={<Briefcase className="w-4 h-4 text-white/50" />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Contact Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-white/50" />}
          />

          <Input
            label="Contact Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone className="w-4 h-4 text-white/50" />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="GSTIN Identification Number *"
            placeholder="29AABCU9603R1Z7"
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            error={errors.gstin}
            leftIcon={<Receipt className="w-4 h-4 text-white/50" />}
          />

          <Select
            label="Corporate Rate Plan"
            value={ratePlan}
            onChange={(val) => setRatePlan(val as CorporateClientPayload["ratePlan"])}
            options={RATE_PLAN_OPTIONS}
          />
        </div>

        <Input
          label="Registered Billing Address *"
          value={billingAddress}
          onChange={(e) => setBillingAddress(e.target.value)}
          error={errors.billingAddress}
          leftIcon={<MapPin className="w-4 h-4 text-white/50" />}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input label="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-white/80 mb-1.5">
            Agreement Terms / Billing Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-2xl bg-white/8 border border-white/18 px-4 py-2.5 text-sm text-white placeholder-white/50 focus:border-volt-400 focus:ring-4 focus:ring-volt-400/25 transition-all outline-none resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Create Business Client & Mark Won
          </Button>
        </div>
      </form>
    </Modal>
  );
}
