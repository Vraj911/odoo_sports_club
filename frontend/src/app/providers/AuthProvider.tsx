import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AUTH_STORAGE_KEY, ROLE_LABELS } from "@/lib/constants";
import type { AuthUser, Role } from "@/types/common";

interface AuthContextValue {
  user: AuthUser | null;
  /** False until sessionStorage has been read on the client. */
  ready: boolean;
  loginAs: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** STUB auth: role held in React state, persisted to sessionStorage. No API. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const loginAs = useCallback((role: Role) => {
    const next: AuthUser = { name: `Demo ${ROLE_LABELS[role]}`, role };
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
    setUser(next);
  }, []);

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
