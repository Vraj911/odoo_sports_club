import { ArrowLeft } from "lucide-react";
import { AppLink } from "@/app/router/links";
import { Button } from "@/components/ui/Button";
import { useMember } from "@/features/member/memberStore";
import { InvoicePreview } from "@/features/member/components/InvoicePreview";
import { useToast } from "@/components/ui/Toast";

export default function InvoiceDetailPage({ params }: { params?: Record<string, string> | undefined }) {
  const { invoices, profile, payInvoice } = useMember();
  const toast = useToast();

  const invoiceId =
    params?.["id"] ??
    (typeof window !== "undefined"
      ? window.location.pathname.split("/").pop() ?? ""
      : "");

  const invoice = invoices.find(
    (inv) =>
      inv.id.toLowerCase() === invoiceId.toLowerCase() ||
      inv.number.toLowerCase() === invoiceId.toLowerCase()
  );

  if (!invoice) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-chalk">Invoice #{invoiceId} Not Found</h2>
        <AppLink to="/app/invoices">
          <Button variant="secondary" leftIcon={<ArrowLeft className="size-4" />}>
            Back to Invoices
          </Button>
        </AppLink>
      </div>
    );
  }

  const handlePayNow = () => {
    payInvoice(invoice.id);
    toast.success("Payment Received", `Invoice #${invoice.number} paid successfully.`);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top back navigation */}
      <div className="flex items-center gap-3">
        <AppLink
          to="/app/invoices"
          className="flex size-9 items-center justify-center rounded-xl border border-chalk/14 bg-court-600 text-chalk hover:text-volt-400"
        >
          <ArrowLeft className="size-4" />
        </AppLink>
        <span className="text-xs font-mono text-chalk/60">
          Back to Billing & Invoices
        </span>
      </div>

      {/* Invoice Paper Component */}
      <InvoicePreview
        invoice={invoice}
        member={profile}
        onPayNow={handlePayNow}
      />
    </div>
  );
}
