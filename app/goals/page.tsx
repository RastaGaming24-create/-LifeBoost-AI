"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import Navbar from "../../components/Navbar";
import AuthGuard from "../../components/AuthGuard";
import { useAuth } from "../../components/AuthProvider";
import { auth, db } from "../../lib/firebase";

type Goal = { id: string; name: string; target: number; saved: number; deadline: string };
type SyncState = "idle" | "syncing" | "synced" | "error";

const FIRESTORE_BASE = "https://firestore.googleapis.com/v1/projects/life-boost-ai/databases/(default)/documents";
const FIREBASE_API_KEY = "AIzaSyCFvsz5ZKHircfQ8CgvPxf2E_f-tDGWuKg";

function firebaseError(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? String((error as { code?: string }).code) : "";
  const messages: Record<string, string> = {
    "permission-denied": "Firebase rechazó el acceso. Verifica las reglas de Firestore para tu cuenta.",
    "failed-precondition": "Firestore necesita configuración adicional.",
    "unavailable": "Firebase no respondió. Comprueba tu conexión e inténtalo nuevamente.",
  };
  return messages[code] || (error instanceof Error ? error.message : "No se pudo sincronizar con Firebase.");
}

function firestoreValue(value: unknown) {
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "number" && Number.isInteger(value)) return { integerValue: String(value) };
  if (typeof value === "number") return { doubleValue: value };
  return { stringValue: String(value ?? "") };
}

function fromFirestore(document: any): Goal {
  const fields = document?.fields || {};
  const read = (name: string) => {
    const field = fields[name];
    if (!field) return "";
    if ("stringValue" in field) return field.stringValue;
    if ("integerValue" in field) return Number(field.integerValue);
    if ("doubleValue" in field) return Number(field.doubleValue);
    return "";
  };
  const id = String(document?.name || "").split("/").pop() || crypto.randomUUID();
  return {
    id,
    name: String(read("name")),
    target: Number(read("target")) || 0,
    saved: Number(read("saved")) || 0,
    deadline: String(read("deadline")),
  };
}

async function getIdToken() {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("No hay una sesión de Firebase activa.");
  return currentUser.getIdToken(true);
}

