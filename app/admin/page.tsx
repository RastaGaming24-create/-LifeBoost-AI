"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import Navbar from "../../components/Navbar";
import AuthGuard from "../../components/AuthGuard";
import { useAuth } from "../../components/AuthProvider";
import { db } from "../../lib/firebase";

type UserRow = { id: string; email?: string; name?: string; role?: string; createdAt?: { seconds?: number } };
export default function AdminPage() {
  const { user } = useAuth(); const [allowed, setAllowed] = useState(false); const [users, setUsers] = useState<UserRow[]>([]);
  useEffect(() => { if (!user) return; getDoc(doc(db, "users", user.uid)).then(s => setAllowed(s.exists() && s.data().role === "admin")); }, [user]);
  useEffect(() => { if (!allowed) return; return onSnapshot(collection(db, "users"), snap => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserRow)))); }, [allowed]);
  return <AuthGuard><main className="min-h-screen bg-slate-950 text-white"><Navbar /><div className="mx-auto max-w-6xl px-6 py-10 lg:px-8"><h1 className="text-4xl font-bold">Administración</h1>{!allowed ? <p className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-5 text-slate-400">No tienes permisos de administrador.</p> : <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Usuarios</h2><span className="rounded-lg bg-slate-800 px-3 py-1 text-sm text-slate-400">{users.length}</span></div><div className="mt-5 space-y-3">{users.map(u => <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4"><div><p className="font-medium">{u.name || "Sin nombre"}</p><p className="text-sm text-slate-500">{u.email || "Sin correo"}</p></div><span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">{u.role || "user"}</span></div>)}</div></section>}</div></main></AuthGuard>;
}
