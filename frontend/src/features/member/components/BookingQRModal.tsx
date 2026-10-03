import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Sparkles, CheckCircle2, ShieldCheck, Download } from "lucide-react";
import type { Booking } from "@/features/booking/types";

export interface BookingQRModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BookingQRModal({ booking, isOpen, onClose }: BookingQRModalProps) {
  if (!booking) return null;

  const qrValue = JSON.stringify({
    bookingId: booking.id,
    court: booking.courtName,
    date: booking.date,
    time: `${booking.startTime}-${booking.endTime}`,
    memberId: booking.memberId,
    code: booking.checkinCode ?? `CC-${booking.id}`,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      title={
        <div className="flex items-center gap-2 text-volt-400">
          <QrCode className="size-5 shrink-0" />
          <span>Reception Check-In QR</span>
        </div>
      }
      subtitle={`Booking #${booking.id} · ${booking.courtName}`}
    >
      <div className="flex flex-col items-center text-center gap-4">
        {/* White container for QR Code high-contrast scan */}
        <div className="rounded-2xl bg-white p-5 shadow-2xl ring-4 ring-volt-400/20">
          <QRCodeSVG
            value={qrValue}
            size={190}
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Check-in Code PIN */}
        <div className="w-full rounded-xl border border-chalk/14 bg-court-700/60 p-3 text-xs">
          <span className="text-chalk/60 block text-[11px] uppercase tracking-wider">Fast Desk PIN</span>
          <span className="font-mono text-lg font-bold tracking-widest text-volt-400">
            {booking.checkinCode ?? `CC-${booking.id.replace("BK-", "")}`}
          </span>
        </div>

        {/* Instructions */}
        <p className="text-xs text-chalk/70 leading-relaxed max-w-xs">
          Present this QR code or 6-character PIN at the front desk or scan at the court turnstile 15 minutes before your slot.
        </p>

        <div className="w-full flex items-center justify-center gap-2 pt-2 border-t border-chalk/10">
          <Button variant="ghost" onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
