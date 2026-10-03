import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AppLink, useGo } from "@/app/router/links";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { CourtLines } from "@/components/brand/CourtLines";
import { PlayerSilhouette } from "@/components/brand/PlayerSilhouette";
import { StatsBand } from "@/components/brand/StatsBand";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { NoiseOverlay } from "@/components/brand/NoiseOverlay";
import { useAuth } from "@/app/providers/AuthProvider";
import { PUBLIC_PLANS, generateWeekAvailability } from "../sampleData";
import { SAMPLE_PRODUCTS } from "@/features/shop/sampleData";
import type { PageProps } from "@/types/common";
import {
  Trophy,
  CalendarDays,
  ShoppingBag,
  Wine,
  Sparkles,
  ArrowRight,
  MapPin,
  Clock,
  Compass,
  Check,
  Star,
} from "lucide-react";

export default function Home({ route }: PageProps) {
  const go = useGo();
  const { user } = useAuth();
  const isMember = user?.role === "MEMBER";

  // Compute 7-day mini availability heat strip
  const heatStripDays = useMemo(() => {
    const monday = new Date();
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    return generateWeekAvailability(monday, "tennis");
  }, []);

  // 4 Featured products from Pro Shop
  const featuredShopProducts = SAMPLE_PRODUCTS.slice(0, 4);

  return (
    <div className="w-full bg-backdrop py-3 px-3 sm:py-4 sm:px-4 space-y-16">
      {/* ─── JSON-LD Structured Data for SportsActivityLocation ─── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsActivityLocation",
            name: "Champions Club Mumbai",
            description:
              "Premier sports club featuring 8 tournament courts (Tennis, Padel, Badminton, Cricket), Pro Shop and Clubhouse Dining.",
            url: "https://championsclub.in",
            telephone: "+91-22-6900-1234",
            address: {
              "@type": "PostalAddress",
              streetAddress: "Plot 42, Worli Sea Face Promenade",
              addressLocality: "Mumbai",
              postalCode: "400018",
              addressCountry: "IN",
            },
            openingHours: "Mo-Su 06:00-22:00",
            priceRange: "₹₹",
          }),
        }}
      />

      {/* ─── FLOATING HERO FRAME (Untouched) ─── */}
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
              <AppLink to={isMember ? "/app/book" : "/availability"} className="w-full sm:w-auto">
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

      {/* ─── LOWER SECTION 1: WHY CHAMPIONS CHOOSE US ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-volt-300 uppercase tracking-widest">
            The Champions Standard
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-chalk">
            Why Champions Choose Us
          </h2>
          <p className="text-sm text-chalk/70">
            Engineered from the ground up for passionate racquet sports enthusiasts, high performers, and social players.
          </p>
        </div>

        {/* 4 Feature Cards (with micro-interaction: hover lift + 6° icon tilt) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Trophy,
              title: "Live Courts Grid",
              desc: "Instant booking with live slot holds, zero double-booking, and 14-day advance priority for members.",
              badge: "8 Courts",
            },
            {
              icon: Sparkles,
              title: "Gold, Silver, Junior",
              desc: "Transparent tier plans with unlimited free play for Gold, subsidized junior rates, and annual guest passes.",
              badge: "3 Plans",
            },
            {
              icon: ShoppingBag,
              title: "Pro Gear Shop",
              desc: "Authorized dealer for Yonex, Babolat, Head & Wilson with computerized electronic stringing in 24 hours.",
              badge: "Retail & Demo",
            },
            {
              icon: Wine,
              title: "Bar & Sports Café",
              desc: "Sunset terrace lounge with cold brew, protein shakes, craft draught pints, and automated member tab charging.",
              badge: "All-Day Dining",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="group p-6 rounded-3xl bg-court-600/70 border border-chalk/14 hover:border-volt-400/50 hover:-translate-y-2 transition-all duration-300 shadow-card flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-volt-400 text-ink-900 flex items-center justify-center font-bold shadow-lg shadow-volt-400/20 group-hover:rotate-6 transition-transform duration-300">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-chalk/80">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-lg font-heading font-bold text-chalk group-hover:text-volt-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-chalk/70 mt-2 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── LOWER SECTION 2: THIS WEEK AT A GLANCE (Mini Availability Heat Strip) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-chalk/14">
          <div>
            <span className="text-xs font-bold text-volt-300 uppercase tracking-widest">
              Live Heat Map
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-chalk">
              This Week at a Glance
            </h2>
          </div>
          <AppLink
            to="/availability"
            className="inline-flex items-center gap-1.5 text-xs text-volt-300 font-bold hover:underline"
          >
            Explore Full Interactive Grid <ArrowRight className="w-4 h-4" />
          </AppLink>
        </div>

        {/* 7-day mini availability heat strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {heatStripDays.map((day) => {
            const slots = Object.values(day.slots);
            const totalFree = slots.reduce((acc, s) => acc + s.freeCourts, 0);
            const totalSlots = slots.length * 3;
            const freePercent = Math.min(100, Math.round((totalFree / totalSlots) * 100));

            return (
              <div
                key={day.date}
                onClick={() => go(`/availability?date=${day.date}`)}
                className="group p-4 rounded-2xl bg-court-600/70 border border-chalk/14 hover:border-volt-400/50 cursor-pointer transition-all duration-200 text-center space-y-2 hover:-translate-y-1"
                title={`${totalFree} courts free · ${day.dayName} ${day.dayNumber}`}
              >
                <div className="text-xs font-bold uppercase text-chalk/70">{day.dayName}</div>
                <div className="text-xl font-heading font-black text-white">{day.dayNumber}</div>

                {/* Heat strip visual pill */}
                <div
                  className="py-1.5 px-2 rounded-xl text-xs font-bold font-mono transition-colors"
                  style={{
                    backgroundColor: `rgba(213, 246, 58, ${Math.max(0.15, freePercent / 100)})`,
                    color: freePercent > 40 ? "#0B1528" : "#D5F63A",
                  }}
                >
                  {totalFree} free
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── LOWER SECTION 3: MEMBERSHIP PLANS TEASER ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-chalk/14">
          <div>
            <span className="text-xs font-bold text-volt-300 uppercase tracking-widest">
              Simple Pricing
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-chalk">
              Membership Plans
            </h2>
          </div>
          <AppLink
            to="/plans"
            className="inline-flex items-center gap-1.5 text-xs text-volt-300 font-bold hover:underline"
          >
            See All Plans & Entitlements <ArrowRight className="w-4 h-4" />
          </AppLink>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PUBLIC_PLANS.map((plan) => {
            const isPopular = plan.popular;
            return (
              <div
                key={plan.id}
                className={`relative p-6 rounded-3xl flex flex-col justify-between transition-all ${
                  isPopular
                    ? "bg-court-600/90 border-2 border-volt-400 shadow-xl shadow-volt-400/10"
                    : "bg-court-600/60 border border-chalk/14"
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-6 px-2.5 py-0.5 rounded-full bg-volt-400 text-ink-900 text-[10px] font-black uppercase">
                    ★ Most Popular
                  </span>
                )}
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-heading font-bold text-xl text-white">{plan.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white font-mono">
                      {plan.tier}
                    </span>
                  </div>
                  <p className="text-xs text-chalk/70 mt-1">{plan.tagline}</p>

                  <div className="my-4">
                    <span className="text-3xl font-heading font-black text-volt-300 font-mono">
                      ₹{plan.annualFee.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-chalk/60 ml-1">/ year</span>
                  </div>

                  <div className="space-y-2 text-xs text-chalk/80 pb-4">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-volt-400" />
                      <span>{plan.courtRateLabel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-volt-400" />
                      <span>{plan.advanceBookingDays}-day priority booking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-volt-400" />
                      <span>{plan.shopDiscountLabel}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => go(`/register?plan=${plan.id}`)}
                  className={`w-full text-xs font-bold h-10 ${
                    isPopular ? "bg-volt-400 text-ink-900" : "bg-white/10 text-white"
                  }`}
                >
                  Join as {plan.tier}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── LOWER SECTION 4: PRO SHOP TEASER ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-chalk/14">
          <div>
            <span className="text-xs font-bold text-volt-300 uppercase tracking-widest">
              Authorized Gear
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-chalk">
              Champions Pro Shop
            </h2>
          </div>
          <AppLink
            to="/shop"
            className="inline-flex items-center gap-1.5 text-xs text-volt-300 font-bold hover:underline"
          >
            Browse Full Online Catalog <ArrowRight className="w-4 h-4" />
          </AppLink>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {featuredShopProducts.map((prod) => (
            <div
              key={prod.id}
              onClick={() => go(`/shop/${prod.slug}`)}
              className="group p-4 rounded-2xl bg-court-600/60 border border-chalk/14 hover:border-volt-400/50 cursor-pointer transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="h-40 rounded-xl bg-navy-950/60 overflow-hidden mb-3">
                  <img
                    src={prod.images[0]}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <span className="text-[10px] uppercase font-bold text-volt-300">{prod.brand}</span>
                <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-volt-300 transition-colors">
                  {prod.name}
                </h4>
              </div>
              <div className="mt-3 pt-2 border-t border-chalk/10 flex items-center justify-between">
                <span className="font-mono font-bold text-volt-300 text-sm">
                  ₹{prod.basePrice.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-chalk/60 group-hover:text-white">View →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── LOWER SECTION 5: VISIT US MAP & HOURS ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-court-600/70 border border-chalk/14 p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="text-xs font-bold text-volt-300 uppercase tracking-widest">
              Clubhouse Destination
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-chalk">
              Visit Champions Club
            </h2>
            <p className="text-xs sm:text-sm text-chalk/80 leading-relaxed">
              Experience the waterfront ambiance on Worli Sea Face Promenade. Open 365 days a year
              from 06:00 to 22:00 IST with dedicated valet parking.
            </p>

            <div className="space-y-2 text-xs text-chalk/80 pt-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-volt-300" />
                <span>Plot 42, Worli Sea Face Promenade, Mumbai 400018</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-volt-300" />
                <span>Courts: 06:00–22:00 · Pro Shop: 08:00–20:00 · Bar: 11:00–23:00</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button
                onClick={() => go("/contact")}
                className="bg-volt-400 hover:bg-volt-500 text-ink-900 font-bold text-xs h-10"
              >
                Contact Concierge Desk
              </Button>
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-volt-300 font-bold hover:underline flex items-center gap-1"
              >
                Google Maps <Compass className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-6 h-64 sm:h-80 rounded-2xl overflow-hidden border border-chalk/14 bg-navy-950 relative flex items-center justify-center">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#D5F63A_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative text-center space-y-2 z-10">
              <div className="w-12 h-12 rounded-full bg-volt-400 text-ink-900 mx-auto flex items-center justify-center font-bold shadow-xl animate-bounce">
                <MapPin className="w-6 h-6" />
              </div>
              <span className="font-heading font-black text-white text-base block">
                Champions Club Mumbai
              </span>
              <p className="text-xs text-chalk/60">Worli Promenade Waterfront</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LOWER SECTION 6: READY TO PLAY? CTA BAND ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-volt-400 text-ink-900 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-900/70">
              Step Onto The Court
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-ink-900 tracking-tight">
              Ready to Play Your Best Game?
            </h2>
            <p className="text-sm text-ink-900/80 max-w-xl">
              Book a trial session for ₹499, join a membership plan, or book single court play today.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Button
              size="lg"
              onClick={() => go(isMember ? "/app/book" : "/availability")}
              className="bg-ink-900 hover:bg-black text-white font-bold h-12 px-6 rounded-full shadow-lg"
            >
              Book a Court
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => go("/contact")}
              className="border-ink-900 text-ink-900 hover:bg-ink-900/10 font-bold h-12 px-6 rounded-full"
            >
              Enquire
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
