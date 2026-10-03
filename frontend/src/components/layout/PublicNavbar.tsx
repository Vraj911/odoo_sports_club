import { useState } from "react";
import { ChevronDown, Menu, X, Building2, Trophy, Sparkles, ShoppingBag, BadgeCheck, Utensils, Wrench } from "lucide-react";
import { AppLink } from "@/app/router/links";
import { useAuth } from "@/app/providers/AuthProvider";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { AnimatePresence, motion } from "framer-motion";

export function PublicNavbar({ isInsideHero = false }: { isInsideHero?: boolean }) {
  const { user } = useAuth();
  const isMember = user?.role === "MEMBER";
  const bookTarget = isMember ? "/app/book" : "/availability";
  const [facilitiesOpen, setFacilitiesOpen] = useState(false);
  const [plansShopOpen, setPlansShopOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className={`relative z-30 flex h-[80px] w-full items-center justify-between px-6 sm:px-12 md:px-16 ${
        isInsideHero ? "bg-transparent" : "border-b border-chalk/14 bg-navy-900/80 backdrop-blur-md"
      }`}
    >
      {/* Left: Logo */}
      <AppLink to="/" className="flex items-center gap-3" aria-label="Home">
        <Logo size={28} />
      </AppLink>

      {/* Centre: Desktop Links with MegaMenus */}
      <nav className="hidden items-center gap-8 md:flex text-sm font-medium text-chalk/90" aria-label="Main navigation">
        {/* Facilities MegaMenu */}
        <div
          className="relative"
          onMouseEnter={() => setFacilitiesOpen(true)}
          onMouseLeave={() => setFacilitiesOpen(false)}
        >
          <button
            onClick={() => setFacilitiesOpen((v) => !v)}
            className="flex items-center gap-1.5 py-2 hover:text-volt-400 transition-colors"
          >
            <span>Facilities</span>
            <ChevronDown className={`size-3.5 transition-transform ${facilitiesOpen ? "rotate-180 text-volt-400" : ""}`} />
          </button>

          <AnimatePresence>
            {facilitiesOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[480px] rounded-[20px] border border-chalk/18 bg-court-600 p-5 shadow-2xl backdrop-blur-xl"
              >
                <div className="grid grid-cols-2 gap-3">
                  <AppLink
                    to="/facilities"
                    className="flex items-start gap-3 rounded-input p-3 hover:bg-chalk/10 transition-colors"
                  >
                    <div className="rounded-pill bg-volt-400/16 p-2 text-volt-400">
                      <Trophy className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-chalk">Tennis & Padel Courts</h4>
                      <p className="text-xs text-chalk/70">16 ITF Synthetic & Clay courts</p>
                    </div>
                  </AppLink>

                  <AppLink
                    to="/facilities"
                    className="flex items-start gap-3 rounded-input p-3 hover:bg-chalk/10 transition-colors"
                  >
                    <div className="rounded-pill bg-volt-400/16 p-2 text-volt-400">
                      <Building2 className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-chalk">Badminton & Squash</h4>
                      <p className="text-xs text-chalk/70">Wooden floor indoor arenas</p>
                    </div>
                  </AppLink>

                  <AppLink
                    to="/facilities"
                    className="flex items-start gap-3 rounded-input p-3 hover:bg-chalk/10 transition-colors"
                  >
                    <div className="rounded-pill bg-volt-400/16 p-2 text-volt-400">
                      <Sparkles className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-chalk">Olympic Pool & Gym</h4>
                      <p className="text-xs text-chalk/70">Temperature controlled 50m pool</p>
                    </div>
                  </AppLink>

                  <AppLink
                    to="/availability"
                    className="flex items-start gap-3 rounded-input p-3 hover:bg-chalk/10 transition-colors"
                  >
                    <div className="rounded-pill bg-volt-400/16 p-2 text-volt-400">
                      <Utensils className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-chalk">Sports Bar & Café</h4>
                      <p className="text-xs text-chalk/70">Post-match nutrition & lounge</p>
                    </div>
                  </AppLink>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Plans & Shop MegaMenu */}
        <div
          className="relative"
          onMouseEnter={() => setPlansShopOpen(true)}
          onMouseLeave={() => setPlansShopOpen(false)}
        >
          <button
            onClick={() => setPlansShopOpen((v) => !v)}
            className="flex items-center gap-1.5 py-2 hover:text-volt-400 transition-colors"
          >
            <span>Plans & Shop</span>
            <ChevronDown className={`size-3.5 transition-transform ${plansShopOpen ? "rotate-180 text-volt-400" : ""}`} />
          </button>

          <AnimatePresence>
            {plansShopOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[480px] rounded-[20px] border border-chalk/18 bg-court-600 p-5 shadow-2xl backdrop-blur-xl"
              >
                <div className="grid grid-cols-2 gap-3">
                  <AppLink
                    to="/plans"
                    className="flex items-start gap-3 rounded-input p-3 hover:bg-chalk/10 transition-colors"
                  >
                    <div className="rounded-pill bg-volt-400/16 p-2 text-volt-400">
                      <BadgeCheck className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-chalk">Membership Tiers</h4>
                      <p className="text-xs text-chalk/70">Gold, Platinum & Corporate</p>
                    </div>
                  </AppLink>

                  <AppLink
                    to="/shop"
                    className="flex items-start gap-3 rounded-input p-3 hover:bg-chalk/10 transition-colors"
                  >
                    <div className="rounded-pill bg-volt-400/16 p-2 text-volt-400">
                      <ShoppingBag className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-chalk">Pro Gear Shop</h4>
                      <p className="text-xs text-chalk/70">Babolat, Wilson, Yonex</p>
                    </div>
                  </AppLink>

                  <AppLink
                    to="/shop"
                    className="flex items-start gap-3 rounded-input p-3 hover:bg-chalk/10 transition-colors"
                  >
                    <div className="rounded-pill bg-volt-400/16 p-2 text-volt-400">
                      <Wrench className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-chalk">Restringing Services</h4>
                      <p className="text-xs text-chalk/70">Same-day stringing by pros</p>
                    </div>
                  </AppLink>

                  <AppLink
                    to="/trial"
                    className="flex items-start gap-3 rounded-input p-3 hover:bg-chalk/10 transition-colors"
                  >
                    <div className="rounded-pill bg-volt-400/16 p-2 text-volt-400">
                      <Sparkles className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-chalk">Book a Free Trial</h4>
                      <p className="text-xs text-chalk/70">Experience 1-day pass free</p>
                    </div>
                  </AppLink>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AppLink to="/facilities" className="hover:text-volt-400 transition-colors">
          About
        </AppLink>
        <AppLink to="/contact" className="hover:text-volt-400 transition-colors">
          Contact
        </AppLink>
      </nav>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {user ? (
          <AppLink
            to={user.role === "ADMIN" ? "/owner" : user.role === "STAFF" ? "/desk" : "/app"}
            className="text-sm font-medium text-chalk hover:text-volt-400 transition-colors hidden sm:inline"
          >
            Dashboard
          </AppLink>
        ) : (
          <AppLink
            to="/login"
            className="text-sm font-medium text-chalk hover:text-volt-400 transition-colors hidden sm:inline"
          >
            Login
          </AppLink>
        )}
        <AppLink to={bookTarget}>
          <Button size="sm" variant="primary" className="hidden sm:inline-flex">
            Book a Court
          </Button>
        </AppLink>
        <button
          onClick={() => setMobileMenuOpen((m) => !m)}
          className="md:hidden rounded-pill p-2 text-chalk hover:bg-chalk/10"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute left-0 right-0 top-full z-50 flex flex-col gap-4 border-b border-chalk/14 bg-navy-900 px-6 py-6 md:hidden shadow-2xl"
          >
            <AppLink to="/facilities" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-chalk">
              Facilities
            </AppLink>
            <AppLink to="/plans" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-chalk">
              Membership Plans
            </AppLink>
            <AppLink to="/shop" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-chalk">
              Pro Shop
            </AppLink>
            <AppLink to="/availability" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-chalk">
              This Week Availability
            </AppLink>
            <AppLink to="/contact" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-chalk">
              Contact Us
            </AppLink>
            <div className="pt-4 border-t border-chalk/14 flex flex-col gap-3">
              {user ? (
                <AppLink
                  to={user.role === "ADMIN" ? "/owner" : user.role === "STAFF" ? "/desk" : "/app"}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button variant="secondary" className="w-full">
                    Dashboard
                  </Button>
                </AppLink>
              ) : (
                <AppLink to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" className="w-full">
                    Login
                  </Button>
                </AppLink>
              )}
              <AppLink to={bookTarget} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full">
                  Book a Court
                </Button>
              </AppLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
