import { useSyncExternalStore, useCallback } from "react";
import type {
  MemberProfile,
  MembershipPlan,
  BarTabItem,
  Order,
  Invoice,
  ClubNotification,
  NotificationCategory,
} from "./types";
import {
  SAMPLE_MEMBERS,
  MEMBERSHIP_PLANS,
  SAMPLE_BAR_TAB_ITEMS,
  SAMPLE_ORDERS,
  SAMPLE_INVOICES,
  SAMPLE_NOTIFICATIONS,
  computeRenewalEndDate,
  computePlanChangePreview,
} from "./sampleData";

interface MemberStoreState {
  currentMemberKey: string;
  profile: MemberProfile;
  tabItems: BarTabItem[];
  orders: Order[];
  invoices: Invoice[];
  notifications: ClubNotification[];
}

let state: MemberStoreState = {
  currentMemberKey: "active-gold",
  profile: { ...SAMPLE_MEMBERS["active-gold"]! },
  tabItems: [...SAMPLE_BAR_TAB_ITEMS],
  orders: [...SAMPLE_ORDERS],
  invoices: [...SAMPLE_INVOICES],
  notifications: [...SAMPLE_NOTIFICATIONS],
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function getSnapshot() {
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

import { memberApi } from "@/services/api/memberApi";
import { financeApi } from "@/services/api/financeApi";

export const memberStore = {
  getState: () => state,

  setProfileFromMemberDto: (member: MemberDto | Partial<MemberDto>, explicitTier?: string) => {
    const resolvedName =
      member.fullName ||
      [member.firstName, member.lastName].filter(Boolean).join(" ") ||
      state.profile.name;
    const resolvedCode = member.memberNumber || member.memberCode || state.profile.memberId;
    const storedTier = member.email ? sessionStorage.getItem(`ccms_user_tier_${member.email.toLowerCase()}`) : null;
    const resolvedTier = ((explicitTier || storedTier || member.tier ||
      (member.planName?.toLowerCase().includes("silver")
        ? "Silver"
        : member.planName?.toLowerCase().includes("junior")
        ? "Junior"
        : member.planName?.toLowerCase().includes("platinum")
        ? "Platinum"
        : "Gold")) as MemberProfile["tier"]);

    state = {
      ...state,
      profile: {
        ...state.profile,
        ...(member.id ? { id: member.id } : {}),
        name: resolvedName,
        email: member.email || state.profile.email,
        phone: member.phone || state.profile.phone,
        tier: resolvedTier || state.profile.tier,
        status: (member.status as MemberProfile["status"]) || "ACTIVE",
        memberId: resolvedCode,
      },
    };
    notify();
  },

  init: async (authenticatedEmail?: string, explicitTier?: string) => {
    try {
      const members = await memberApi.listMembers();
      if (members && members.length > 0) {
        let target = members[0];
        if (authenticatedEmail) {
          const found = members.find(
            (m) => m.email && m.email.toLowerCase() === authenticatedEmail.toLowerCase()
          );
          if (found) target = found;
        }
        if (target) {
          memberStore.setProfileFromMemberDto(target, explicitTier);
        }
      }
    } catch (e) {
      console.warn("Could not sync memberStore with backend", e);
    }
  },


  switchMember: (key: string) => {
    const target = SAMPLE_MEMBERS[key];
    if (!target) return;
    state = {
      ...state,
      currentMemberKey: key,
      profile: { ...target },
    };
    notify();
  },

  renewMembership: (planId: string = "plan-gold"): { success: boolean; newValidTill: string; invoiceId: string } => {
    const isExpired = state.profile.status === "EXPIRED";
    const newEnd = computeRenewalEndDate(state.profile.validTill, isExpired);
    const plan = MEMBERSHIP_PLANS.find((p) => p.id === planId) ?? MEMBERSHIP_PLANS[0]!;

    const newInvoiceId = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = Date.now();
    const subtotal = Math.round(plan.annualFee / 1.18 * 100) / 100;
    const gst = Math.round((plan.annualFee - subtotal) / 2 * 100) / 100;

    const newInvoice: Invoice = {
      id: newInvoiceId,
      number: `CCMS/26-27/${newInvoiceId.slice(-4)}`,
      date: new Date().toISOString().split("T")[0]!,
      dueDate: new Date().toISOString().split("T")[0]!,
      status: "PAID",
      category: "MEMBERSHIP",
      items: [
        {
          description: `Annual ${plan.name} Membership Renewal (${state.profile.validTill} to ${newEnd})`,
          hsn: "9995.99.00",
          quantity: 1,
          unitPrice: subtotal,
          amount: subtotal,
        },
      ],
      subtotal,
      cgst: gst,
      sgst: gst,
      total: plan.annualFee,
      paidAt: now,
      paymentMethod: "UPI / Card",
    };

    state = {
      ...state,
      profile: {
        ...state.profile,
        status: "ACTIVE",
        validTill: newEnd,
        daysRemaining: 365,
      },
      invoices: [newInvoice, ...state.invoices],
      notifications: [
        {
          id: `NTF-${Date.now()}`,
          title: "Membership Successfully Renewed",
          message: `Your ${plan.name} membership is active until ${newEnd}. Thank you!`,
          category: "Membership",
          read: false,
          timestamp: now,
          link: "/app/membership",
        },
        ...state.notifications,
      ],
    };

    notify();

    // Sync renewal with backend API
    if (state.profile.id) {
      memberApi.renewMembership(state.profile.id).catch(() => {});
    }

    return { success: true, newValidTill: newEnd, invoiceId: newInvoiceId };
  },

  changePlan: (newPlanId: string) => {
    const targetPlan = MEMBERSHIP_PLANS.find((p) => p.id === newPlanId);
    if (!targetPlan) return;

    const preview = computePlanChangePreview(state.profile, targetPlan);
    const newEnd = computeRenewalEndDate(new Date().toISOString().split("T")[0]!, false);
    const now = Date.now();
    const newInvoiceId = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newInvoice: Invoice = {
      id: newInvoiceId,
      number: `CCMS/26-27/${newInvoiceId.slice(-4)}`,
      date: new Date().toISOString().split("T")[0]!,
      dueDate: new Date().toISOString().split("T")[0]!,
      status: "PAID",
      category: "MEMBERSHIP",
      items: [
        {
          description: `Membership Tier Upgrade to ${targetPlan.name} (Pro-rated)`,
          hsn: "9995.99.00",
          quantity: 1,
          unitPrice: preview.netPayable,
          amount: preview.netPayable,
        },
      ],
      subtotal: Math.round(preview.netPayable / 1.18 * 100) / 100,
      cgst: Math.round((preview.netPayable - preview.netPayable / 1.18) / 2 * 100) / 100,
      sgst: Math.round((preview.netPayable - preview.netPayable / 1.18) / 2 * 100) / 100,
      total: preview.netPayable,
      paidAt: now,
      paymentMethod: "Online Payment",
    };

    state = {
      ...state,
      profile: {
        ...state.profile,
        tier: targetPlan.tier,
        status: "ACTIVE",
        validTill: newEnd,
        daysRemaining: 365,
        entitlements: {
          courtRate: targetPlan.tier === "Gold" ? 0 : targetPlan.tier === "Silver" ? 300 : 150,
          courtDescription: targetPlan.courtRate,
          shopDiscount: targetPlan.tier === "Gold" ? 15 : targetPlan.tier === "Silver" ? 10 : 10,
          barDiscount: targetPlan.tier === "Gold" ? 15 : targetPlan.tier === "Silver" ? 10 : 5,
          advanceBookingDays: targetPlan.advanceBookingDays,
          guestPasses: targetPlan.guestPasses,
        },
      },
      invoices: [newInvoice, ...state.invoices],
      notifications: [
        {
          id: `NTF-${Date.now()}`,
          title: `Upgraded to ${targetPlan.name}!`,
          message: `Your new benefits are effective immediately. Pro-rated charge: ₹${preview.netPayable}.`,
          category: "Membership",
          read: false,
          timestamp: now,
          link: "/app/membership",
        },
        ...state.notifications,
      ],
    };

    notify();
  },

  updateProfile: (updates: Partial<MemberProfile>) => {
    state = {
      ...state,
      profile: { ...state.profile, ...updates },
    };
    notify();
  },

  updateNotificationPreference: (
    categoryKey: string,
    channel: "email" | "inApp" | "sms",
    enabled: boolean
  ) => {
    const current = state.profile.notificationPreferences[categoryKey] ?? {
      email: true,
      inApp: true,
      sms: false,
    };
    state = {
      ...state,
      profile: {
        ...state.profile,
        notificationPreferences: {
          ...state.profile.notificationPreferences,
          [categoryKey]: {
            ...current,
            [channel]: enabled,
          },
        },
      },
    };
    notify();
  },

  requestBill: (): boolean => {
    // Simulates notifying the lounge waiter
    notify();
    return true;
  },

  markNotificationRead: (id: string) => {
    state = {
      ...state,
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    };
    notify();
  },

  markAllNotificationsRead: () => {
    state = {
      ...state,
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    };
    notify();
  },

  payInvoice: (invoiceId: string) => {
    state = {
      ...state,
      invoices: state.invoices.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: "PAID" as const,
              paidAt: Date.now(),
              paymentMethod: "UPI (Paid Online)",
            }
          : inv
      ),
    };
    notify();
  },

  addOrder: (order: Order) => {
    state = {
      ...state,
      orders: [order, ...state.orders],
      notifications: [
        {
          id: `NTF-${Date.now()}`,
          title: `Order Confirmed: #${order.id}`,
          message: `Your Pro Shop order of ₹${order.total.toLocaleString("en-IN")} has been placed successfully.`,
          category: "Orders",
          read: false,
          timestamp: Date.now(),
          link: `/app/orders/${order.id}`,
        },
        ...state.notifications,
      ],
    };
    notify();
  },
};