async function restRequest(path: string, options: RequestInit = {}) {
  const token = await getIdToken();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${FIRESTORE_BASE}/${path}${path.includes("?") ? "&" : "?"}key=${FIREBASE_API_KEY}`, {
      ...options,
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(options.headers || {}) },
    });
    const text = await response.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    if (!response.ok) {
      const error = new Error(data?.error?.message || `Firestore respondió ${response.status}.`) as Error & { code?: string };
      if (data?.error?.status === "PERMISSION_DENIED") error.code = "permission-denied";
      throw error;
    }
    return data;
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [deadline, setDeadline] = useState("");
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [syncError, setSyncError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setGoals([]);
      setSyncState("idle");
      setSyncError("");
      return;
    }

    let active = true;
    setSyncState("syncing");
    setSyncError("");

    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "goals"),
      { includeMetadataChanges: true },
      (snap) => {
        if (!active) return;
        setGoals(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Goal)));
        if (!snap.metadata.fromCache && !snap.metadata.hasPendingWrites) setSyncState("synced");
      },
      (error) => {
        console.error("LifeBoost AI goals listener error:", error);
        if (active) {
          setSyncState("error");
          setSyncError(`No se pudieron sincronizar tus metas. ${firebaseError(error)}`);
        }
      },
    );

    restRequest(`users/${encodeURIComponent(user.uid)}/goals?pageSize=100`)
      .then((data) => {
        if (!active) return;
        const remote = Array.isArray(data?.documents) ? data.documents.map(fromFirestore) : [];
        setGoals(remote);
        setSyncState("synced");
        setSyncError("");
      })
      .catch((error) => {
        console.error("LifeBoost AI goals REST read error:", error);
        if (active && goals.length === 0) {
          setSyncState("error");
          setSyncError(`No se pudieron cargar tus metas. ${firebaseError(error)}`);
        }
      });

    return () => { active = false; unsubscribe(); };
  }, [user]);

  const totalTarget = useMemo(() => goals.reduce((sum, goal) => sum + goal.target, 0), [goals]);
  const totalSaved = useMemo(() => goals.reduce((sum, goal) => sum + goal.saved, 0), [goals]);

  async function addGoal(event: FormEvent) {
    event.preventDefault();
    const t = Number(target);
    const s = Number(saved || 0);
    if (!user || !name.trim() || !Number.isFinite(t) || t <= 0 || !Number.isFinite(s) || s < 0 || saving) return;

    setSaving(true);
    setSyncState("syncing");
    setSyncError("");
    const goal = { name: name.trim(), target: t, saved: Math.min(s, t), deadline };

    try {
      const fields = Object.fromEntries(Object.entries(goal).map(([key, value]) => [key, firestoreValue(value)]));
      const data = await restRequest(`users/${encodeURIComponent(user.uid)}/goals`, {
        method: "POST",
        body: JSON.stringify({ fields }),
      });
      const created = fromFirestore(data);
      setGoals((current) => [created, ...current.filter((item) => item.id !== created.id)]);
      setName("");
      setTarget("");
      setSaved("");
      setDeadline("");
      setSyncState("synced");
    } catch (error) {
      console.error("LifeBoost AI goal write error:", error);
      setSyncState("error");
      setSyncError(`La meta no pudo guardarse en Firebase. ${firebaseError(error)}`);
    } finally {
      setSaving(false);
    }
  }

  async function removeGoal(id: string) {
    if (!user || !id) return;
    setSyncState("syncing");
    setSyncError("");
    try {
      await restRequest(`users/${encodeURIComponent(user.uid)}/goals/${encodeURIComponent(id)}`, { method: "DELETE" });
      setGoals((current) => current.filter((item) => item.id !== id));
      setSyncState("synced");
    } catch (error) {
      console.error("LifeBoost AI goal delete error:", error);
      setSyncState("error");
      setSyncError(`No se pudo eliminar la meta. ${firebaseError(error)}`);
    }
  }

  async function addSavings(id: string, current: Goal) {
    const amount = Number(window.prompt("¿Cuánto quieres agregar a esta meta?", "100"));
    if (!user || !Number.isFinite(amount) || amount <= 0) return;
    setSyncState("syncing");
    setSyncError("");
    try {
      await restRequest(`users/${encodeURIComponent(user.uid)}/goals/${encodeURIComponent(id)}?updateMask.fieldPaths=saved`, {
        method: "PATCH",
        body: JSON.stringify({ fields: { saved: firestoreValue(Math.min(current.target, current.saved + amount)) } }),
      });
      setGoals((items) => items.map((item) => item.id === id ? { ...item, saved: Math.min(item.target, item.saved + amount) } : item));
      setSyncState("synced");
    } catch (error) {
      console.error("LifeBoost AI goal savings error:", error);
      setSyncState("error");
      setSyncError(`No se pudo actualizar el ahorro de la meta. ${firebaseError(error)}`);
    }
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
          <p className="text-sm font-medium text-blue-400">Plan de crecimiento</p>
          <h1 className="mt-2 text-4xl font-bold">Metas</h1>
          <p className="mt-3 max-w-2xl text-slate-400">Tus objetivos quedan sincronizados con tu cuenta.</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className={syncState === "synced" ? "rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-400" : syncState === "error" ? "rounded-full bg-red-500/10 px-3 py-1 text-red-400" : "rounded-full bg-blue-500/10 px-3 py-1 text-blue-400"}>
              {syncState === "synced" ? "✓ Sincronizado con Firebase" : syncState === "error" ? "⚠ Error de sincronización" : "⟳ Sincronizando..."}
            </span>
          </div>
          {syncError && <div className="mt-4 rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">{syncError}</div>}

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Summary label="Objetivos" value={goals.length.toString()} />
            <Summary label="Progreso total" value={`${money(totalSaved)} / ${money(totalTarget)}`} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
            <form onSubmit={addGoal} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold">Crear una meta</h2>
              <label className="mt-5 block text-sm text-slate-400">Nombre<input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Fondo de emergencia" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" /></label>
              <label className="mt-4 block text-sm text-slate-400">Monto objetivo<input required type="number" min="1" max="100000000" step="0.01" value={target} onChange={(e) => setTarget(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" /></label>
              <label className="mt-4 block text-sm text-slate-400">Ya ahorrado<input type="number" min="0" max="100000000" step="0.01" value={saved} onChange={(e) => setSaved(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" /></label>
              <label className="mt-4 block text-sm text-slate-400">Fecha límite<input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" /></label>
              <button disabled={saving} type="submit" className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Guardando…" : "Crear meta"}</button>
            </form>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold">Tus metas</h2>
              {goals.length === 0 ? <p className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">{syncState === "error" ? "No se pudieron cargar las metas." : "Todavía no tienes metas."}</p> : <div className="mt-5 space-y-4">{goals.map((goal) => { const progress = goal.target > 0 ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0; return <div key={goal.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{goal.name}</h3><p className="mt-1 text-sm text-slate-500">{money(goal.saved)} de {money(goal.target)}{goal.deadline ? ` · límite ${goal.deadline}` : ""}</p></div><span className="text-sm font-bold text-blue-400">{progress}%</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-blue-500" style={{ width: `${progress}%` }} /></div><div className="mt-4 flex gap-2"><button onClick={() => addSavings(goal.id, goal)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold">Agregar ahorro</button><button onClick={() => removeGoal(goal.id)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:text-red-400">Eliminar</button></div></div>; })}</div>}
            </section>
          </div>

          <Link href="/dashboard" className="mt-8 inline-block rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold">Volver al Dashboard</Link>
        </div>
      </main>
    </AuthGuard>
  );
}

function money(n: number) { return `$${n.toFixed(2)}`; }
function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>; }
