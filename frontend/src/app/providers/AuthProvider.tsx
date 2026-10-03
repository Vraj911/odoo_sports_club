import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AUTH_STORAGE_KEY, ROLE_LABELS } from "@/lib/constants";
import type { AuthUser, PermissionGroup, PrimaryRole } from "@/types/common";
import { api } from "@/lib/axios";

interface MemberResponse {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role?: string;
}

interface ApiResponse<T> {
  data: T;
  message: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** False until sessionStorage has been read on the client. */
  ready: boolean;
  loginAs: (role: PrimaryRole, groups?: PermissionGroup[], name?: string) => void;
  loginWithCredentials: (login: string, password: string) => Promise<AuthUser>;
  registerMember: (values: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<AuthUser>;
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
      if (raw) {
        const parsed = JSON.parse(raw) as AuthUser;
        // Migration: ensure groups array exists (old sessions may lack it)
        if (!Array.isArray(parsed.groups)) parsed.groups = [];
        setUser(parsed);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const loginAs = useCallback((role: PrimaryRole, groups: PermissionGroup[] = [], name?: string) => {
    const next: AuthUser = { name: name || `Demo ${ROLE_LABELS[role]}`, role, groups };
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
    setUser(next);
  }, []);

  const loginWithCredentials = useCallback(async (login: string, password: string) => {
    const response = await api.post<ApiResponse<MemberResponse>>("/api/auth/login", { login, password });
    const member = response.data.data;
    const next: AuthUser = {
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      role: "MEMBER",
      groups: [],
    };
    if (member.email) next.email = member.email;
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
    setUser(next);
    return next;
  }, []);

  const registerMember = useCallback(async (values: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    const response = await api.post<ApiResponse<MemberResponse>>("/api/auth/register", values);
    const member = response.data.data;
    const next: AuthUser = {
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      role: "MEMBER",
      groups: [],
    };
    if (member.email) next.email = member.email;
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
    setUser(next);
    return next;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, loginAs, loginWithCredentials, registerMember, logout }),
    [user, ready, loginAs, loginWithCredentials, registerMember, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
