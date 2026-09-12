"use client";

import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import AuthGuard from "../../components/AuthGuard";
import { useAuth } from "../../components/AuthProvider";
import StatsCard from "../../components/dashboard/StatsCard";
import { calculateTotals, isTransfer, Transaction } from "../../lib/finance";
import { db } from "../../lib/firebase";

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export default function Dashboard() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      collection(db, "users", user.uid, "transactions"),
      snap => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction))),
    );
  }, [user]);

  const totals = useMemo(() => calculateTotals(transactions), [transactions]);
  const selectedMonthTotals = useMemo(() => {
    let income = 0;
    let expenses = 0;

    for (const transaction of transactions) {
      if (isTransfer(transaction)) continue;
      const date = new Date(transaction.date);
      if (Number.isNaN(date.getTime())) continue;
      if (date.getFullYear() !== selectedYear || date.getMonth() !== selectedMonth) continue;

      const amount = Math.abs(Number(transaction.amount) || 0);
      if (transaction.type === "income") income += amount;
      if (transaction.type === "expense") expenses += amount;
    }

    return { income, expenses };
  }, [transactions, selectedMonth, selectedYear]);

  const displayName = user?.displayName?.split(" ")[0] || "amigo";
  const selectedMonthLabel = `${MONTHS[selectedMonth]} de ${selectedYear}`;
  const incomeWidth = selectedMonthTotals.income + selectedMonthTotals.expenses > 0
    ? (selectedMonthTotals.income / (selectedMonthTotals.income + selectedMonthTotals.expenses)) * 100
    : 0;
  const expenseWidth = 100 - incomeWidth;
  const availableYears = useMemo(() => {
    const years = new Set<number>([now.getFullYear()]);
    for (const transaction of transactions) {
      const date = new Date(transaction.date);
      if (!Number.isNaN(date.getTime())) years.add(date.getFullYear());
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, now.getFullYear()]);

  const stats = [
    { title: "Balance mensual", value: money(totals.balance), icon: "↘" },
    { title: "Ingreso semanal", value: money(totals.weeklyIncome), icon: "↑" },
    { title: "Ingreso mensual", value: money(totals.currentMonthIncome), icon: "↑" },
    { title: "Gastos del mes", value: money(totals.currentMonthExpenses), icon: "↓" },
  ];

  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
          <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-400">Smart Finance</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Hola, {displayName} 👋</h1>
              <p className="mt-2 text-sm text-slate-400 sm:text-base">Aquí está tu resumen financiero de {selectedMonthLabel}.</p>
            </div>
            <Link href="/finances" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-bold shadow-lg shadow-blue-900/20 transition hover:bg-blue-500">Agregar movimiento</Link>
          </header>

          <section aria-label="Resumen financiero" className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map(stat => <StatsCard key={stat.title} {...stat} />)}
          </section>

          <section className="mt-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-xl shadow-black/20 sm:p-6">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-bold">Resumen del mes</h2>
                <p className="text-sm text-slate-400">Ingresos frente a gastos reales registrados.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-400">
                  <span className="mb-1.5 flex items-center gap-2">▣ Mes</span>
                  <select
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(Number(event.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm font-semibold capitalize text-slate-200 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    aria-label="Seleccionar mes"
                  >
                    {MONTHS.map((month, index) => <option key={month} value={index}>{month}</option>)}
                  </select>
                </label>

                <label className="block text-xs font-medium text-slate-400">
                  <span className="mb-1.5 flex items-center gap-2">▣ Año</span>
                  <select
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(Number(event.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm font-semibold text-slate-200 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    aria-label="Seleccionar año"
                  >
                    {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4"><p className="text-sm text-slate-400">Ingresos</p><p className="mt-1 text-2xl font-extrabold text-emerald-400">{money(selectedMonthTotals.income)}</p></div>
              <div className="rounded-2xl border border-rose-500/10 bg-rose-500/5 p-4"><p className="text-sm text-slate-400">Gastos</p><p className="mt-1 text-2xl font-extrabold text-rose-400">{money(selectedMonthTotals.expenses)}</p></div>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800" aria-label="Comparación de ingresos y gastos">
              <div className="flex h-full"><div className="h-full bg-emerald-400" style={{ width: `${incomeWidth}%` }} /><div className="h-full bg-rose-400" style={{ width: `${expenseWidth}%` }} /></div>
            </div>
            <div className="mt-3 flex justify-between text-xs text-slate-500"><span>Ingresos</span><span>Gastos</span></div>
          </section>

          <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-lg font-bold">Cuenta bancaria</h2><p className="mt-1 text-sm text-slate-400">La conexión y sincronización del banco se administran desde la sección Banco.</p></div>
              <Link href="/bank" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-700 px-4 text-sm font-semibold hover:bg-slate-800">Gestionar banco →</Link>
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10 sm:p-6">
              <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Movimientos recientes</h2><p className="mt-1 text-sm text-slate-400">Últimos movimientos de tu cuenta.</p></div><Link href="/finances" className="text-sm font-semibold text-blue-400 hover:text-blue-300">Ver todos</Link></div>
              {transactions.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">Sin movimientos todavía. Conecta tu banco o agrega uno manualmente.</div> : <div className="mt-5 space-y-2">{transactions.slice(0, 6).map(t => <div key={t.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-100">{t.description}</p><p className="mt-1 truncate text-xs text-slate-500">{t.category}{t.source === "plaid" ? " · Banco" : " · Manual"}</p></div><span className={t.type === "income" ? "shrink-0 text-sm font-extrabold text-emerald-400" : "shrink-0 text-sm font-extrabold text-rose-400"}>{t.type === "income" ? "+" : "-"}{money(t.amount)}</span></div>)}</div>}
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10 sm:p-6"><h2 className="text-lg font-bold">Siguiente paso</h2><p className="mt-3 text-sm leading-6 text-slate-400">Organiza tus movimientos, define una meta y usa LifeBoost AI para encontrar oportunidades de ahorro.</p><div className="mt-5 space-y-2"><Link href="/finances" className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm font-semibold transition hover:border-blue-500/40 hover:bg-slate-800">💰 Configura tus finanzas <span className="float-right text-blue-400">→</span></Link><Link href="/goals" className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm font-semibold transition hover:border-blue-500/40 hover:bg-slate-800">🎯 Define una meta <span className="float-right text-blue-400">→</span></Link><Link href="/ai" className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm font-semibold transition hover:border-blue-500/40 hover:bg-slate-800">🤖 Habla con la IA <span className="float-right text-blue-400">→</span></Link></div></div>
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}

function money(value: number) { return `$${value.toFixed(2)}`; }
