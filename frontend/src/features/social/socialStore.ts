import { useSyncExternalStore, useCallback } from "react";
import type { SocialSession, SocialParticipant, MemberTier } from "@/features/booking/types";
import { generateSampleSocialSessions } from "@/features/booking/sampleData";
import { bookingStore } from "@/features/booking/bookingStore";

let socialSessions: SocialSession[] = generateSampleSocialSessions();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function getSnapshot() {
  return socialSessions;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export interface JoinResult {
  success: boolean;
  status: "JOINED" | "WAITLISTED" | "CAP_EXCEEDED" | "ALREADY_JOINED";
  message: string;
  waitlistPosition?: number | undefined;
  pricePaid: number;
}

export interface LeaveResult {
  success: boolean;
  promotedParticipant?: SocialParticipant | undefined;
}

export const socialStore = {
  getAll: () => socialSessions,

  getById: (id: string): SocialSession | undefined => {
    return socialSessions.find((s) => s.id === id);
  },

  join: (
    sessionId: string,
    memberName: string = "Arjun Mehta",
    tier: MemberTier = "Silver"
  ): JoinResult => {
    const session = socialSessions.find((s) => s.id === sessionId);
    if (!session) {
      return {
        success: false,
        status: "CAP_EXCEEDED",
        message: "Session not found",
        pricePaid: 0,
      };
    }

    // Check if already in participants or waitlist
    const alreadyParticipant = session.participants.some(
      (p) => p.isSelf || p.name.toLowerCase() === memberName.toLowerCase()
    );
    const alreadyWaitlist = session.waitlist.some(
      (w) => w.isSelf || w.name.toLowerCase() === memberName.toLowerCase()
    );

    if (alreadyParticipant || alreadyWaitlist) {
      return {
        success: false,
        status: "ALREADY_JOINED",
        message: "You have already registered for this session.",
        pricePaid: 0,
      };
    }

    // Check 2 bookings/day rule (BR-07)
    // Count member's bookings on session.date + social sessions joined on session.date
    const memberDateBookings = bookingStore
      .getAll()
      .filter(
        (b) =>
          b.date === session.date &&
          b.memberId === "SELF" &&
          b.status !== "CANCELLED" &&
          b.status !== "EXPIRED"
      ).length;

    const otherSocialOnDate = socialSessions.filter(
      (s) =>
        s.date === session.date &&
        s.id !== sessionId &&
        s.participants.some((p) => p.isSelf)
    ).length;

    if (memberDateBookings + otherSocialOnDate >= 2) {
      return {
        success: false,
        status: "CAP_EXCEEDED",
        message:
          "Daily quota reached: You already have 2 bookings/sessions on this date (Rule BR-07: Max 2 bookings per day).",
        pricePaid: 0,
      };
    }

    const price = session.pricing[tier] ?? 150;
    const now = Date.now();

    // If capacity is not full (< 8)
    if (session.participants.length < session.capacity) {
      const newParticipant: SocialParticipant = {
        id: `P-SELF-${now}`,
        name: memberName,
        tier,
        joinedAt: now,
        isSelf: true,
      };

      socialSessions = socialSessions.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          participants: [...s.participants, newParticipant],
        };
      });

      notify();
      return {
        success: true,
        status: "JOINED",
        message: `Successfully registered for ${session.title}! (Charged ₹${price})`,
        pricePaid: price,
      };
    }

    // Capacity is full (8/8) -> Join waitlist
    const nextPos = session.waitlist.length + 1;
    const waitlistEntry = {
      id: `W-SELF-${now}`,
      name: memberName,
      tier,
      joinedAt: now,
      position: nextPos,
      isSelf: true,
    };

    socialSessions = socialSessions.map((s) => {
      if (s.id !== sessionId) return s;
      return {
        ...s,
        waitlist: [...s.waitlist, waitlistEntry],
      };
    });

    notify();
    return {
      success: true,
      status: "WAITLISTED",
      message: `Session is full (8/8). You have joined the waitlist at Position #${nextPos}.`,
      waitlistPosition: nextPos,
      pricePaid: 0,
    };
  },

  leave: (sessionId: string, targetIdOrSelf?: string): LeaveResult => {
    const session = socialSessions.find((s) => s.id === sessionId);
    if (!session) return { success: false };

    // Check if target is in participants
    const participantIndex = session.participants.findIndex((p) =>
      targetIdOrSelf ? p.id === targetIdOrSelf : p.isSelf
    );

    // If target is in waitlist
    const waitlistIndex = session.waitlist.findIndex((w) =>
      targetIdOrSelf ? w.id === targetIdOrSelf : w.isSelf
    );

    let promoted: SocialParticipant | undefined;

    if (participantIndex !== -1) {
      // Remove participant
      const updatedParticipants = [...session.participants];
      updatedParticipants.splice(participantIndex, 1);

      let updatedWaitlist = [...session.waitlist];

      // Auto-promote 1st waitlisted person if exists!
      if (updatedWaitlist.length > 0) {
        const [firstInLine, ...remainingWaitlist] = updatedWaitlist;
        if (firstInLine) {
          promoted = {
            id: firstInLine.id.replace("W-", "P-"),
            name: firstInLine.name,
            tier: firstInLine.tier,
            joinedAt: Date.now(),
            isSelf: firstInLine.isSelf,
          };
          updatedParticipants.push(promoted);
          // Re-index remaining waitlist positions
          updatedWaitlist = remainingWaitlist.map((w, idx) => ({
            ...w,
            position: idx + 1,
          }));
        }
      }

      socialSessions = socialSessions.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          participants: updatedParticipants,
          waitlist: updatedWaitlist,
        };
      });

      notify();
      return { success: true, promotedParticipant: promoted };
    }

    if (waitlistIndex !== -1) {
      // Remove from waitlist and re-index
      const updatedWaitlist = session.waitlist
        .filter((_, idx) => idx !== waitlistIndex)
        .map((w, idx) => ({ ...w, position: idx + 1 }));

      socialSessions = socialSessions.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          waitlist: updatedWaitlist,
        };
      });

      notify();
      return { success: true };
    }

    return { success: false };
  },

  // Simulate a random spot update
  simulateSpotUpdate: () => {
    // Pick a session that isn't full or empty
    const session = socialSessions[0];
    if (!session) return;
    // Notify to trigger animation
    notify();
  },
};

export function useSocialPlay() {
  const sessions = useSyncExternalStore(subscribe, getSnapshot);

  const joinSession = useCallback(
    (sessionId: string, memberName?: string, tier?: MemberTier) => {
      return socialStore.join(sessionId, memberName, tier);
    },
    []
  );

  const leaveSession = useCallback((sessionId: string, targetIdOrSelf?: string) => {
    return socialStore.leave(sessionId, targetIdOrSelf);
  }, []);

  const getSession = useCallback((id: string) => {
    return socialStore.getById(id);
  }, []);

  return {
    sessions,
    joinSession,
    leaveSession,
    getSession,
  };
}
