import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Table, type Column } from "@/components/ui/Table";
import { useFinanceStore, addVendor } from "../financeStore";
import type { Vendor } from "../types";
import { PeriodLockedBanner } from "../components/PeriodLockedBanner";
import { PeriodLockModal } from "../components/PeriodLockModal";
import { formatINR } from "@/components/shared/Money";
import { useGo } from "@/app/router/links";
import {
  Building,
  Plus,
  Mail,
  Phone,
  MapPin,
  FileText,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function FinanceVendorsPage() {
  const go = useGo();
  const { vendors } = useFinanceStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [gstin, setGstin] = useState("");
  const [category, setCategory] = useState("Court Infrastructure");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentTermsDays, setPaymentTermsDays] = useState("15");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contactPerson.trim()) return;

    addVendor({
      name: name.trim(),
      gstin: gstin.trim(),
      category: category.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      paymentTermsDays: parseInt(paymentTermsDays, 10) || 15,
    });

    setIsAddModalOpen(false);
    setName("");
    setGstin("");
    setContactPerson("");
    setEmail("");
    setPhone("");
    setAddress("");
  };

  const columns: Column<Vendor>[] = [
    {
      key: "name",
      header: "Vendor / Category",
      render: (v) => (
        <div>
          <span className="font-bold text-sm text-chalk">{v.name}</span>
          <p className="text-[11px] text-chalk/60">{v.category}</p>
        </div>
      ),
    },
    {
      key: "gstin",
      header: "GSTIN",
      render: (v) => (
        <span className="font-mono text-xs font-semibold text-amber-300">
          {v.gstin || "Unregistered"}
        </span>
      ),
    },
    {
      key: "contact",
      header: "Contact Person",
      render: (v) => (
        <div>
          <span className="font-medium text-chalk text-xs">{v.contactPerson}</span>
          <div className="flex items-center gap-2 text-[11px] text-chalk/50 font-mono">
            <span>{v.phone}</span>
            <span>•</span>
            <span className="truncate max-w-[120px]">{v.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "terms",
      header: "Terms",
      render: (v) => (
        <span className="text-xs text-chalk/70 font-mono">Net {v.paymentTermsDays}d</span>
      ),
    },
    {
      key: "totalBilled",
      header: "Total Billed",
      align: "right",
      render: (v) => (
        <span className="font-mono text-xs font-medium text-chalk">
          {formatINR(v.totalBilled)}
        </span>
      ),
    },
    {
      key: "outstanding",
      header: "Outstanding Due",
      align: "right",
      render: (v) => (
        <span
          className={`font-mono text-xs font-bold ${
            v.totalOutstanding > 0 ? "text-rose-400" : "text-emerald-400"
          }`}
        >
          {formatINR(v.totalOutstanding)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      align: "right",
      render: (v) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => go("/finance/vendor-bills")}
          className="h-7 px-2.5 text-xs gap-1"
        >
          <FileText className="size-3" /> Bills
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors Directory"
        subtitle="Supplier master records, GSTIN identification, procurement terms, and accounts payable balances (FIN-10)."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => go("/finance/vendor-bills")}
              className="gap-1.5"
            >
              <FileText className="size-3.5" /> Vendor Bills
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="gap-1.5"
            >
              <Plus className="size-3.5" /> Add Vendor
            </Button>
          </div>
        }
      />

      <PeriodLockedBanner />
      <PeriodLockModal />

      <Table
        columns={columns}
        data={vendors}
        keyExtractor={(v) => v.id}
        emptyTitle="No vendors registered"
        emptySubtitle="Add your sports equipment, turf maintenance, or utility vendors."
      />

      {/* Add Vendor Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Building className="size-4 text-volt-400" />
            <span>Register New Vendor</span>
          </div>
        }
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-chalk/80 mb-1">
              Vendor Legal Name <span className="text-danger">*</span>
            </label>
            <Input
              placeholder="e.g. Wilson Sporting Goods India Pvt Ltd"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-chalk/80 mb-1">Vendor GSTIN</label>
              <Input
                placeholder="e.g. 27AABCP8810K1ZZ"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-semibold text-chalk/80 mb-1">Category</label>
              <Input
                placeholder="e.g. Court Infrastructure"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-chalk/80 mb-1">
                Contact Person <span className="text-danger">*</span>
              </label>
              <Input
                placeholder="e.g. Deepak Chauhan"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-chalk/80 mb-1">Phone</label>
              <Input
                placeholder="+91 98200..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-semibold text-chalk/80 mb-1">Email</label>
              <Input
                type="email"
                placeholder="deepak@proturf.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-chalk/80 mb-1">Office / Warehouse Address</label>
              <Input
                placeholder="e.g. Thane Industrial Estate, Mumbai"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-semibold text-chalk/80 mb-1">Payment Terms (Days)</label>
              <Input
                type="number"
                min="0"
                value={paymentTermsDays}
                onChange={(e) => setPaymentTermsDays(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-chalk/10">
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="gap-2">
              <CheckCircle2 className="size-4" /> Save Vendor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
