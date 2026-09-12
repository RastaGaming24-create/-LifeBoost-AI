"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import AuthGuard from "../../components/AuthGuard";
import { useAuth } from "../../components/AuthProvider";

type UserRow = { id: string; email?: string; name?: string; role?: string; createdAt?: string | null };
type SecurityCheck = { id: string; severity: string; status: "pass" | "warning" | "fail"; message: string };

type SecurityResult = {
  ok: boolean;
  checkedAt: string;
  summary: { total: number; failed: number; warnings: number };
  checks: SecurityCheck[];
};

export default function AdminPage() {
  const { user } = useAuth();
  const [allowed, setAllowed] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [security, setSecurity] = useState<SecurityResult | null>(null);
  const [securityLoading, setSecurityLoading] = useState(false);

  async function loadSecurity(currentUser = user) {
    if (!currentUser) return;
    setSecurityLoading(true);
    try {
      const token = await currentUser.getIdToken(true);
      const response = await fetch("/api/admin/security", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (response.ok) setSecurity(data);
    } finally {
      setSecurityLoading(false);
    }
  }

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
          void loadSecurity(user);
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
            <>
              <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Centro de seguridad</h2>
                    <p className="mt-1 text-sm text-slate-500">Comprueba automáticamente la configuración sensible sin leer ni mostrar datos bancarios.</p>
                  </div>
                  <button type="button" onClick={() => void loadSecurity()} disabled={securityLoading} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-800 disabled:opacity-50">
                    {securityLoading ? "Verificando…" : "Verificar ahora"}
                  </button>
                </div>

                {security && (
                  <>
                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Comprobaciones</p><p className="mt-1 text-xl font-bold">{security.summary.total}</p></div>
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Alertas</p><p className="mt-1 text-xl font-bold text-amber-400">{security.summary.warnings}</p></div>
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Fallos</p><p className="mt-1 text-xl font-bold text-red-400">{security.summary.failed}</p></div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {security.checks.map((check) => (
                        <div key={check.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
                          <div><p className="text-sm font-medium">{check.message}</p><p className="text-xs text-slate-600">{check.id} · {check.severity}</p></div>
                          <span className={check.status === "pass" ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400" : check.status === "fail" ? "rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-400" : "rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-400"}>{check.status === "pass" ? "Seguro" : check.status === "fail" ? "Fallo" : "Revisar"}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-slate-600">Última comprobación: {new Date(security.checkedAt).toLocaleString("es-US")}. La auditoría no devuelve valores de secretos, access tokens, movimientos ni saldos.</p>
                  </>
                )}
              </section>

              <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Usuarios</h2>
                  <span className="rounded-lg bg-slate-800 px-3 py-1 text-sm text-slate-400">{users.length}</span>
                </div>
                <div className="mt-5 space-y-3">
                  {users.map((u) => (
                    <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
                      <div><p className="font-medium">{u.name || "Sin nombre"}</p><p className="text-sm text-slate-500">{u.email || "Sin correo"}</p></div>
                      <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">{u.role || "user"}</span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
