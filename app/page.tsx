"use client";

import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../components/AuthProvider";
import { calculateTotals, Transaction } from "../lib/finance";
import { db } from "../lib/firebase";

const features = [
  { title: "Control financiero", text: "Visualiza ingresos, gastos, ahorros y patrimonio en un solo lugar." },
  { title: "Metas claras", text: "Organiza objetivos financieros y conviértelos en acciones concretas." },
  { title: "Asistencia con IA", text: "Recibe orientación general para analizar presupuesto, ahorro, deudas y metas." },
];

function money(value: number) { return `$${value.toFixed(2)}`; }

export default function Home() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user) { setTransactions([]); return; }
    const transactionsRef = collection(db, "users", user.uid, "transactions");
    return onSnapshot(
      transactionsRef,
      (snap) => setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction))),
      (error) => console.error("LifeBoost AI home financial preview error:", error),
    );
  }, [user]);

  const totals = useMemo(() => calculateTotals(transactions), [transactions]);
  const netWorth = totals.monthlyBalance;
  const savings = Math.max(netWorth, 0);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.18),transparent_35%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-32">
          <div className="flex flex-col justify-center">
            <span className="mb-5 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300">Finanzas más simples. Decisiones más inteligentes.</span>
            <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">Construye una vida financiera más fuerte con <span className="text-blue-400">LifeBoost AI</span>.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Una plataforma para organizar tu dinero, controlar tus gastos, alcanzar metas y convertir tus números en un plan accionable.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth" className="rounded-xl bg-blue-600 px-6 py-3 text-center font-semibold hover:bg-blue-500">Crear cuenta gratis</Link>
              <Link href="/finances" className="rounded-xl border border-slate-700 bg-slate-900/60 px-6 py-3 text-center font-semibold hover:bg-slate-800">Ver mis finanzas</Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-blue-950/20 backdrop-blur">
            <p className="text-sm font-medium text-slate-400">Vista previa financiera</p>
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm text-slate-400">Patrimonio neto</p>
              <p className="mt-2 text-4xl font-bold">{money(netWorth)}</p>
              <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full w-1/3 rounded-full bg-blue-500" /></div>
              <p className="mt-3 text-xs text-slate-500">{user ? `${transactions.length} movimiento${transactions.length === 1 ? "" : "s"} sincronizado${transactions.length === 1 ? "" : "s"}.` : "Inicia sesión para ver tus datos."}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><p className="text-xs text-slate-400">Ingreso mensual</p><p className="mt-1 text-xl font-semibold">{money(totals.monthlyIncome)}</p></div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><p className="text-xs text-slate-400">Gastos mensuales</p><p className="mt-1 text-xl font-semibold">{money(totals.monthlyExpenses)}</p></div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><p className="text-xs text-slate-400">Ahorro estimado</p><p className="mt-1 text-xl font-semibold">{money(savings)}</p></div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><p className="text-xs text-slate-400">Ingreso semanal</p><p className="mt-1 text-xl font-semibold">{money(totals.recurringWeekly)}</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">{features.map((feature) => <article key={feature.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"><h2 className="text-xl font-semibold">{feature.title}</h2><p className="mt-3 leading-7 text-slate-400">{feature.text}</p></article>)}</div>
        <footer className="mt-14 flex flex-wrap gap-5 border-t border-slate-800 pt-6 text-sm text-slate-500"><Link href="/privacy" className="hover:text-white">Privacidad</Link><Link href="/terms" className="hover:text-white">Términos</Link><Link href="/auth" className="hover:text-white">Cuenta</Link><span>© 2026 LifeBoost AI</span></footer>
      </section>
    </main>
  );
}
