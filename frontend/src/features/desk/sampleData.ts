import type {
  DeskMember,
  DeskCheckinEligibility,
  DeskBookingRecord,
  DeskPaymentRecord,
} from "./types";
import type { MemberTier, Sport } from "@/features/booking/types";

const FIRST_NAMES = [
  "Pratham", "Priya", "Rohan", "Neha", "Aarav", "Vikram", "Ananya", "Karthik",
  "Meera", "Suresh", "Divya", "Amit", "Pooja", "Rajesh", "Sneha", "Aditya",
  "Kavita", "Sameer", "Tanvi", "Rahul", "Sania", "Rohan", "Dev", "Isha",
  "Nikhil", "Ritu", "Varun", "Simran", "Kabir", "Zara", "Manish", "Shreya",
  "Akash", "Anushka", "Gaurav", "Deepika", "Kunal", "Swati", "Harsh", "Tara",
  "Yash", "Avani", "Siddharth", "Aishwarya", "Abhishek", "Sonam", "Arjun", "Kareena",
  "Ranveer", "Alia", "Shahid", "Kiara", "Hrithik", "Katrina", "Salman", "Madhuri",
  "Sachin", "Mithali", "Virat", "Smriti"
];

const LAST_NAMES = [
  "Patel", "Sharma", "Kapoor", "Gupta", "Mehta", "Singh", "Iyer", "Nair",
  "Reddy", "Joshi", "Agarwal", "Verma", "Kumar", "Rao", "Bhat", "Deshmukh",
  "Kulkarni", "Shah", "Dravid", "Mirza", "Bopanna", "Chopra", "Malhotra", "Khanna",
  "Menon", "Pillai", "Mukherjee", "Banerjee", "Bose", "Dutta", "Sen", "Roy"
];

