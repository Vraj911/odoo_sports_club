import { useState } from "react";
import {
  CreditCard,
  QrCode,
  Building2,
  Store,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Money } from "@/components/shared/Money";
import { cn } from "@/lib/cn";

interface SimulatedGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  orderId?: string;
  isPickup?: boolean;
  onPaymentSuccess: (method: string, transactionId: string) => void;
  onPaymentFailure: (reason: string) => void;
}

type PaymentMethodType = "upi" | "card" | "netbanking" | "counter";

export function SimulatedGatewayModal({
  isOpen,
  onClose,
  amount,
  orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
  isPickup = true,
  onPaymentSuccess,
  onPaymentFailure,
}: SimulatedGatewayModalProps) {
  const [method, setMethod] = useState<PaymentMethodType>("upi");
  const [upiVpa, setUpiVpa] = useState("member@okhdfcbank");
  const [cardNumber, setCardNumber] = useState("4532 •••• •••• 8921");
  const [cardExpiry, setCardExpiry] = useState("08/29");
  const [cardCvv, setCardCvv] = useState("•••");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "failure">("idle");
  const [failureMsg, setFailureMsg] = useState("");

  const handleSimulate = (success: boolean) => {
    setStatus("processing");
    setTimeout(() => {
      if (success) {
        setStatus("success");
        setTimeout(() => {
          const methodLabel =
            method === "upi"
              ? `UPI (${upiVpa})`
              : method === "card"
              ? `Credit Card (${cardNumber.slice(-4)})`
              : method === "netbanking"
              ? `Net Banking (${selectedBank})`
              : "Pay at Pro Shop Counter";
          const txnId = `TXN-${Date.now().toString(36).toUpperCase()}`;
          onPaymentSuccess(methodLabel, txnId);
        }, 800);
      } else {
        setStatus("failure");
        setFailureMsg("Transaction declined by issuing bank (Simulated Error: ERR_PAYMENT_GATEWAY_TIMEOUT)");
      }
    }, 1200);
  };

  const handleRetry = () => {
    setStatus("idle");
    setFailureMsg("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (status !== "processing") onClose();
      }}
      title="Secure Checkout Payment"
    >
      <div className="space-y-6">
        {/* Header Summary */}
        <div className="rounded-2xl bg-navy-800/80 p-4 border border-chalk/10 flex items-center justify-between">
          <div>
            <span className="text-xs text-chalk/60 font-medium">Order #{orderId}</span>
            <p className="text-xs text-chalk/40 mt-0.5">Champions Club Pro Shop</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-chalk/60">Amount Payable</span>
            <div className="text-xl font-bold font-mono text-volt-400">
              <Money amount={amount} />
            </div>
          </div>
        </div>

        {status === "processing" ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="size-10 animate-spin text-volt-400" />
            <div>
              <h4 className="text-base font-semibold text-chalk">Authorizing Payment...</h4>
              <p className="text-xs text-chalk/60 mt-1">
                Connecting securely with Indian Banking Network (NPCI/RBI 256-bit SSL)
              </p>
            </div>
          </div>
        ) : status === "success" ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
            <div className="size-12 rounded-full bg-success/20 flex items-center justify-center text-success">
              <CheckCircle2 className="size-7" />
            </div>
            <h4 className="text-lg font-bold text-chalk">Payment Verified!</h4>
            <p className="text-xs text-chalk/70">
              ₹{amount.toLocaleString("en-IN")} received. Generating order receipt...
            </p>
          </div>
        ) : status === "failure" ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="size-12 rounded-full bg-danger/20 flex items-center justify-center text-danger">
              <XCircle className="size-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-chalk">Payment Failed</h4>
              <p className="text-xs text-danger/90 mt-1 max-w-sm">{failureMsg}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={handleRetry}>
                Try Again
              </Button>
              <Button
                variant="danger"
                onClick={() => onPaymentFailure("Simulated user payment abort")}
              >
                Abort & Return
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-white/5 border border-chalk/10">
              <button
                type="button"
                onClick={() => setMethod("upi")}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs font-medium transition-all",
                  method === "upi"
                    ? "bg-volt-400 text-ink-900 font-semibold shadow-sm"
                    : "text-chalk/70 hover:text-chalk hover:bg-white/5"
                )}
              >
                <Smartphone className="size-4" />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod("card")}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs font-medium transition-all",
                  method === "card"
                    ? "bg-volt-400 text-ink-900 font-semibold shadow-sm"
                    : "text-chalk/70 hover:text-chalk hover:bg-white/5"
                )}
              >
                <CreditCard className="size-4" />
                <span>Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod("netbanking")}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs font-medium transition-all",
                  method === "netbanking"
                    ? "bg-volt-400 text-ink-900 font-semibold shadow-sm"
                    : "text-chalk/70 hover:text-chalk hover:bg-white/5"
                )}
              >
                <Building2 className="size-4" />
                <span>NetBank</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod("counter")}
                disabled={!isPickup}
                title={!isPickup ? "Only available for club pickup" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs font-medium transition-all",
                  !isPickup && "opacity-40 cursor-not-allowed",
                  method === "counter"
                    ? "bg-volt-400 text-ink-900 font-semibold shadow-sm"
                    : "text-chalk/70 hover:text-chalk hover:bg-white/5"
                )}
              >
                <Store className="size-4" />
                <span>At Desk</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="space-y-4 min-h-[160px]">
              {method === "upi" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-court-700/60 border border-chalk/10">
                    <div className="flex items-center gap-2">
                      <QrCode className="size-8 text-volt-400" />
                      <div>
                        <p className="text-xs font-semibold text-chalk">Scan via GPay / PhonePe / Paytm</p>
                        <p className="text-[11px] text-chalk/50 font-mono">UPI ID: ccms.proshop@yesbank</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-volt-400/20 text-volt-400 border border-volt-400/30">
                      INSTANT
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-chalk/70 font-medium">Or enter your VPA / UPI ID</label>
                    <input
                      type="text"
                      value={upiVpa}
                      onChange={(e) => setUpiVpa(e.target.value)}
                      placeholder="username@bank"
                      className="w-full h-11 px-3.5 rounded-xl bg-white/8 border border-chalk/18 text-sm text-chalk placeholder-chalk/40 focus:outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-400/20"
                    />
                  </div>
                </div>
              )}

              {method === "card" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs text-chalk/70 font-medium">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-white/8 border border-chalk/18 text-sm font-mono text-chalk focus:outline-none focus:border-volt-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-chalk/70 font-medium">Valid Thru</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-white/8 border border-chalk/18 text-sm font-mono text-chalk focus:outline-none focus:border-volt-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-chalk/70 font-medium">CVV</label>
                      <input
                        type="password"
                        value={cardCvv}
                        maxLength={4}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-white/8 border border-chalk/18 text-sm font-mono text-chalk focus:outline-none focus:border-volt-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {method === "netbanking" && (
                <div className="space-y-2">
                  <label className="text-xs text-chalk/70 font-medium">Popular Banks</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank"].map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setSelectedBank(bank)}
                        className={cn(
                          "p-2.5 rounded-xl border text-left text-xs font-medium transition-all",
                          selectedBank === bank
                            ? "bg-volt-400/15 border-volt-400 text-volt-300"
                            : "bg-white/5 border-chalk/10 text-chalk/80 hover:bg-white/8"
                        )}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {method === "counter" && (
                <div className="p-4 rounded-xl bg-court-700/60 border border-chalk/10 space-y-2">
                  <div className="flex items-center gap-2 text-volt-400">
                    <Store className="size-5" />
                    <span className="text-sm font-semibold">Pay at Pro Shop Desk</span>
                  </div>
                  <p className="text-xs text-chalk/70 leading-relaxed">
                    Reserve items now and pay via Cash, Card, or UPI directly at the Pro Shop front desk when collecting your order.
                  </p>
                  <div className="text-[11px] text-chalk/50 flex items-center gap-1.5 pt-1">
                    <ShieldCheck className="size-3.5 text-volt-400" />
                    Stock is reserved for you upon order confirmation.
                  </div>
                </div>
              )}
            </div>

            {/* Simulation Trigger Bar */}
            <div className="pt-2 border-t border-chalk/10 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-chalk/50">
                <span>Simulated Payment Gateway</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="size-3 text-volt-400" /> Test Mode
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handleSimulate(true)}
                  leftIcon={<CheckCircle2 className="size-4" />}
                >
                  Simulate Success
                </Button>
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={() => handleSimulate(false)}
                  leftIcon={<XCircle className="size-4" />}
                >
                  Simulate Failure
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
