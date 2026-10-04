import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Upload,
  Shield,
  Bell,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Save,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useMember } from "@/features/member/memberStore";

const NOTIFICATION_TRIGGERS = [
  { key: "bookings", label: "Court Booking Confirmations & Reminders" },
  { key: "social", label: "Friday Social Play Invitations & Open Spots" },
  { key: "bar", label: "Courtside Bar & Kitchen Tab Charges" },
  { key: "billing", label: "Membership Renewal & Tax Invoices" },
  { key: "shop", label: "Pro Shop Order Updates & Pickup Notices" },
];

export default function ProfilePage() {
  const { profile, updateProfile, updateNotificationPreference } = useMember();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    address: profile.address || "",
    emergencyName: profile.emergencyContact?.name || "",
    emergencyPhone: profile.emergencyContact?.phone || "",
    emergencyRel: profile.emergencyContact?.relationship || "",
  });

  useEffect(() => {
    setFormData({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      address: profile.address || "",
      emergencyName: profile.emergencyContact?.name || "",
      emergencyPhone: profile.emergencyContact?.phone || "",
      emergencyRel: profile.emergencyContact?.relationship || "",
    });
  }, [profile.name, profile.email, profile.phone, profile.address]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePersonal = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      updateProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        emergencyContact: {
          name: formData.emergencyName,
          phone: formData.emergencyPhone,
          relationship: formData.emergencyRel,
        },
      });
      setIsSaving(false);
      toast.success("Profile Updated", "Your contact and emergency details were saved.");
    }, 400);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateProfile({ avatar: url });
      toast.success("Photo Updated", "Your profile photo has been refreshed.");
    }
  };

  const handleDownloadData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = `CCMS-Member-Data-${profile.id}.json`;
    a.click();
    setDownloadModalOpen(false);
    toast.info("Data Export Complete", "Your personal data export was downloaded as JSON.");
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="border-b border-chalk/10 pb-6">
        <div className="flex items-center gap-2.5">
          <User className="size-6 text-volt-400" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-chalk">
            Member Profile & Preferences
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-chalk/70 mt-1">
          Manage your personal records, guardian verification, notification channels, and privacy rights.
        </p>
      </div>

      {/* ── Photo Upload & Avatar ── */}
      <div className="rounded-[24px] border border-chalk/14 bg-court-500 p-6 sm:p-7 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group">
          <img
            src={profile.avatar}
            alt={profile.name}
            className="size-24 rounded-2xl border-2 border-volt-400 object-cover shadow-xl"
          />
          <label className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Upload className="size-5 text-white" />
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </label>
        </div>

        <div className="space-y-1 text-center sm:text-left flex-1">
          <h3 className="text-lg font-bold text-chalk">{profile.name}</h3>
          <p className="text-xs text-chalk/60 font-mono">
            Member ID: {profile.id} · Member since {profile.memberSince}
          </p>
          <p className="text-[11px] text-chalk/50 pt-1">
            Accepts JPG, PNG up to 5MB. Photo is printed on digital cards and used at turnstiles.
          </p>
        </div>
      </div>

      {/* ── Section: Personal Information ── */}
      <form onSubmit={handleSavePersonal} className="rounded-[24px] border border-chalk/14 bg-court-500 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-chalk/10 pb-3">
          <h3 className="text-base font-bold text-chalk uppercase tracking-wider text-xs">
            Personal Details
          </h3>
          <span className="text-[11px] text-chalk/50 font-mono">
            Member Ref: #{profile.id}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Legal Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Date of Birth (Read-only for age verification)"
            value={profile.dob}
            readOnly
            leftIcon={<Calendar className="size-4" />}
            className="opacity-70 cursor-not-allowed font-mono"
          />

          <Input
            label="Primary Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            leftIcon={<Mail className="size-4" />}
            required
          />

          <Input
            label="Mobile Phone Number"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            leftIcon={<Phone className="size-4" />}
            required
          />

          <div className="sm:col-span-2">
            <Input
              label="Residential Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              leftIcon={<MapPin className="size-4" />}
            />
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="pt-4 border-t border-chalk/10 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-volt-400">
            Emergency Contact Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Contact Name"
              value={formData.emergencyName}
              onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
            />
            <Input
              label="Relationship"
              value={formData.emergencyRel}
              onChange={(e) => setFormData({ ...formData, emergencyRel: e.target.value })}
            />
            <Input
              label="Emergency Phone"
              value={formData.emergencyPhone}
              onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" loading={isSaving} leftIcon={<Save className="size-4" />}>
            Save Changes
          </Button>
        </div>
      </form>

      {/* ── Junior: Guardian Block (Conditional if Junior tier) ── */}
      {profile.guardian && (
        <div className="rounded-[24px] border border-volt-400/30 bg-court-600/60 p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="size-5 text-volt-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-chalk">
                Junior Membership Guardian Record
              </h3>
            </div>
            <Badge variant="success" icon={<CheckCircle2 className="size-3" />}>
              Consent Verified
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="rounded-xl bg-court-700/60 p-3 border border-chalk/8">
              <span className="text-chalk/50 block text-[10px] uppercase">Guardian Name</span>
              <span className="font-semibold text-chalk text-sm">{profile.guardian.name}</span>
            </div>
            <div className="rounded-xl bg-court-700/60 p-3 border border-chalk/8">
              <span className="text-chalk/50 block text-[10px] uppercase">Guardian Contact</span>
              <span className="font-semibold text-chalk text-sm">{profile.guardian.phone}</span>
            </div>
            <div className="rounded-xl bg-court-700/60 p-3 border border-chalk/8">
              <span className="text-chalk/50 block text-[10px] uppercase">Consent Status</span>
              <span className="font-semibold text-success text-sm flex items-center gap-1">
                <FileCheck className="size-4" /> Signed on {profile.guardian.consentDate}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Notification Preferences Matrix ── */}
      <div className="rounded-[24px] border border-chalk/14 bg-court-500 p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between border-b border-chalk/10 pb-3">
          <div>
            <h3 className="text-base font-bold text-chalk uppercase tracking-wider text-xs">
              Notification Preferences Matrix
            </h3>
            <p className="text-xs text-chalk/60 mt-0.5">
              Choose which channels receive automated club alerts
            </p>
          </div>
          <Bell className="size-5 text-volt-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-chalk/10 text-[11px] uppercase tracking-wider text-chalk/50">
                <th className="py-3 pr-4">Notification Event</th>
                <th className="py-3 px-4 text-center">Email</th>
                <th className="py-3 px-4 text-center">In-App</th>
                <th className="py-3 px-4 text-center">SMS / WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chalk/8">
              {NOTIFICATION_TRIGGERS.map((trigger) => {
                const prefs = profile.notificationPreferences[trigger.key] ?? {
                  email: true,
                  inApp: true,
                  sms: false,
                };
                return (
                  <tr key={trigger.key} className="hover:bg-white/4 transition-colors">
                    <td className="py-3.5 pr-4 font-medium text-chalk">
                      {trigger.label}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={prefs.email}
                        onChange={(e) =>
                          updateNotificationPreference(trigger.key, "email", e.target.checked)
                        }
                        className="size-4 rounded accent-volt-400 cursor-pointer"
                      />
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={prefs.inApp}
                        onChange={(e) =>
                          updateNotificationPreference(trigger.key, "inApp", e.target.checked)
                        }
                        className="size-4 rounded accent-volt-400 cursor-pointer"
                      />
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={prefs.sms}
                        onChange={(e) =>
                          updateNotificationPreference(trigger.key, "sms", e.target.checked)
                        }
                        className="size-4 rounded accent-volt-400 cursor-pointer"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Privacy & Account Rights ── */}
      <div className="rounded-[24px] border border-chalk/14 bg-court-500 p-6 sm:p-7 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-chalk">
          Privacy & Data Protection Rights (DPDP Act)
        </h3>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-chalk/10 pt-4">
          <div>
            <h4 className="text-sm font-semibold text-chalk">Download Personal Data</h4>
            <p className="text-xs text-chalk/60">Export all booking, invoice, and attendance records as JSON.</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDownloadModalOpen(true)}
            leftIcon={<Download className="size-4" />}
          >
            Download My Data
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-chalk/10 pt-4">
          <div>
            <h4 className="text-sm font-semibold text-danger">Request Account Deletion</h4>
            <p className="text-xs text-chalk/60">Permanently forfeit membership entitlements and remove personal data.</p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
            leftIcon={<Trash2 className="size-4" />}
          >
            Request Deletion
          </Button>
        </div>
      </div>

      {/* Download Data Confirmation Modal */}
      <Modal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        maxWidth="sm"
        title="Download Member Data"
        subtitle="Full JSON backup of profile and club history"
      >
        <div className="space-y-4 text-xs">
          <p className="text-chalk/80 leading-relaxed">
            Your export will include contact information, active and historical court bookings, payment receipts, and bar tab records.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setDownloadModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleDownloadData}>
              Download JSON File
            </Button>
          </div>
        </div>
      </Modal>

      {/* Deletion Request Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        maxWidth="md"
        title={
          <div className="flex items-center gap-2 text-danger">
            <AlertCircle className="size-5" />
            <span>Confirm Deletion Request</span>
          </div>
        }
        subtitle="This action initiates membership termination"
      >
        <div className="space-y-4 text-xs">
          <p className="text-chalk/80 leading-relaxed">
            Submitting this request will deactivate your access to courts, pro-rated refunds for remaining tenure will be calculated by the accountant, and turnstile tokens will be revoked.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setDeleteModalOpen(false);
                toast.error("Request Logged", "Account deletion ticket #DEL-8802 opened with Club Management.");
              }}
            >
              Confirm Deletion Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