function generate60Members(): DeskMember[] {
  const members: DeskMember[] = [
    // Required key test members:
    {
      id: "CC-000123",
      name: "Pratham Patel",
      email: "pratham.patel@example.com",
      phone: "+91 98201 12345",
      dob: "1994-06-18",
      gender: "M",
      address: "B-402, Sea Breeze Towers, Worli Sea Face, Mumbai 400018",
      tier: "Gold",
      status: "ACTIVE",
      validTill: "2026-11-14",
      daysRemaining: 42,
      dues: 640,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      qrToken: "QR_TOKEN_CC_000123_GOLD_ACTIVE",
      emergencyContact: { name: "Rohit Patel", phone: "+91 98201 99887" },
      nextBooking: {
        id: "BK-8021",
        courtName: "Tennis 2",
        date: "2026-10-03",
        time: "18:00–19:00",
        sport: "tennis",
        status: "CONFIRMED",
      },
      tags: ["Tennis Regular", "Courtside Lounge VIP", "Prefers Court 2"],
      notes: [
        {
          id: "N-1",
          staffName: "Anita (Desk Manager)",
          timestamp: Date.now() - 86400000 * 5,
          text: "Prefers morning slots on Tennis 2. Requests Wilson balls at turnstile.",
          isPrivate: true,
        },
      ],
      memberSince: "14 Nov 2023",
    },
    {
      id: "CC-000102",
      name: "Priya Sharma",
      email: "priya.sharma@example.com",
      phone: "+91 98111 23456",
      dob: "1996-03-22",
      gender: "F",
      address: "Flat 12, Golf Links Apartments, New Delhi 110003",
      tier: "Gold",
      status: "EXPIRING_SOON",
      validTill: "2026-10-11",
      daysRemaining: 8,
      dues: 0,
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      qrToken: "QR_TOKEN_CC_000102_EXPIRING",
      emergencyContact: { name: "Karan Sharma", phone: "+91 98111 77665" },
      nextBooking: {
        id: "BK-8022",
        courtName: "Padel 1",
        date: "2026-10-03",
        time: "17:30–18:30",
        sport: "padel",
        status: "CONFIRMED",
      },
      tags: ["Padel League", "Early Renewal Candidate"],
      notes: [
        {
          id: "N-2",
          staffName: "Rahul (Front Desk)",
          timestamp: Date.now() - 86400000 * 2,
          text: "Reminded about renewal expiring in 8 days. Will renew online via UPI.",
          isPrivate: true,
        },
      ],
      memberSince: "11 Oct 2024",
    },
    {
      id: "CC-000103",
      name: "Rohan Kapoor",
      email: "rohan.kapoor@example.com",
      phone: "+91 97170 34567",
      dob: "1991-09-12",
      gender: "M",
      address: "74, Jubilee Hills, Road No. 36, Hyderabad 500033",
      tier: "Silver",
      status: "EXPIRED",
      validTill: "2026-09-28",
      daysRemaining: 0,
      dues: 1450,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      qrToken: "QR_TOKEN_CC_000103_EXPIRED",
      emergencyContact: { name: "Sunil Kapoor", phone: "+91 97170 11223" },
      tags: ["Lapsed", "Outstanding Bar Tab"],
      notes: [
        {
          id: "N-3",
          staffName: "Anita (Desk Manager)",
          timestamp: Date.now() - 86400000 * 4,
          text: "Account expired. Please settle bar tab before renewing Silver plan.",
          isPrivate: true,
        },
      ],
      memberSince: "28 Sep 2023",
    },
    {
      id: "CC-000104",
      name: "Neha Gupta",
      email: "neha.gupta@example.com",
      phone: "+91 98450 45678",
      dob: "1998-12-05",
      gender: "F",
      address: "88, Indiranagar 100ft Road, Bengaluru 560038",
      tier: "Gold",
      status: "PENDING_PAYMENT",
      validTill: "2026-10-03",
      daysRemaining: 0,
      dues: 18000,
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      qrToken: "QR_TOKEN_CC_000104_PENDING",
      emergencyContact: { name: "Anand Gupta", phone: "+91 98450 88990" },
      tags: ["New Registration", "Awaiting Payment"],
      notes: [],
      memberSince: "03 Oct 2026",
    },
    {
      id: "CC-000105",
      name: "Aarav Mehta",
      email: "arjun.mehta+aarav@example.com",
      phone: "+91 98200 12345",
      dob: "2012-08-14",
      gender: "M",
      address: "10B, Silver Oaks, Altamount Road, Mumbai 400026",
      tier: "Junior",
      status: "ACTIVE",
      validTill: "2027-04-15",
      daysRemaining: 194,
      dues: 0,
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
      qrToken: "QR_TOKEN_CC_000105_JUNIOR",
      emergencyContact: { name: "Arjun Mehta", phone: "+91 98200 12345" },
      guardian: {
        name: "Arjun Mehta",
        phone: "+91 98200 12345",
        relationship: "Father",
        consentSigned: true,
      },
      nextBooking: {
        id: "BK-8025",
        courtName: "Badminton 1",
        date: "2026-10-03",
        time: "16:30–17:30",
        sport: "badminton",
        status: "CONFIRMED",
      },
      tags: ["Junior Academy", "Under-16 Champion", "Guardian Verified"],
      notes: [
        {
          id: "N-5",
          staffName: "Coach Dave",
          timestamp: Date.now() - 86400000 * 10,
          text: "Turns 18 in 2030. Coached by Dave on Saturdays.",
          isPrivate: false,
        },
      ],
      memberSince: "15 Apr 2024",
    },
  ];

  // Generate 55 more realistic members
  for (let i = 6; i <= 60; i++) {
    const fn = FIRST_NAMES[(i - 1) % FIRST_NAMES.length]!;
    const ln = LAST_NAMES[(i * 3) % LAST_NAMES.length]!;
    const fullName = `${fn} ${ln}`;
    const id = `CC-${String(100 + i).padStart(6, "0")}`;
    const phone = `+91 98${String(10000000 + i * 38291).slice(0, 8)}`;
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}@example.com`;

    const tiers: MemberTier[] = ["Gold", "Silver", "Silver", "Gold", "Junior", "Guest"];
    const tier = tiers[i % tiers.length]!;

    const statuses: ("ACTIVE" | "EXPIRING_SOON" | "ACTIVE" | "SUSPENDED" | "EXPIRED")[] = [
      "ACTIVE", "ACTIVE", "EXPIRING_SOON", "ACTIVE", "ACTIVE", "EXPIRED", "ACTIVE"
    ];
    const status = statuses[i % statuses.length]!;

    const daysRemaining = status === "EXPIRING_SOON" ? 5 + (i % 8) : status === "EXPIRED" ? 0 : 40 + (i * 5);
    const dues = i % 5 === 0 ? 450 + (i * 20) : i % 9 === 0 ? 1200 : 0;

    const sports: Sport[] = ["tennis", "padel", "badminton", "cricket-net"];
    const hasBookingToday = i % 3 === 0;

    members.push({
      id,
      name: fullName,
      email,
      phone,
      dob: `19${80 + (i % 25)}-0${1 + (i % 9)}-${10 + (i % 18)}`,
      gender: i % 2 === 0 ? "M" : "F",
      address: `${10 + i}, Sports View Enclave, Sector ${12 + (i % 20)}, Gurugram 122001`,
      tier,
      status,
      validTill: `2027-0${1 + (i % 9)}-15`,
      daysRemaining,
      dues,
      avatar: `https://images.unsplash.com/photo-${1500000000000 + i * 1000000}?w=150&auto=format&fit=crop&q=80`,
      qrToken: `QR_TOKEN_${id}_${tier}`,
      emergencyContact: {
        name: `Emergency Contact ${i}`,
        phone: `+91 98${String(20000000 + i * 19283).slice(0, 8)}`,
      },
      nextBooking: hasBookingToday
        ? {
            id: `BK-80${i}`,
            courtName: `${sports[i % sports.length] === "tennis" ? "Tennis 1" : sports[i % sports.length] === "padel" ? "Padel 2" : "Badminton 1"}`,
            date: "2026-10-03",
            time: `${14 + (i % 6)}:00–${15 + (i % 6)}:00`,
            sport: sports[i % sports.length]!,
            status: "CONFIRMED",
          }
        : undefined,
      tags: [i % 2 === 0 ? "Weekend Regular" : "Morning Player", `${tier} Member`],
      notes: [],
      memberSince: `202${2 + (i % 4)}-06-15`,
    });
  }

  return members;
}

