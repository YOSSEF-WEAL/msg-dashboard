"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/client";

type Claims = Record<string, any> | null;

type AuthContextValue = {
  user: any | null;
  claims: Claims;
  loading: boolean;
  error: any | null;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const UNPROTECTED_PREFIXES = [
  "/auth/login",
  "/auth/sign-up",
  "/auth/forgot-password",
  "/auth/update-password",
  "/auth/confirm",
  "/auth/error",
  "/auth/sign-up-success",
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);
  const [claims, setClaims] = useState<Claims>(null);
  const [user, setUser] = useState<any | null>(null);

  const isUnprotected = useMemo(
    () => UNPROTECTED_PREFIXES.some((p) => pathname?.startsWith(p)),
    [pathname]
  );

  const refresh = async () => {
    const supabase = createClient();
    setLoading(true);
    setError(null);
    try {
      // Prefer getClaims per your requirement
      const { data, error } = await supabase.auth.getClaims();
      if (error) throw error;

      const hasClaims = !!data?.claims;
      setClaims(hasClaims ? data!.claims : null);

      // Also fetch user for convenience
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData?.user ?? null);

      if (!hasClaims && !isUnprotected) {
        router.replace("/auth/login");
      }
    } catch (e: any) {
      setClaims(null);
      setUser(null);
      setError(e);
      if (!isUnprotected) {
        router.replace("/auth/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      // When auth state changes, re-check
      refresh();
    });
    return () => {
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, claims, loading, error, refresh }),
    [user, claims, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
