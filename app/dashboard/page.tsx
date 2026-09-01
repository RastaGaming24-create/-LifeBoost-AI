"use client";

import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import AuthGuard from "../../components/AuthGuard";
import BankConnection from "../../components/BankConnection";
import { useAuth } from "../../components/AuthProvider";
import StatsCard from "../../components/dashboard/StatsCard";
import { calculateTotals, Transaction } from "../../lib/finance";
import { db } from "../../lib/firebase";

export default function Dashboard() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  useEffect(() => { if (!user) return; return onSnapshot(collection(db, "users", user.uid, "transactions"), snap => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)))); }, [user]);
  const totals = useMemo(() => calculateTotals(transactions), [transactions]);
  const stats = [
    { title: "Balance mensual", value: money(totals.balance), icon: "◆" },
    { title: "Ingreso semanal", value: money(totals.weeklyIncome), icon: "↑" },
    { title: "Ingreso mensual", value: money(totals.currentMonthIncome), icon: "↑" },
    { title: "Gastos del mes", value: money(totals.currentMonthExpenses), icon: "↓" },
  ];
  return <AuthGuard><main className="min-h-screen bg-slate-950 text-white"><Navbar /><div className="mx-auto max-w-7xl px-6 py-10 lg:px-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-blue-400">Tu centro financiero</p><h1 className="mt-2 text-4xl font-bold tracking-tight">Dashboard</h1><p className="mt-2 max-w-2xl text-slate-400">Tus datos se sincronizan de forma segura con tu cuenta.</p></div><Link href="/finances" className="rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-semibold transition hover:bg-blue-500">Agregar movimiento</Link></div>
    <section aria-label="Resumen financiero" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(stat => <StatsCard key={stat.title} {...stat} />)}</section>
    <section className="mt-8"><BankConnection /></section>
    <section className="mt-8 grid gap-6 lg:grid-cols-3"><div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 lg:col-span-2"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Actividad reciente</h2><p className="mt-1 text-sm text-slate-400">Últimos movimientos registrados, incluidos los sincronizados desde tu banco.</p></div><span className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-400">{transactions.length} movimientos</span></div>{transactions.length === 0 ? <div className="mt-8 flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-sm text-slate-500">Sin movimientos todavía. Agrega uno desde Finanzas o conecta tu banco.</div> : <div className="mt-5 space-y-3">{transactions.slice(0, 6).map(t => <div key={t.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4"><div><p className="font-medium">{t.description}</p><p className="text-xs text-slate-500">{t.category}{t.source === "plaid" ? " · Banco sincronizado" : ""}</p></div><span className={t.type === "income" ? "font-semibold text-emerald-400" : "font-semibold text-red-400"}>{t.type === "income" ? "+" : "-"}{money(t.amount)}</span></div>)}</div>}</div><div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"><h2 className="text-lg font-semibold">Próximo paso</h2><p className="mt-3 text-sm leading-6 text-slate-400">Conecta tu banco o registra movimientos manualmente. Después usa la IA para encontrar oportunidades de ahorro e ingresos.</p><div className="mt-6 space-y-3 text-sm"><Link href="/finances" className="block rounded-xl bg-slate-950 p-4 text-slate-300 hover:bg-slate-800">1. Configura tus finanzas →</Link><Link href="/goals" className="block rounded-xl bg-slate-950 p-4 text-slate-300 hover:bg-slate-800">2. Define una meta →</Link><Link href="/ai" className="block rounded-xl bg-slate-950 p-4 text-slate-300 hover:bg-slate-800">3. Pregunta a la IA cómo ahorrar →</Link></div></div></section>
  </div></main></AuthGuard>;
}
function money(value: number) { return `$${value.toFixed(2)}`; }