export function useMember() {
  const store = useSyncExternalStore(subscribe, getSnapshot);

  const switchMember = useCallback((key: string) => {
    memberStore.switchMember(key);
  }, []);

  const renewMembership = useCallback((planId?: string) => {
    return memberStore.renewMembership(planId);
  }, []);

  const changePlan = useCallback((newPlanId: string) => {
    memberStore.changePlan(newPlanId);
  }, []);

  const updateProfile = useCallback((updates: Partial<MemberProfile>) => {
    memberStore.updateProfile(updates);
  }, []);

  const updateNotificationPreference = useCallback(
    (category: string, channel: "email" | "inApp" | "sms", enabled: boolean) => {
      memberStore.updateNotificationPreference(category, channel, enabled);
    },
    []
  );

  const requestBill = useCallback(() => {
    return memberStore.requestBill();
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    memberStore.markNotificationRead(id);
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    memberStore.markAllNotificationsRead();
  }, []);

  const payInvoice = useCallback((id: string) => {
    memberStore.payInvoice(id);
  }, []);

  const addOrder = useCallback((order: Order) => {
    memberStore.addOrder(order);
  }, []);

  const unreadCount = store.notifications.filter((n) => !n.read).length;

  return {
    ...store,
    unreadCount,
    switchMember,
    renewMembership,
    changePlan,
    updateProfile,
    updateNotificationPreference,
    requestBill,
    markNotificationRead,
    markAllNotificationsRead,
    payInvoice,
    addOrder,
  };
}
