"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";

type Goal = { id: string; name: string; target: number; saved: number; deadline: string };
const KEY = "lifeboost-goals";

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [name, setName] = useState(""); const [target, setTarget] = useState(""); const [saved, setSaved] = useState(""); const [deadline, setDeadline] = useState("");
  useEffect(() => { try { const data = localStorage.getItem(KEY); if (data) setGoals(JSON.parse(data)); } catch { localStorage.removeItem(KEY); } }, []);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(goals)); }, [goals]);
  const totalTarget = useMemo(() => goals.reduce((s, g) => s + g.target, 0), [goals]);
  const totalSaved = useMemo(() => goals.reduce((s, g) => s + g.saved, 0), [goals]);

  function addGoal(e: FormEvent) { e.preventDefault(); const t = Number(target), s = Number(saved || 0); if (!name.trim() || !Number.isFinite(t) || t <= 0 || s < 0) return; setGoals(g => [{ id: crypto.randomUUID(), name: name.trim(), target: t, saved: Math.min(s, t), deadline }, ...g]); setName(""); setTarget(""); setSaved(""); setDeadline(""); }
  function removeGoal(id: string) { setGoals(g => g.filter(x => x.id !== id)); }
  function addSavings(id: string) { const amount = Number(window.prompt("¿Cuánto quieres agregar a esta meta?", "100")); if (!Number.isFinite(amount) || amount <= 0) return; setGoals(g => g.map(x => x.id === id ? { ...x, saved: Math.min(x.target, x.saved + amount) } : x)); }

  return <main className="min-h-screen bg-slate-950 text-white"><Navbar /><div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
    <p className="text-sm font-medium text-blue-400">Plan de crecimiento</p><h1 className="mt-2 text-4xl font-bold">Metas</h1><p className="mt-3 max-w-2xl text-slate-400">Define objetivos financieros y mide tu progreso.</p>
    <div className="mt-8 grid gap-4 md:grid-cols-2"><Summary label="Objetivos" value={goals.length.toString()} /><Summary label="Progreso total" value={`${money(totalSaved)} / ${money(totalTarget)}`} /></div>
    <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={addGoal} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"><h2 className="text-xl font-semibold">Crear una meta</h2>
        <label className="mt-5 block text-sm text-slate-400">Nombre<input required value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Fondo de emergencia" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" /></label>
        <label className="mt-4 block text-sm text-slate-400">Monto objetivo<input required type="number" min="1" step="0.01" value={target} onChange={e => setTarget(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" /></label>
        <label className="mt-4 block text-sm text-slate-400">Ya ahorrado<input type="number" min="0" step="0.01" value={saved} onChange={e => setSaved(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" /></label>
        <label className="mt-4 block text-sm text-slate-400">Fecha límite<input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" /></label>
        <button className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500">Crear meta</button>
      </form>
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"><h2 className="text-xl font-semibold">Tus metas</h2>{goals.length === 0 ? <p className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">Todavía no tienes metas.</p> : <div className="mt-5 space-y-4">{goals.map(g => { const progress = Math.round((g.saved / g.target) * 100); return <div key={g.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{g.name}</h3><p className="mt-1 text-sm text-slate-500">{money(g.saved)} de {money(g.target)}{g.deadline ? ` · límite ${g.deadline}` : ""}</p></div><span className="text-sm font-bold text-blue-400">{progress}%</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-blue-500" style={{ width: `${progress}%` }} /></div><div className="mt-4 flex gap-2"><button onClick={() => addSavings(g.id)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold hover:bg-blue-500">Agregar ahorro</button><button onClick={() => removeGoal(g.id)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:text-red-400">Eliminar</button></div></div>; })}</div>}</section>
    </div><Link href="/dashboard" className="mt-8 inline-block rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold hover:bg-slate-800">Volver al Dashboard</Link>
  </div></main>;
}
function money(n: number) { return `$${n.toFixed(2)}`; }
function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>; }