export let DESK_MEMBERS: DeskMember[] = generate60Members();

// ── Desk Bookings Initial List ──
export const SAMPLE_DESK_BOOKINGS: DeskBookingRecord[] = [
  {
    id: "BK-8021",
    courtId: "tc-2",
    courtName: "Tennis 2",
    sport: "tennis",
    date: "2026-10-03",
    startTime: "18:00",
    endTime: "19:00",
    memberName: "Pratham Patel",
    memberId: "CC-000123",
    tier: "Gold",
    price: 0,
    status: "CONFIRMED",
    source: "online",
    paymentMethod: "Member Card",
  },
  {
    id: "BK-8022",
    courtId: "pd-1",
    courtName: "Padel 1",
    sport: "padel",
    date: "2026-10-03",
    startTime: "17:30",
    endTime: "18:30",
    memberName: "Priya Sharma",
    memberId: "CC-000102",
    tier: "Gold",
    price: 0,
    status: "CONFIRMED",
    source: "online",
    paymentMethod: "Member Card",
  },
  {
    id: "BK-8025",
    courtId: "bd-1",
    courtName: "Badminton 1",
    sport: "badminton",
    date: "2026-10-03",
    startTime: "16:30",
    endTime: "17:30",
    memberName: "Aarav Mehta",
    memberId: "CC-000105",
    tier: "Junior",
    price: 150,
    status: "CONFIRMED",
    source: "phone",
    paymentMethod: "Pay Later",
  },
  {
    id: "BK-8019",
    courtId: "tc-1",
    courtName: "Tennis 1",
    sport: "tennis",
    date: "2026-10-03",
    startTime: "15:00",
    endTime: "16:00",
    memberName: "Vikram Singh",
    memberId: "CC-000106",
    tier: "Silver",
    price: 300,
    status: "CHECKED_IN",
    source: "walk-in",
    paymentMethod: "UPI",
    checkedInAt: Date.now() - 3600000 * 0.5,
  },
  {
    id: "BK-8015",
    courtId: "cn-1",
    courtName: "Cricket Net 1",
    sport: "cricket-net",
    date: "2026-10-03",
    startTime: "14:00",
    endTime: "15:00",
    memberName: "Suresh Reddy",
    memberId: "CC-000110",
    tier: "Silver",
    price: 500,
    status: "COMPLETED",
    source: "online",
    paymentMethod: "Card",
  },
];

