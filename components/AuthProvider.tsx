"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth, firebaseConfigured } from "../lib/firebase";

type AuthContextValue = { user: User | null; loading: boolean; configured: boolean };
const AuthContext = createContext<AuthContextValue>({ user: null, loading: true, configured: firebaseConfigured });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured) { setLoading(false); return; }
    return onAuthStateChanged(auth, (nextUser) => { setUser(nextUser); setLoading(false); });
  }, []);

  const value = useMemo(() => ({ user, loading, configured: firebaseConfigured }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
