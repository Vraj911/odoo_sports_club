import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Maximize2, X, Download, Smartphone, Sparkles, ShieldCheck } from "lucide-react";
import { CourtLines } from "@/components/brand/CourtLines";
import { Logo } from "@/components/brand/Logo";
import { StatusPill } from "@/components/ui/StatusPill";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { MemberProfile } from "@/features/member/types";
import { cn } from "@/lib/cn";

export interface DigitalCardProps {
  profile: MemberProfile;
  className?: string | undefined;
}

export function DigitalCard({ profile, className }: DigitalCardProps) {
  const [fullscreenQR, setFullscreenQR] = useState(false);

  const qrData = JSON.stringify({
    memberId: profile.id,
    name: profile.name,
    tier: profile.tier,
    validTill: profile.validTill,
    token: profile.qrToken,
  });

  return (
    <>
      {/* Credit-card shaped container (aspect ratio 1.586) */}
      <div
        className={cn(
          "relative aspect-[1.586] w-full max-w-md overflow-hidden rounded-[24px] border border-chalk/20 bg-gradient-to-br from-court-500 via-court-600 to-navy-900 p-6 text-chalk shadow-2xl transition-all duration-300 hover:border-volt-400/40 hover:shadow-volt/10 select-none",
          className
        )}
      >
        {/* Subtle background CourtLines watermark */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
          <CourtLines className="w-full h-full object-cover scale-125" />
        </div>

        {/* Card Holographic Corner Glow */}
        <div className="absolute -top-12 -right-12 size-36 rounded-full bg-volt-400/20 blur-2xl pointer-events-none" />

        {/* Card Top Row: Club Logo + Plan Status Pill */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={26} />
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-widest uppercase text-chalk">
                Champions Club
              </span>
              <span className="text-[10px] text-chalk/60 font-mono tracking-wider">
                MEMBERSHIP PASS
              </span>
            </div>
          </div>

          <StatusPill
            variant={
              profile.tier === "Gold"
                ? "volt"
                : profile.tier === "Silver"
                ? "neutral"
                : "info"
            }
            className="shadow-sm font-semibold tracking-wider uppercase text-[11px]"
          >
            {profile.tier}
          </StatusPill>
        </div>

        {/* Card Middle: Photo + Name + Member ID */}
        <div className="relative z-10 mt-6 flex items-center gap-4">
          <div className="relative">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="size-14 rounded-2xl border-2 border-volt-400/60 object-cover shadow-lg"
            />
            <span
              className={cn(
                "absolute -bottom-1 -right-1 size-3.5 rounded-full border-2 border-court-600",
                profile.status === "ACTIVE"
                  ? "bg-brand-green"
                  : profile.status === "EXPIRING_SOON"
                  ? "bg-amber-400"
                  : "bg-danger"
              )}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold tracking-tight text-chalk">
              {profile.name}
            </h3>
            <p className="font-mono text-xs font-semibold text-volt-400 tracking-wider">
              {profile.id}
            </p>
          </div>

          {/* Interactive QR thumbnail */}
          <button
            onClick={() => setFullscreenQR(true)}
            className="group/qr relative flex flex-col items-center rounded-xl bg-white p-1.5 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-transparent hover:ring-volt-400"
            title="Tap for desk scan fullscreen mode"
          >
            <QRCodeSVG value={qrData} size={50} level="M" />
            <span className="mt-0.5 text-[8px] font-bold uppercase text-navy-950 flex items-center gap-0.5">
              <Maximize2 className="size-2" /> TAP
            </span>
          </button>
        </div>

        {/* Card Bottom Row: Valid Till + Chip */}
        <div className="relative z-10 mt-6 flex items-end justify-between border-t border-white/10 pt-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-chalk/50 font-mono">
              Valid Thru
            </span>
            <span className="text-xs font-semibold font-mono text-chalk">
              {new Date(profile.validTill).toLocaleDateString("en-IN", {
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-4 w-6 rounded-sm bg-gradient-to-r from-amber-400/80 to-amber-200/80 shadow-inner" />
            <span className="text-[10px] font-mono text-chalk/50 uppercase tracking-widest">
              NFC
            </span>
          </div>
        </div>
      </div>

      {/* Tap QR -> Fullscreen Mode with Brightness-Boost (White background, high contrast) */}
      <Modal
        isOpen={fullscreenQR}
        onClose={() => setFullscreenQR(false)}
        maxWidth="sm"
        title={
          <div className="flex items-center gap-2 text-volt-400">
            <ShieldCheck className="size-5 shrink-0" />
            <span>Turnstile & Reception Scanner</span>
          </div>
        }
        subtitle={`${profile.name} · ${profile.id} (${profile.tier})`}
      >
        <div className="flex flex-col items-center text-center gap-5">
          {/* Brightness-boost high-contrast white card */}
          <div className="rounded-3xl bg-white p-6 shadow-2xl ring-8 ring-volt-400/20">
            <QRCodeSVG value={qrData} size={220} level="H" includeMargin={false} />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono text-chalk/60 uppercase tracking-widest block">
              Member Digital Token
            </span>
            <span className="text-base font-bold font-mono tracking-widest text-volt-400">
              {profile.id}
            </span>
            <p className="text-xs text-chalk/70 max-w-xs mt-1 leading-relaxed">
              Screen brightness boosted for fast turnstile gate scanning and desk check-in.
            </p>
          </div>

          <div className="w-full flex items-center justify-center gap-2 border-t border-chalk/10 pt-3">
            <Button
              variant="primary"
              onClick={() => setFullscreenQR(false)}
              className="w-full"
            >
              Done Scanning
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