// ── Desk Payments Initial List ──
export const SAMPLE_DESK_PAYMENTS: DeskPaymentRecord[] = [
  {
    id: "TXN-88210",
    invoiceNumber: "CCMS/26-27/0842",
    date: "2026-10-03",
    timestamp: Date.now() - 3600000 * 1,
    memberId: "CC-000123",
    memberName: "Pratham Patel",
    category: "SHOP",
    amount: 20159,
    method: "UPI",
    status: "COMPLETED",
    source: "online",
    reference: "UPI_9928371029",
  },
  {
    id: "TXN-88209",
    invoiceNumber: "CCMS/26-27/0841",
    date: "2026-10-03",
    timestamp: Date.now() - 3600000 * 2,
    memberId: "CC-000106",
    memberName: "Vikram Singh",
    category: "COURT",
    amount: 300,
    method: "UPI",
    status: "COMPLETED",
    source: "walk-in",
    reference: "UPI_7718290012",
  },
  {
    id: "TXN-88190",
    invoiceNumber: "CCMS/26-27/0839",
    date: "2026-10-02",
    timestamp: Date.now() - 86400000 * 1,
    memberId: "CC-000110",
    memberName: "Suresh Reddy",
    category: "COURT",
    amount: 500,
    method: "Card",
    status: "COMPLETED",
    source: "online",
    reference: "CARD_9921_VISA",
  },
  {
    id: "TXN-88172",
    invoiceNumber: "CCMS/26-27/0822",
    date: "2026-10-01",
    timestamp: Date.now() - 86400000 * 2,
    memberId: "CC-000105",
    memberName: "Aarav Mehta",
    category: "MEMBERSHIP",
    amount: 6000,
    method: "Cash",
    status: "COMPLETED",
    source: "walk-in",
  },
];

// ── Search Typeahead over ~60 members ──
export function searchDeskMembers(query: string): DeskMember[] {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();

  return DESK_MEMBERS.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.phone.replace(/[\s-]/g, "").includes(q.replace(/[\s-]/g, "")) ||
      m.id.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
  ).slice(0, 10);
}

// ── Lookup Member by ID, phone, or QR token ──
export function getMemberByIdOrToken(tokenOrId: string): DeskMember | undefined {
  const clean = tokenOrId.trim();
  return DESK_MEMBERS.find(
    (m) =>
      m.id.toLowerCase() === clean.toLowerCase() ||
      m.qrToken === clean ||
      m.phone.replace(/[\s-]/g, "") === clean.replace(/[\s-]/g, "")
  );
}

// ── Check-in Eligibility Calculator (3 Rows: Membership, Booking, Dues) ──
export function getCheckinEligibility(memberId: string): DeskCheckinEligibility | null {
  const member = DESK_MEMBERS.find((m) => m.id.toLowerCase() === memberId.toLowerCase());
  if (!member) return null;

  const membershipValid = member.status === "ACTIVE" || member.status === "EXPIRING_SOON";
  const membershipStatusText = membershipValid
    ? `Membership ACTIVE (${member.daysRemaining} days remaining)`
    : member.status === "EXPIRED"
    ? `Membership EXPIRED on ${member.validTill}`
    : member.status === "SUSPENDED"
    ? "Membership SUSPENDED by Management"
    : "Membership PENDING ACTIVATION PAYMENT";

  const booking = member.nextBooking
    ? {
        id: member.nextBooking.id,
        courtName: member.nextBooking.courtName,
        time: member.nextBooking.time,
        sport: member.nextBooking.sport,
        status: member.nextBooking.status,
      }
    : null;

  const bookingStatusText = booking
    ? `Booking Today: ${booking.courtName} · ${booking.time}`
    : "No court booked for today";

  const duesStatusText =
    member.dues > 0
      ? `Outstanding Balance: ₹${member.dues} (Unsettled tab / dues)`
      : "No outstanding balance (Dues clear)";

  const canCheckIn = membershipValid && Boolean(booking);

  return {
    member,
    membershipValid,
    membershipStatusText,
    todayBooking: booking,
    bookingStatusText,
    duesAmount: member.dues,
    duesStatusText,
    canCheckIn,
  };
}

// ── Perform Check-in ──
export function performDeskCheckin(memberId: string): { success: boolean; message: string } {
  const memberIndex = DESK_MEMBERS.findIndex((m) => m.id === memberId);
  if (memberIndex === -1) return { success: false, message: "Member not found" };

  const member = DESK_MEMBERS[memberIndex]!;
  if (member.nextBooking) {
    member.nextBooking.status = "CHECKED_IN";
  }

  // Update in bookings list as well
  const bkg = SAMPLE_DESK_BOOKINGS.find((b) => b.memberId === memberId && b.date === "2026-10-03");
  if (bkg) {
    bkg.status = "CHECKED_IN";
    bkg.checkedInAt = Date.now();
  }

  return { success: true, message: `Checked in ${member.name} successfully.` };
}

