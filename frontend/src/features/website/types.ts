// Types for CCMS Public Website: Facilities, Plans, Availability, Trial, Contact & Leads

import type { Sport } from "@/features/booking/types";

export interface PublicPlan {
  id: string; // e.g. "plan-gold"
  name: string;
  tier: "Gold" | "Silver" | "Junior";
  monthlyFee: number;
  annualFee: number;
  courtRateLabel: string;
  shopDiscountLabel: string;
  barDiscountLabel: string;
  advanceBookingDays: number;
  guestPasses: number;
  popular: boolean;
  tagline: string;
  features: string[];
}

export interface SportRateInfo {
  sport: Sport;
  sportLabel: string;
  goldRate: number;
  silverRate: number;
  juniorRate: number;
  guestRate: number;
  peakSurcharge: number;
}

export interface PublicSlotAvailability {
  time: string; // "06:00"
  totalCourts: number;
  freeCourts: number; // e.g. 3
  status: "MANY_FREE" | "FEW_FREE" | "FULL" | "CLOSED";
}

export interface DayAvailability {
  date: string; // "YYYY-MM-DD"
  dayName: string; // "Mon", "Tue", etc.
  dayNumber: number; // 5
  slots: Record<string, PublicSlotAvailability>; // slot "06:00" -> info
}

export interface FacilityGalleryPhoto {
  id: string;
  title: string;
  category: "COURTS" | "LOUNGE" | "SHOP" | "COMMUNITY";
  imageUrl: string;
  caption: string;
}

export interface TrialBookingPayload {
  sport: Sport;
  date: string;
  timeSlot: string;
  fullName: string;
  phone: string;
  email: string;
  skillLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  paymentMethod: "ONLINE" | "AT_CLUB";
  notes?: string;
}

export interface ContactEnquiryPayload {
  fullName: string;
  phone: string;
  email: string;
  interest: "MEMBERSHIP" | "TRIAL" | "CORPORATE" | "COACHING" | "PRO_SHOP" | "OTHER";
  message: string;
  companyWebsiteHoneypot?: string;
}

export interface CRMLead {
  id: string;
  source: "TRIAL_BOOKING" | "CONTACT_ENQUIRY" | "WALK_IN" | "REFERRAL";
  name: string;
  phone: string;
  email: string;
  interest: string;
  status: "NEW" | "CONTACTED" | "TRIAL_SCHEDULED" | "CONVERTED" | "ARCHIVED";
  createdAt: string;
  details?: Record<string, any>;
}
