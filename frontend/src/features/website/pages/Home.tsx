import { motion } from "framer-motion";
import { AppLink } from "@/app/router/links";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { CourtLines } from "@/components/brand/CourtLines";
import { PlayerSilhouette } from "@/components/brand/PlayerSilhouette";
import { StatsBand } from "@/components/brand/StatsBand";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { NoiseOverlay } from "@/components/brand/NoiseOverlay";
import type { PageProps } from "@/types/common";

export default function Home({ route }: PageProps) {
  return (
    <div className="w-full bg-backdrop py-3 px-3 sm:py-4 sm:px-4">
      {/* 28px Floating Hero Frame */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative mx-auto flex min-h-[680px] h-[86vh] max-w-[1440px] flex-col overflow-hidden rounded-[24px] sm:rounded-[28px] border border-chalk/14 bg-court-500 shadow-card"
      >
        <NoiseOverlay opacity={0.03} />

        {/* Top Navbar inside frame */}
        <PublicNavbar isInsideHero={true} />

        {/* Main Hero Court Content Area */}
        <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-8 text-center overflow-hidden">
          {/* Top-down Tennis Court Background filling frame */}
          <div className="absolute inset-4 sm:inset-6 pointer-events-none flex items-center justify-center">
            {/* Desktop Court Lines */}
            <CourtLines
              variant="full"
              animateDraw={true}
              className="hidden sm:block h-full w-full object-contain"
            />
            {/* Mobile Court Lines (rotated vertical/corner variant) */}
            <CourtLines
              variant="corner"
              className="sm:hidden h-full w-full object-contain rotate-90"
            />

            {/* Badge pill centred ON the net's top end, overlapping top court line */}
            <div className="absolute top-[8%] sm:top-[12%] left-1/2 -translate-x-1/2 z-20">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <Badge live className="shadow-lg border border-ink-900/10">
                  Courts Available Now
                </Badge>
              </motion.div>
            </div>
          </div>

          {/* Lower-left Player Silhouette */}
          <motion.div
            initial={{ opacity: 0, x: -60, y: 40 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
            className="absolute left-[5%] bottom-[12%] z-10 hidden md:block"
          >
            <PlayerSilhouette variant="left" />
          </motion.div>

          {/* Right-middle Player Silhouette */}
          <motion.div
            initial={{ opacity: 0, x: 60, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8, ease: "easeOut" }}
            className="absolute right-[8%] top-[28%] z-10 hidden md:block"
          >
            <PlayerSilhouette variant="right" />
          </motion.div>

          {/* Centred Hero Typography & CTA (Z-index ABOVE court lines) */}
          <div className="relative z-20 flex max-w-4xl flex-col items-center gap-6 px-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-[44px] sm:text-[64px] md:text-[80px] lg:text-[92px] font-semibold leading-[1.02] tracking-[-0.025em] text-chalk drop-shadow-md select-none"
            >
              Serve. Dominate.
              <br />
              <span className="text-volt-400">Repeat.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="max-w-[640px] text-base sm:text-lg text-chalk/90 font-normal leading-relaxed drop-shadow"
            >
              Book courts, shop gear, join Friday social play and run your membership: all in one place.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center gap-4 pt-2 w-full sm:w-auto"
            >
              <AppLink to="/app/book" className="w-full sm:w-auto">
                <Button size="lg" variant="primary" className="w-full sm:w-auto shadow-volt">
                  Book a Court
                </Button>
              </AppLink>

              <AppLink to="/plans" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Explore Plans
                </Button>
              </AppLink>
            </motion.div>
          </div>
        </div>

        {/* Bottom Stats Band */}
        <StatsBand />
      </motion.div>
    </div>
  );
}
