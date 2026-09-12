"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import AuthGuard from "../../components/AuthGuard";
import { useAuth } from "../../components/AuthProvider";

type UserRow = { id: string; email?: string; name?: string; role?: string; createdAt?: string | null };

export default function AdminPage() {
  const { user } = useAuth();
  const [allowed, setAllowed] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    setError("");

    (async () => {
      try {
        const token = await user.getIdToken(true);
        const response = await fetch("/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) {
          if (active) {
            setAllowed(false);
            setError(data?.error || "No tienes permisos de administrador.");
          }
          return;
        }
        if (active) {
          setAllowed(true);
          setUsers(Array.isArray(data?.users) ? data.users : []);
        }
      } catch (err) {
        if (active) {
          setAllowed(false);
          setError(err instanceof Error ? err.message : "No se pudo cargar la administración.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [user]);

  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
          <h1 className="text-4xl font-bold">Administración</h1>
          {loading ? (
            <p className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-5 text-slate-400">Cargando administración…</p>
          ) : !allowed ? (
            <p className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-5 text-slate-400">{error || "No tienes permisos de administrador."}</p>
          ) : (
            <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Usuarios</h2>
                <span className="rounded-lg bg-slate-800 px-3 py-1 text-sm text-slate-400">{users.length}</span>
              </div>
              <div className="mt-5 space-y-3">
                {users.map((u) => (
                  <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div>
                      <p className="font-medium">{u.name || "Sin nombre"}</p>
                      <p className="text-sm text-slate-500">{u.email || "Sin correo"}</p>
                    </div>
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">{u.role || "user"}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
