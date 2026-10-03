// Shared sample data for CCMS Public Website: Plans, Rates, Facilities Gallery, Anonymised Availability, FAQ, and CRM Leads

import { PublicPlan, SportRateInfo, FacilityGalleryPhoto, CRMLead, DayAvailability } from "./types";
import { COURTS, TIME_SLOTS } from "@/features/booking/sampleData";

export const PUBLIC_PLANS: PublicPlan[] = [
  {
    id: "plan-junior",
    name: "Junior Academy",
    tier: "Junior",
    monthlyFee: 650,
    annualFee: 6000,
    courtRateLabel: "₹100–₹200 / hr",
    shopDiscountLabel: "10% on gear & strings",
    barDiscountLabel: "5% on healthy café",
    advanceBookingDays: 7,
    guestPasses: 0,
    popular: false,
    tagline: "For youth athletes under 18 aiming to compete and train.",
    features: [
      "Subsidized junior court rates across all 4 sports",
      "7-day advance booking window",
      "10% discount at Pro Shop & restringing",
      "5% discount on café smoothies & healthy snacks",
      "Access to junior weekend coaching clinics",
      "Guardian app link with spend controls",
    ],
  },
  {
    id: "plan-gold",
    name: "Gold All-Access",
    tier: "Gold",
    monthlyFee: 1800,
    annualFee: 18000,
    courtRateLabel: "₹0 Complimentary",
    shopDiscountLabel: "15% on all shop gear",
    barDiscountLabel: "15% on bar & dining",
    advanceBookingDays: 14,
    guestPasses: 2,
    popular: true, // Gold has popular flag
    tagline: "Unlimited complimentary court play with prime peak privileges.",
    features: [
      "Unlimited complimentary court play (₹0 hourly tariff)",
      "14-day prime priority advance booking",
      "15% Pro Shop discount + priority 24h restringing",
      "15% Bar, Lounge & Courtside dining discount",
      "2 Complimentary annual guest passes",
      "Dedicated clubhouse locker & towel service",
      "Free entry to Friday Socials & Club Championships",
    ],
  },
  {
    id: "plan-silver",
    name: "Silver Regular",
    tier: "Silver",
    monthlyFee: 1050,
    annualFee: 10000,
    courtRateLabel: "₹200–₹400 / hr",
    shopDiscountLabel: "10% on all shop gear",
    barDiscountLabel: "10% on bar & dining",
    advanceBookingDays: 10,
    guestPasses: 1,
    popular: false,
    tagline: "Perfect for regular enthusiasts playing 2–3 times a week.",
    features: [
      "Preferred member court rates (save up to 50% vs guest)",
      "10-day advance booking window",
      "10% Pro Shop gear & apparel discount",
      "10% Bar & Clubhouse café discount",
      "1 Complimentary annual guest pass",
      "Access to Friday Social play ladder",
    ],
  },
];

export const PUBLIC_SPORT_RATES: SportRateInfo[] = [
  {
    sport: "tennis",
    sportLabel: "Tennis (3 Courts: 2 Clay, 1 Indoor Hard)",
    goldRate: 0,
    silverRate: 300,
    juniorRate: 200,
    guestRate: 600,
    peakSurcharge: 100,
  },
  {
    sport: "padel",
    sportLabel: "Padel (2 Panoramic Glass Courts)",
    goldRate: 0,
    silverRate: 400,
    juniorRate: 300,
    guestRate: 800,
    peakSurcharge: 150,
  },
  {
    sport: "badminton",
    sportLabel: "Badminton (2 BWF Certified Wooden Courts)",
    goldRate: 0,
    silverRate: 200,
    juniorRate: 150,
    guestRate: 400,
    peakSurcharge: 50,
  },
  {
    sport: "cricket-net",
    sportLabel: "Cricket Net (1 Professional Astro Turf with Bowling Machine)",
    goldRate: 0,
    silverRate: 500,
    juniorRate: 350,
    guestRate: 1000,
    peakSurcharge: 200,
  },
];

export const GALLERY_PHOTOS: FacilityGalleryPhoto[] = [
  {
    id: "gal-1",
    title: "Centre Court Tennis Arena",
    category: "COURTS",
    imageUrl: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=1200&auto=format&fit=crop&q=80",
    caption: "Championship clay courts illuminated by 1000-lux tournament anti-glare LED lighting.",
  },
  {
    id: "gal-2",
    title: "Panoramic Glass Padel Court",
    category: "COURTS",
    imageUrl: "https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=1200&auto=format&fit=crop&q=80",
    caption: "Mondo Supercourt turf with 12mm tempered safety glass walls and high-rebound surrounds.",
  },
  {
    id: "gal-3",
    title: "Badminton Hall (BWF Standard)",
    category: "COURTS",
    imageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&auto=format&fit=crop&q=80",
    caption: "Shock-absorbent maple hardwood flooring with non-slip vinyl matting and air-conditioned arena.",
  },
  {
    id: "gal-4",
    title: "Champions Pro Shop & Stringing Bay",
    category: "SHOP",
    imageUrl: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=1200&auto=format&fit=crop&q=80",
    caption: "Authorized Yonex, Head, Babolat & Wilson dealer with computerized ERT electronic stringing.",
  },
  {
    id: "gal-5",
    title: "Clubhouse Lounge & Sports Bar",
    category: "LOUNGE",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80",
    caption: "Relax post-match with artisan coffee, craft draught beer, protein smoothies and terrace dining.",
  },
  {
    id: "gal-6",
    title: "Courtside Viewing Terrace",
    category: "LOUNGE",
    imageUrl: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=1200&auto=format&fit=crop&q=80",
    caption: "Panoramic sunset view overlooking Courts 1 and 2 with comfortable lounge seating.",
  },
  {
    id: "gal-7",
    title: "Friday Social Play Matches",
    category: "COMMUNITY",
    imageUrl: "https://images.unsplash.com/photo-1519766304817-4f37bda74a29?w=1200&auto=format&fit=crop&q=80",
    caption: "Weekly round-robin mixers bringing members together for fun, competitive doubles play.",
  },
  {
    id: "gal-8",
    title: "Indoor Turf Cricket Practice Net",
    category: "COURTS",
    imageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80",
    caption: "Full-length batting cage with programmable dual-wheel bowling machine up to 145 km/h.",
  },
];

