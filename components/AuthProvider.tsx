"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth, firebaseConfigured } from "../lib/firebase";

type AuthContextValue = { user: User | null; loading: boolean; configured: boolean };
const AuthContext = createContext<AuthContextValue>({ user: null, loading: true, configured: firebaseConfigured });

async function syncConnectedBanks(user: User) {
  try {
    const idToken = await user.getIdToken(true);
    const response = await fetch("/api/plaid/sync-all", {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}` },
      cache: "no-store",
    });
    if (!response.ok) console.error("LifeBoost AI automatic bank sync failed:", response.status);
  } catch (error) {
    console.error("LifeBoost AI automatic bank sync error:", error);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured) { setLoading(false); return; }
    return onAuthStateChanged(auth, (nextUser) => { setUser(nextUser); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!user) return;
    let lastSync = 0;
    let active = true;

    const syncIfNeeded = async () => {
      if (!active) return;
      const now = Date.now();
      if (now - lastSync < 5 * 60 * 1000) return;
      lastSync = now;
      await syncConnectedBanks(user);
    };

    void syncIfNeeded();
    window.addEventListener("focus", syncIfNeeded);
    document.addEventListener("visibilitychange", syncIfNeeded);
    return () => {
      active = false;
      window.removeEventListener("focus", syncIfNeeded);
      document.removeEventListener("visibilitychange", syncIfNeeded);
    };
  }, [user]);

  const value = useMemo(() => ({ user, loading, configured: firebaseConfigured }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
