import { useState, useEffect } from "react";
import { useGo } from "@/app/router/links";
import { CourtLines } from "@/components/brand/CourtLines";
import { NoiseOverlay } from "@/components/brand/NoiseOverlay";
import { Button } from "@/components/ui/Button";
import { GALLERY_PHOTOS, PUBLIC_SPORT_RATES } from "../sampleData";
import { FacilityGalleryPhoto } from "../types";
import { initialMenuItems } from "@/features/bar/sampleData";
import {
  Trophy,
  ShoppingBag,
  Wine,
  Camera,
  MapPin,
  Clock,
  Phone,
  Mail,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  Compass,
  Sparkles,
} from "lucide-react";

export function FacilitiesPage() {
  const go = useGo();
  const [activeTab, setActiveTab] = useState<"COURTS" | "SHOP" | "BAR" | "GALLERY">("COURTS");
  const [lightboxPhoto, setLightboxPhoto] = useState<FacilityGalleryPhoto | null>(null);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxPhoto) return;
      if (e.key === "Escape") setLightboxPhoto(null);
      if (e.key === "ArrowRight") {
        const idx = GALLERY_PHOTOS.findIndex((p) => p.id === lightboxPhoto.id);
        const next = GALLERY_PHOTOS[(idx + 1) % GALLERY_PHOTOS.length];
        setLightboxPhoto(next);
      }
      if (e.key === "ArrowLeft") {
        const idx = GALLERY_PHOTOS.findIndex((p) => p.id === lightboxPhoto.id);
        const prev = GALLERY_PHOTOS[(idx - 1 + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length];
        setLightboxPhoto(prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxPhoto]);

  // Featured top 6 bar items for café tab
  const barHighlights = initialMenuItems.slice(0, 6);

  return (
    <div className="w-full text-chalk font-sans">
      {/* Hero Header with faint CourtLines */}
      <div className="relative overflow-hidden border-b border-chalk/14 bg-court-700/60 py-16 px-4 sm:px-6">
        <NoiseOverlay opacity={0.03} />
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-15">
          <CourtLines variant="full" className="h-full w-full object-contain" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-volt-400/20 text-volt-300 border border-volt-400/30">
            World-Class Infrastructure
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-black tracking-tight text-chalk">
            Our Facilities & Amenities
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-chalk/80 leading-relaxed">
            Eight professional tournament courts, certified coaching bays, an authorized pro gear shop,
            and an all-day clubhouse lounge overlooking the courts.
          </p>

          {/* Navigation Tabs */}
          <div className="pt-6 flex justify-center">
            <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-full bg-court-600/80 border border-chalk/14">
              <button
                type="button"
                onClick={() => setActiveTab("COURTS")}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === "COURTS"
                    ? "bg-volt-400 text-ink-900 shadow-md font-bold"
                    : "text-chalk/70 hover:text-chalk"
                }`}
              >
                <Trophy className="w-4 h-4" />
                Courts & Nets
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("SHOP")}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === "SHOP"
                    ? "bg-volt-400 text-ink-900 shadow-md font-bold"
                    : "text-chalk/70 hover:text-chalk"
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                Pro Shop & Strings
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("BAR")}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === "BAR"
                    ? "bg-volt-400 text-ink-900 shadow-md font-bold"
                    : "text-chalk/70 hover:text-chalk"
                }`}
              >
                <Wine className="w-4 h-4" />
                Bar, Lounge & Dining
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("GALLERY")}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === "GALLERY"
                    ? "bg-volt-400 text-ink-900 shadow-md font-bold"
                    : "text-chalk/70 hover:text-chalk"
                }`}
              >
                <Camera className="w-4 h-4" />
                Photo Gallery ({GALLERY_PHOTOS.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-16">
        {/* ─── TAB 1: COURTS ─── */}
        {activeTab === "COURTS" && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-chalk">
                Championship Sporting Arenas
              </h2>
              <p className="text-xs sm:text-sm text-chalk/70">
                Precision-engineered playing surfaces maintained daily with tournament anti-glare illumination.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {PUBLIC_SPORT_RATES.map((sportItem) => {
                const isTennis = sportItem.sport === "tennis";
                const isPadel = sportItem.sport === "padel";
                const isBadminton = sportItem.sport === "badminton";

                return (
                  <div
                    key={sportItem.sport}
                    className="relative overflow-hidden rounded-3xl bg-court-600/70 border border-chalk/14 p-6 hover:border-volt-400/50 transition-all duration-200 group flex flex-col justify-between"
                  >
                    <div>
                      {/* Mini Court Illustration background */}
                      <div className="absolute right-4 top-4 w-32 h-32 opacity-10 pointer-events-none">
                        <CourtLines variant="corner" className="w-full h-full" />
                      </div>

                      {/* Header badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-volt-400 text-ink-900 uppercase tracking-wider">
                          {sportItem.sport.replace("-", " ")}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-white border border-white/10">
                          {isTennis ? "2 Outdoor Clay + 1 Indoor" : isPadel ? "2 Panoramic Glass" : isBadminton ? "2 BWF Hardwood" : "1 Astro Turf"}
                        </span>
                      </div>

                      <h3 className="text-xl font-heading font-bold text-chalk mb-2 group-hover:text-volt-300 transition-colors">
                        {sportItem.sportLabel}
                      </h3>

                      <p className="text-xs sm:text-sm text-chalk/70 mb-4 leading-relaxed">
                        {isTennis
                          ? "Slow Roland-Garros style red clay courts plus an all-weather air-cushioned indoor acrylic hard court."
                          : isPadel
                          ? "State-of-the-art Spanish panoramic court structures with seamless 12mm glass and textured Mondo turf."
                          : isBadminton
                          ? "Multi-layer sprung maple hardwood floor compliant with BWF tournament standards for zero knee impact."
                          : "Fully enclosed indoor batting cage with variable programmable bowling machine up to 145 km/h."}
                      </p>

                      <div className="space-y-1.5 text-xs text-chalk/80 pb-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-volt-400 shrink-0" />
                          <span>1000-Lux tournament LED lighting</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-volt-400 shrink-0" />
                          <span>Gold Members: <strong>FREE (₹0 / hr)</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-volt-400 shrink-0" />
                          <span>Non-Members / Guests: from ₹{sportItem.guestRate}/hr</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-chalk/10 flex items-center justify-between">
                      <span className="text-xs font-mono text-volt-300 font-semibold">
                        From ₹{sportItem.silverRate}/hr (Members)
                      </span>
                      <Button
                        size="sm"
                        onClick={() => go(`/availability?sport=${sportItem.sport}`)}
                        className="bg-volt-400 hover:bg-volt-500 text-ink-900 font-bold text-xs h-9"
                      >
                        Check Availability <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── TAB 2: PRO SHOP ─── */}
        {activeTab === "SHOP" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-volt-400/20 text-volt-300 border border-volt-400/30">
                  Authorized Pro Retailer
                </span>
                <h2 className="text-3xl sm:text-4xl font-heading font-black text-chalk">
                  Champions Gear Shop & Stringing Bay
                </h2>
                <p className="text-sm text-chalk/80 leading-relaxed">
                  Stocking the latest racquets, tour balls, dampeners, replacement grips and apparel from
                  Yonex, Head, Babolat, Wilson, and Bullpadel. Our certified stringers guarantee 24-hour
                  turnaround on electronic constant-pull machines.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-court-600/70 border border-chalk/14">
                    <span className="font-heading font-bold text-white text-base block">24h Turnaround</span>
                    <span className="text-xs text-chalk/60">Electronic stringing service with tension calibration</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-court-600/70 border border-chalk/14">
                    <span className="font-heading font-bold text-white text-base block">Demo Rackets</span>
                    <span className="text-xs text-chalk/60">Try before you buy on court with coach evaluation</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <Button
                    onClick={() => go("/shop")}
                    className="bg-volt-400 hover:bg-volt-500 text-ink-900 font-bold h-11 text-xs"
                  >
                    Browse Online Pro Shop <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => go("/contact?topic=restringing")}
                    className="h-11 text-xs border-chalk/20 text-chalk hover:text-white"
                  >
                    Book Racket Restring
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-6">
                <img
                  src="https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=1000&auto=format&fit=crop&q=80"
                  alt="Champions Pro Shop"
                  className="w-full h-80 sm:h-96 object-cover rounded-3xl border border-chalk/14 shadow-2xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: BAR & CAFÉ ─── */}
        {activeTab === "BAR" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 order-2 lg:order-1">
                <img
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&auto=format&fit=crop&q=80"
                  alt="Clubhouse Lounge"
                  className="w-full h-80 sm:h-96 object-cover rounded-3xl border border-chalk/14 shadow-2xl"
                />
              </div>

              <div className="lg:col-span-6 order-1 lg:order-2 space-y-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-volt-400/20 text-volt-300 border border-volt-400/30">
                  Lounge & Dining
                </span>
                <h2 className="text-3xl sm:text-4xl font-heading font-black text-chalk">
                  Post-Match Recovery & Sunset Terrace
                </h2>
                <p className="text-sm text-chalk/80 leading-relaxed">
                  Whether refuelling with cold-pressed watermelon mint coolers after intense drills or
                  celebrating league victories with craft draught beer, our sports bar and café serves
                  fresh, wholesome dining all day.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-court-600/70 border border-chalk/14">
                    <span className="font-heading font-bold text-white text-base block">Member Tabs</span>
                    <span className="text-xs text-chalk/60">Tap to charge food and drinks directly to your monthly ledger</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-court-600/70 border border-chalk/14">
                    <span className="font-heading font-bold text-white text-base block">15% Discount</span>
                    <span className="text-xs text-chalk/60">Gold members receive automatic 15% off all dining & bar tabs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Highlights Strip */}
            <div>
              <h3 className="text-lg font-heading font-bold text-chalk mb-4">
                Menu Highlights & Favourites
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {barHighlights.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-court-600/70 border border-chalk/10 space-y-1 text-center"
                  >
                    <span className="text-xs font-bold text-white block line-clamp-1">{item.name}</span>
                    <span className="text-[10px] text-chalk/60 uppercase block">{item.category}</span>
                    <span className="font-mono font-bold text-volt-300 text-xs block">
                      ₹{item.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 4: GALLERY (Masonry + Lightbox) ─── */}
        {activeTab === "GALLERY" && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-1">
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-chalk">
                A Tour of Champions Club
              </h2>
              <p className="text-xs sm:text-sm text-chalk/60">
                Click any image to view in full-screen theatre mode (use arrow keys to navigate).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {GALLERY_PHOTOS.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setLightboxPhoto(photo)}
                  className="group relative h-64 overflow-hidden rounded-2xl border border-chalk/14 bg-court-700 cursor-pointer shadow-lg hover:border-volt-400/50 transition-all duration-200"
                >
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                    <span className="text-[10px] uppercase font-bold text-volt-300 tracking-wider">
                      {photo.category}
                    </span>
                    <h4 className="text-sm font-bold text-white">{photo.title}</h4>
                    <p className="text-[11px] text-chalk/70 line-clamp-2 mt-0.5">{photo.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── BOTTOM SECTION: LOCATION & HOURS (Always visible) ─── */}
        <div className="pt-12 border-t border-chalk/14 space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-chalk">
              Visit Champions Club
            </h2>
            <p className="text-xs sm:text-sm text-chalk/60">
              Conveniently located at Worli Sea Face with valet parking for members and guests.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Map Card Preview (7 cols) */}
            <div className="lg:col-span-7 rounded-3xl bg-court-600/70 border border-chalk/14 p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-volt-300 text-xs font-bold uppercase tracking-wider">
                  <MapPin className="w-4 h-4" />
                  <span>Prime Waterfront Location</span>
                </div>
                <h3 className="text-xl font-heading font-bold text-chalk">
                  Plot 42, Worli Sea Face Promenade, Mumbai 400018
                </h3>
                <p className="text-xs text-chalk/70 leading-relaxed">
                  Located opposite the Worli Dairy junction. Dedicated basement valet parking available
                  with 4 high-speed EV charging stations.
                </p>
              </div>

              {/* Styled Mock Map Container */}
              <div className="relative h-56 rounded-2xl overflow-hidden border border-chalk/10 bg-navy-950 flex items-center justify-center">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#D5F63A_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="relative text-center space-y-2 z-10">
                  <div className="w-12 h-12 rounded-full bg-volt-400 text-ink-900 mx-auto flex items-center justify-center font-bold shadow-xl shadow-volt-400/30 animate-bounce">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <span className="font-heading font-black text-white text-sm block">
                    Champions Club Mumbai
                  </span>
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-volt-300 font-bold hover:underline"
                  >
                    Open in Google Maps <Compass className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-chalk/70 pt-2 border-t border-chalk/10 gap-2">
                <span>Direct Line: <strong className="text-chalk">+91 22 6900 1234</strong></span>
                <span>Concierge Desk: <strong className="text-chalk">frontdesk@championsclub.in</strong></span>
              </div>
            </div>

            {/* Operating Hours & Holiday Schedule (5 cols) */}
            <div className="lg:col-span-5 rounded-3xl bg-court-600/70 border border-chalk/14 p-6 space-y-4">
              <div className="flex items-center gap-2 text-volt-300 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>Operating Timings</span>
              </div>

              <h3 className="text-lg font-heading font-bold text-chalk">
                Open 365 Days a Year
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-chalk/10">
                  <span className="text-chalk/70">Courts & Turf Nets:</span>
                  <span className="font-mono font-bold text-white">06:00 – 22:00 IST</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-chalk/10">
                  <span className="text-chalk/70">Champions Pro Shop:</span>
                  <span className="font-mono font-bold text-white">08:00 – 20:00 IST</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-chalk/10">
                  <span className="text-chalk/70">Clubhouse Sports Bar & Café:</span>
                  <span className="font-mono font-bold text-white">11:00 – 23:00 IST</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-chalk/10">
                  <span className="text-chalk/70">Coaching Clinics & Academy:</span>
                  <span className="font-mono font-bold text-white">06:30 – 19:30 IST</span>
                </div>
              </div>

              {/* Holiday policy pill */}
              <div className="p-3 rounded-2xl bg-volt-400/10 border border-volt-400/20 text-[11px] text-chalk/80 space-y-1">
                <div className="font-bold text-volt-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>National Holidays Schedule</span>
                </div>
                <p>
                  Courts remain open on Diwali, Holi, Republic Day & Independence Day on Sunday weekend hours
                  (07:00 – 21:00).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 bg-navy-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-court-700 rounded-3xl border border-chalk/20 overflow-hidden shadow-2xl"
          >
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-navy-900/80 hover:bg-navy-900 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative h-96 sm:h-[500px] w-full bg-navy-950">
              <img
                src={lightboxPhoto.imageUrl}
                alt={lightboxPhoto.title}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-6 bg-court-600 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-volt-300">{lightboxPhoto.category}</span>
                <h3 className="text-lg font-bold text-white">{lightboxPhoto.title}</h3>
                <p className="text-xs text-chalk/70 mt-0.5">{lightboxPhoto.caption}</p>
              </div>

              {/* Previous & Next controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const idx = GALLERY_PHOTOS.findIndex((p) => p.id === lightboxPhoto.id);
                    const prev = GALLERY_PHOTOS[(idx - 1 + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length];
                    setLightboxPhoto(prev);
                  }}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    const idx = GALLERY_PHOTOS.findIndex((p) => p.id === lightboxPhoto.id);
                    const next = GALLERY_PHOTOS[(idx + 1) % GALLERY_PHOTOS.length];
                    setLightboxPhoto(next);
                  }}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default FacilitiesPage;