export const FAQ_ITEMS = [
  {
    question: "Can I bring non-member guests to play with me?",
    answer:
      "Yes! Gold members receive 2 complimentary annual guest passes, and Silver members receive 1. Additional guests may play on your court booking by paying the standard guest court surcharge (₹400–₹1,000 depending on the sport).",
  },
  {
    question: "How does the 14-day advance booking window work?",
    answer:
      "Gold members can reserve court slots up to 14 days in advance, Silver members 10 days, Junior members 7 days, and visitors/guests up to 3 days. This ensures our dedicated members always have priority access to prime evening and weekend slots.",
  },
  {
    question: "What is your cancellation and reschedule policy?",
    answer:
      "Bookings cancelled more than 6 hours prior to the slot start time are refunded 100% as club wallet credit. Cancellations between 2 to 6 hours receive a 50% credit. Cancellations under 2 hours or no-shows are non-refundable.",
  },
  {
    question: "Can I pause or suspend my membership if I am traveling or injured?",
    answer:
      "Annual members can apply for a medical or travel freeze of up to 45 days once per membership cycle with proof (travel tickets or medical note). Submit a freeze request directly from your Member Portal.",
  },
  {
    question: "How does the digital bar tab and Pro Shop discount work?",
    answer:
      "Your club member QR code or registered phone number automatically verifies your tier at the Bar and Pro Shop. Discounts (15% for Gold, 10% for Silver, 5% for Junior) apply instantly at checkout, and verified members can charge orders directly to their running monthly tab.",
  },
];

export const INITIAL_CRM_LEADS: CRMLead[] = [
  {
    id: "LEAD-101",
    source: "TRIAL_BOOKING",
    name: "Aman Gupta",
    phone: "+91 98200 44112",
    email: "aman.gupta@boataudio.com",
    interest: "Tennis Trial Session",
    status: "NEW",
    createdAt: "2026-10-02T14:30:00.000Z",
    details: { sport: "tennis", skillLevel: "INTERMEDIATE" },
  },
  {
    id: "LEAD-102",
    source: "CONTACT_ENQUIRY",
    name: "Neelam Kothari",
    phone: "+91 98110 55432",
    email: "neelam.k@jewels.in",
    interest: "Corporate Membership (15 pax)",
    status: "CONTACTED",
    createdAt: "2026-10-01T11:15:00.000Z",
  },
  {
    id: "LEAD-103",
    source: "TRIAL_BOOKING",
    name: "Zahir Khan",
    phone: "+91 99300 88771",
    email: "zahir.khan@pace.co",
    interest: "Cricket Net Trial",
    status: "TRIAL_SCHEDULED",
    createdAt: "2026-10-03T09:20:00.000Z",
    details: { sport: "cricket-net", skillLevel: "ADVANCED" },
  },
];

// Helper to generate public weekly anonymised availability
export function generateWeekAvailability(weekStartDate: Date, sport: string): DayAvailability[] {
  const days: DayAvailability[] = [];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Filter courts matching sport
  const matchingCourts = COURTS.filter((c) => c.sport === sport);
  const totalCourtsForSport = matchingCourts.length || 3;

  for (let i = 0; i < 7; i++) {
    const current = new Date(weekStartDate);
    current.setDate(weekStartDate.getDate() + i);

    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;

    const slots: Record<string, any> = {};

    TIME_SLOTS.forEach((slot) => {
      const [hh] = slot.split(":").map(Number);
      // Realistic simulation:
      // Peak hours (18:00 - 21:00) have fewer free courts
      const isPeak = hh >= 18 && hh <= 21;
      const isMorning = hh >= 6 && hh <= 8;

      let freeCount: number;
      // Deterministic hash based on date and slot for consistent SSR/client rendering
      const hash = (current.getDate() * 17 + hh * 7 + slot.charCodeAt(3)) % 10;

      if (isPeak) {
        freeCount = hash > 6 ? 1 : 0; // mostly full
      } else if (isMorning) {
        freeCount = (hash % totalCourtsForSport) + 1;
      } else {
        freeCount = Math.min(totalCourtsForSport, (hash % (totalCourtsForSport + 1)));
      }

      let status: "MANY_FREE" | "FEW_FREE" | "FULL" | "CLOSED" = "MANY_FREE";
      if (freeCount === 0) status = "FULL";
      else if (freeCount === 1) status = "FEW_FREE";
      else status = "MANY_FREE";

      slots[slot] = {
        time: slot,
        totalCourts: totalCourtsForSport,
        freeCourts: freeCount,
        status,
      };
    });

    days.push({
      date: dateStr,
      dayName: dayNames[i],
      dayNumber: current.getDate(),
      slots,
    });
  }

  return days;
}
