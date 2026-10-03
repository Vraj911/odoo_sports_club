import { useState } from "react";
import { IdCard, Download, Smartphone, QrCode, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { DigitalCard } from "@/features/member/components/DigitalCard";
import { useMember } from "@/features/member/memberStore";

export default function DigitalCardPage() {
  const { profile } = useMember();
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPNG = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      toast.success("Card Exported", `Saved ${profile.id}-pass.png for offline desk check-in.`);
    }, 600);
  };

  const handleAddToAppleWallet = () => {
    toast.info("Wallet Pass", "Apple Wallet / Google Wallet pass file downloaded (.pkpass).");
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Top Header */}
      <div className="border-b border-chalk/10 pb-6">
        <div className="flex items-center gap-2.5">
          <IdCard className="size-6 text-volt-400" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-chalk">
            Digital Membership Card
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-chalk/70 mt-1">
          Your official digital pass for turnstile access, equipment checkout, courtside lounge tabs, and front desk check-in.
        </p>
      </div>

      {/* Main Digital Card Viewport */}
      <div className="flex flex-col items-center justify-center p-4 sm:p-8 rounded-[32px] border border-chalk/14 bg-court-600/30 backdrop-blur-sm">
        <DigitalCard profile={profile} className="w-full max-w-lg shadow-2xl" />

        <p className="mt-4 text-xs text-chalk/60 flex items-center gap-1.5 font-mono">
          <QrCode className="size-3.5 text-volt-400" />
          <span>Tap the QR code on the card above for turnstile brightness boost</span>
        </p>
      </div>

      {/* Quick Actions & Wallet Integration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-chalk/14 bg-court-500 p-5 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-chalk text-sm">
            <Download className="size-4 text-volt-400" />
            <span>Save Offline Image</span>
          </div>
          <p className="text-xs text-chalk/60 leading-relaxed">
            Download a high-resolution PNG image of your card with embedded QR code to store in your photo gallery.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadPNG}
            loading={downloading}
            className="w-full"
          >
            Download PNG Pass
          </Button>
        </div>

        <div className="rounded-2xl border border-chalk/14 bg-court-500 p-5 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-chalk text-sm">
            <Smartphone className="size-4 text-volt-400" />
            <span>Add to Digital Wallet</span>
          </div>
          <p className="text-xs text-chalk/60 leading-relaxed">
            Sync pass with Apple Wallet or Google Wallet for lockscreen NFC check-in at club turnstiles.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddToAppleWallet}
            className="w-full"
          >
            Add to Phone Wallet
          </Button>
        </div>
      </div>

      {/* Instructions & Features */}
      <div className="rounded-2xl border border-chalk/10 bg-court-600/40 p-5 text-xs text-chalk/70 space-y-2">
        <span className="font-semibold text-chalk text-sm block">How to use your Digital Pass:</span>
        <ul className="list-disc pl-5 space-y-1.5 leading-relaxed">
          <li><strong>Turnstiles:</strong> Hold phone with QR code facing the green laser scanner at court gates.</li>
          <li><strong>Pro Shop:</strong> Present at counter to automatically apply your {profile.entitlements.shopDiscount}% member discount.</li>
          <li><strong>Courtside Bar:</strong> Show waiter to charge orders directly to your monthly room/tab account.</li>
        </ul>
      </div>
    </div>
  );
}
