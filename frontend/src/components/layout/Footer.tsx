import { AppLink } from "@/app/router/links";
import { Logo } from "@/components/brand/Logo";
import { CLUB_NAME } from "@/lib/constants";
import { Phone, Mail, MapPin, Clock, Instagram, Twitter, Facebook, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-court-700 text-chalk border-t border-chalk/14">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand & Logo */}
          <div className="flex flex-col gap-4">
            <Logo size={28} />
            <p className="text-xs sm:text-sm text-chalk/75 leading-relaxed">
              India's premier sports club facility. Designed for performance, community, and excellence across Tennis, Padel, Badminton & Fitness.
            </p>
            <div className="flex items-center gap-3 pt-2 text-chalk/70">
              <a href="#" className="hover:text-volt-400 transition-colors" aria-label="Instagram"><Instagram className="size-4" /></a>
              <a href="#" className="hover:text-volt-400 transition-colors" aria-label="Twitter"><Twitter className="size-4" /></a>
              <a href="#" className="hover:text-volt-400 transition-colors" aria-label="Facebook"><Facebook className="size-4" /></a>
              <a href="#" className="hover:text-volt-400 transition-colors" aria-label="Youtube"><Youtube className="size-4" /></a>
            </div>
          </div>

          {/* Column 2: Facilities */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-volt-400">Facilities</h4>
            <ul className="flex flex-col gap-2 text-xs sm:text-sm text-chalk/80">
              <li><AppLink to="/facilities" className="hover:text-chalk">16 Championship Tennis Courts</AppLink></li>
              <li><AppLink to="/facilities" className="hover:text-chalk">Indoor Wooden Badminton Arena</AppLink></li>
              <li><AppLink to="/facilities" className="hover:text-chalk">Pro Padel Glass Courts</AppLink></li>
              <li><AppLink to="/facilities" className="hover:text-chalk">50m Olympic Swimming Pool</AppLink></li>
              <li><AppLink to="/facilities" className="hover:text-chalk">High-Performance Gym & Sauna</AppLink></li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-volt-400">Quick Links</h4>
            <ul className="flex flex-col gap-2 text-xs sm:text-sm text-chalk/80">
              <li><AppLink to="/plans" className="hover:text-chalk">Membership Plans & Tiers</AppLink></li>
              <li><AppLink to="/shop" className="hover:text-chalk">Pro Shop & Restringing</AppLink></li>
              <li><AppLink to="/availability" className="hover:text-chalk">This Week Availability</AppLink></li>
              <li><AppLink to="/trial" className="hover:text-chalk">Book a Free Trial Pass</AppLink></li>
              <li><AppLink to="/login" className="hover:text-chalk">Member Portal Login</AppLink></li>
            </ul>
          </div>

          {/* Column 4: Contact & Hours */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-volt-400">Contact & Hours</h4>
            <div className="flex flex-col gap-2.5 text-xs sm:text-sm text-chalk/80">
              <div className="flex items-center gap-2.5">
                <MapPin className="size-4 text-volt-400 shrink-0" />
                <span>Sector 44, Golf Course Road, Gurugram, Haryana 122003</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="size-4 text-volt-400 shrink-0" />
                <span>+91 98765 43210 / +91 124 4567890</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="size-4 text-volt-400 shrink-0" />
                <span>support@championsclub.in</span>
              </div>
              <div className="flex items-center gap-2.5 pt-1">
                <Clock className="size-4 text-volt-400 shrink-0" />
                <span>Mon – Sun: 06:00 AM – 11:00 PM IST</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-chalk/14 pt-6 text-xs text-chalk/60 sm:flex-row">
          <p>© {new Date().getFullYear()} {CLUB_NAME} · Powered by bookmycourt</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-chalk">Privacy Policy</a>
            <a href="#" className="hover:text-chalk">Terms of Service</a>
            <a href="#" className="hover:text-chalk">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
