"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { calculateTotals, Transaction, TransactionType } from "../../lib/finance";

const categories = ["Vivienda", "Comida", "Transporte", "Deudas", "Ahorro", "Entretenimiento", "Otros"];

export default function FinancesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState("Otros");

  const totals = useMemo(() => calculateTotals(transactions), [transactions]);

  function addTransaction(event: FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!description.trim() || !Number.isFinite(value) || value <= 0) return;
    setTransactions((current) => [
      { id: crypto.randomUUID(), description: description.trim(), amount: value, type, category, date: new Date().toISOString() },
      ...current,
    ]);
    setDescription("");
    setAmount("");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <p className="text-sm font-medium text-blue-400">Control financiero</p>
        <h1 className="mt-2 text-4xl font-bold">Finanzas</h1>
        <p className="mt-3 max-w-2xl text-slate-400">Registra ingresos y gastos y observa tu balance en tiempo real.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Summary label="Ingresos" value={totals.income} />
          <Summary label="Gastos" value={totals.expenses} />
          <Summary label="Balance" value={totals.balance} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
          <form onSubmit={addTransaction} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold">Nuevo movimiento</h2>
            <label className="mt-5 block text-sm text-slate-400">Descripción<input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500" placeholder="Ej. Renta" /></label>
            <label className="mt-4 block text-sm text-slate-400">Monto<input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500" placeholder="0.00" /></label>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="text-sm text-slate-400">Tipo<select value={type} onChange={(e) => setType(e.target.value as TransactionType)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"><option value="expense">Gasto</option><option value="income">Ingreso</option></select></label>
              <label className="text-sm text-slate-400">Categoría<select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white">{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>
            <button className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500">Agregar movimiento</button>
          </form>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold">Movimientos recientes</h2>
            {transactions.length === 0 ? <p className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">Todavía no tienes movimientos. Agrega el primero usando el formulario.</p> : <div className="mt-5 space-y-3">{transactions.map((transaction) => <div key={transaction.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4"><div><p className="font-medium">{transaction.description}</p><p className="text-sm text-slate-500">{transaction.category}</p></div><p className={transaction.type === "income" ? "font-semibold text-emerald-400" : "font-semibold text-red-400"}>{transaction.type === "income" ? "+" : "-"}${transaction.amount.toFixed(2)}</p></div>)}</div>}
          </section>
        </div>

        <Link href="/dashboard" className="mt-8 inline-block rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold hover:bg-slate-800">Volver al Dashboard</Link>
      </div>
    </main>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold">${value.toFixed(2)}</p></div>;
}