// ── Register New Member ──
export function registerNewDeskMember(data: {
  name: string;
  phone: string;
  email: string;
  dob: string;
  gender?: "M" | "F" | "Other" | undefined;
  address: string;
  emergencyName: string;
  emergencyPhone: string;
  tier: MemberTier;
  guardianName?: string | undefined;
  guardianPhone?: string | undefined;
  guardianConsent?: boolean | undefined;
  paymentMethod: "Cash" | "UPI" | "Card" | "Pay later";
}): DeskMember {
  const nextIdNum = 160 + DESK_MEMBERS.length;
  const newId = `CC-${String(nextIdNum).padStart(6, "0")}`;
  const now = new Date();
  const validTill = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString().split("T")[0]!;

  const newMember: DeskMember = {
    id: newId,
    name: data.name,
    email: data.email,
    phone: data.phone,
    dob: data.dob,
    gender: data.gender,
    address: data.address,
    tier: data.tier,
    status: data.paymentMethod === "Pay later" ? "PENDING_PAYMENT" : "ACTIVE",
    validTill,
    daysRemaining: 365,
    dues: data.paymentMethod === "Pay later" ? 18000 : 0,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    qrToken: `QR_TOKEN_${newId}_${data.tier}`,
    emergencyContact: {
      name: data.emergencyName,
      phone: data.emergencyPhone,
    },
    guardian: data.guardianName
      ? {
          name: data.guardianName,
          phone: data.guardianPhone ?? "",
          relationship: "Guardian",
          consentSigned: Boolean(data.guardianConsent),
        }
      : undefined,
    tags: ["New Registration", `${data.tier} Member`],
    notes: [],
    memberSince: new Date().toISOString().split("T")[0]!,
  };

  DESK_MEMBERS = [newMember, ...DESK_MEMBERS];
  return newMember;
}

// ── Walk-in Booking Creator ──
export function createDeskWalkInBooking(data: {
  courtId: string;
  courtName: string;
  sport: Sport;
  date: string;
  startTime: string;
  endTime: string;
  memberName: string;
  memberId: string;
  tier: MemberTier | "Guest";
  price: number;
  paymentMethod: "Cash" | "UPI" | "Card" | "Pay Later";
  source: "walk-in" | "phone";
}): DeskBookingRecord {
  const newBooking: DeskBookingRecord = {
    id: `BK-${Date.now().toString(36).toUpperCase()}`,
    courtId: data.courtId,
    courtName: data.courtName,
    sport: data.sport,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    memberName: data.memberName,
    memberId: data.memberId,
    tier: data.tier,
    price: data.price,
    status: "CONFIRMED",
    source: data.source,
    paymentMethod: data.paymentMethod,
  };

  SAMPLE_DESK_BOOKINGS.unshift(newBooking);

  if (data.price > 0 && data.paymentMethod !== "Pay Later") {
    SAMPLE_DESK_PAYMENTS.unshift({
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      invoiceNumber: `CCMS/26-27/${Math.floor(1000 + Math.random() * 9000)}`,
      date: data.date,
      timestamp: Date.now(),
      memberId: data.memberId,
      memberName: data.memberName,
      category: "COURT",
      amount: data.price,
      method: data.paymentMethod,
      status: "COMPLETED",
      source: data.source,
    });
  }

  return newBooking;
}

// ── Daily Front Desk KPIs ──
export function getTodayDeskStats() {
  return {
    checkinsToday: 42,
    bookingsToday: SAMPLE_DESK_BOOKINGS.filter((b) => b.date === "2026-10-03").length + 28,
    courtsFreeNow: 3,
    expiringSoon: DESK_MEMBERS.filter((m) => m.status === "EXPIRING_SOON").length,
  };
}

// ── Arriving Next 60 Min ──
export function getArrivingNext60Min() {
  return [
    {
      time: "17:30",
      member: DESK_MEMBERS.find((m) => m.id === "CC-000102")!,
      court: "Padel 1",
      bookingId: "BK-8022",
      status: "CONFIRMED",
    },
    {
      time: "18:00",
      member: DESK_MEMBERS.find((m) => m.id === "CC-000123")!,
      court: "Tennis 2",
      bookingId: "BK-8021",
      status: "CONFIRMED",
    },
    {
      time: "18:00",
      member: DESK_MEMBERS[7]!,
      court: "Badminton 2",
      bookingId: "BK-8028",
      status: "CONFIRMED",
    },
    {
      time: "18:30",
      member: DESK_MEMBERS[9]!,
      court: "Cricket Net 1",
      bookingId: "BK-8031",
      status: "CONFIRMED",
    },
  ];
}

// ── Expiring Soon Members (≤15 days) ──
export function getExpiringSoonMembers() {
  return DESK_MEMBERS.filter((m) => m.status === "EXPIRING_SOON" || (m.daysRemaining > 0 && m.daysRemaining <= 15)).slice(0, 6);
}
