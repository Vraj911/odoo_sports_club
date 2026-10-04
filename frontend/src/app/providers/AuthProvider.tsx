import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AUTH_STORAGE_KEY, ROLE_LABELS } from "@/lib/constants";
import type { AuthUser, PermissionGroup, PrimaryRole } from "@/types/common";

import { memberStore } from "@/features/member/memberStore";

interface AuthContextValue {
  user: AuthUser | null;
  /** False until sessionStorage has been read on the client. */
  ready: boolean;
  loginAs: (role: PrimaryRole, groups?: PermissionGroup[], name?: string, id?: string, email?: string, tier?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Auth state held in React state, persisted to sessionStorage and sent as actor header to backend. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthUser;
        // Migration: ensure groups array exists (old sessions may lack it)
        if (!Array.isArray(parsed.groups)) parsed.groups = [];
        const savedTier = parsed.tier || (parsed.email ? sessionStorage.getItem(`ccms_user_tier_${parsed.email.toLowerCase()}`) : null) || undefined;
        if (savedTier && !parsed.tier) {
          parsed.tier = savedTier;
        }
        setUser(parsed);
        if (parsed.role === "MEMBER") {
          memberStore.init(parsed.email, parsed.tier);
        }
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const loginAs = useCallback(
    (role: PrimaryRole, groups: PermissionGroup[] = [], name?: string, id?: string, email?: string, tier?: string) => {
      const next: AuthUser = { id, name: name || `Demo ${ROLE_LABELS[role]}`, role, groups, email, tier };
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
      if (email && tier) {
        sessionStorage.setItem(`ccms_user_tier_${email.toLowerCase()}`, tier);
      }
      setUser(next);
      if (role === "MEMBER") {
        memberStore.init(email, tier);
      }
    },
    []
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  }, []);


  const value = useMemo(() => ({ user, ready, loginAs, logout }), [user, ready, loginAs, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
