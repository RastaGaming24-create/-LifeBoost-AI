"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp } from "firebase/firestore";
import Navbar from "../../components/Navbar";
import AuthGuard from "../../components/AuthGuard";
import { useAuth } from "../../components/AuthProvider";
import { calculateTotals, Transaction, TransactionType } from "../../lib/finance";
import { db } from "../../lib/firebase";

const categories = ["Vivienda", "Comida", "Transporte", "Deudas", "Ahorro", "Entretenimiento", "Otros"];

type SyncState = "idle" | "syncing" | "synced" | "error";

export default function FinancesPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState("Otros");
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [syncError, setSyncError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setSyncState("idle");
      setSyncError("");
      return;
    }

    setSyncState("syncing");
    setSyncError("");

    const transactionsRef = collection(db, "users", user.uid, "transactions");

    return onSnapshot(
      transactionsRef,
      { includeMetadataChanges: true },
      (snap) => {
        const nextTransactions = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
        setTransactions(nextTransactions);
        setSyncState(snap.metadata.fromCache ? "syncing" : "synced");
        if (!snap.metadata.fromCache) setSyncError("");
      },
      (error) => {
        console.error("LifeBoost AI Firestore listener error:", error);
        setSyncState("error");
        setSyncError("No se pudieron cargar tus movimientos desde Firebase. Tus datos no se han eliminado; revisa tu conexión y vuelve a intentarlo.");
      },
    );
  }, [user]);

  const totals = useMemo(() => calculateTotals(transactions), [transactions]);

  async function addTransaction(event: FormEvent) {
    event.preventDefault();
    const value = Number(amount);

    if (!user || !description.trim() || !Number.isFinite(value) || value <= 0 || saving) return;

    setSaving(true);
    setSyncError("");

    try {
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        description: description.trim(),
        amount: value,
        type,
        category,
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });

      setDescription("");
      setAmount("");
      setSyncState("syncing");
    } catch (error) {
      console.error("LifeBoost AI Firestore write error:", error);
      setSyncState("error");
      setSyncError("No se pudo guardar este movimiento en Firebase. No cierres la página hasta volver a intentarlo.");
    } finally {
      setSaving(false);
    }
  }

  async function removeTransaction(id: string) {
    if (!user) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "transactions", id));
    } catch (error) {
      console.error("LifeBoost AI Firestore delete error:", error);
      setSyncState("error");
      setSyncError("No se pudo eliminar el movimiento. Inténtalo nuevamente.");
    }
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
          <p className="text-sm font-medium text-blue-400">Control financiero</p>
          <h1 className="mt-2 text-4xl font-bold">Finanzas</h1>
          <p className="mt-3 max-w-2xl text-slate-400">Tus movimientos se guardan de forma privada en tu cuenta de LifeBoost AI.</p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className={syncState === "synced" ? "rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-400" : syncState === "error" ? "rounded-full bg-red-500/10 px-3 py-1 text-red-400" : "rounded-full bg-blue-500/10 px-3 py-1 text-blue-400"}>
              {syncState === "synced" ? "✓ Sincronizado con Firebase" : syncState === "error" ? "⚠ Error de sincronización" : "⟳ Sincronizando..."}
            </span>
          </div>

          {syncError && (
            <div className="mt-4 rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">
              {syncError}
            </div>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Summary label="Ingresos" value={totals.income} />
            <Summary label="Gastos" value={totals.expenses} />
            <Summary label="Balance" value={totals.balance} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
            <form onSubmit={addTransaction} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold">Nuevo movimiento</h2>

              <label className="mt-5 block text-sm text-slate-400">
                Descripción
                <input required maxLength={120} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" placeholder="Ej. Renta" />
              </label>

              <label className="mt-4 block text-sm text-slate-400">
                Monto
                <input required type="number" min="0.01" max="100000000" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" placeholder="0.00" />
              </label>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="text-sm text-slate-400">
                  Tipo
                  <select value={type} onChange={(e) => setType(e.target.value as TransactionType)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white">
                    <option value="expense">Gasto</option>
                    <option value="income">Ingreso</option>
                  </select>
                </label>

                <label className="text-sm text-slate-400">
                  Categoría
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white">
                    {categories.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
              </div>

              <button disabled={saving} type="submit" className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? "Guardando..." : "Agregar movimiento"}
              </button>
            </form>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold">Movimientos recientes</h2>

              {transactions.length === 0 ? (
                <p className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                  {syncState === "error" ? "No se pudieron cargar los movimientos." : "Todavía no tienes movimientos."}
                </p>
              ) : (
                <div className="mt-5 space-y-3">
                  {transactions.map((t) => (
                    <div key={t.id} className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{t.description}</p>
                        <p className="text-sm text-slate-500">{t.category} · {new Date(t.date).toLocaleDateString()}</p>
                      </div>
                      <p className={t.type === "income" ? "font-semibold text-emerald-400" : "font-semibold text-red-400"}>
                        {t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}
                      </p>
                      <button type="button" onClick={() => removeTransaction(t.id)} className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:text-red-400">Eliminar</button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <Link href="/dashboard" className="mt-8 inline-block rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold">Volver al Dashboard</Link>
        </div>
      </main>
    </AuthGuard>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold">${value.toFixed(2)}</p></div>;
}
