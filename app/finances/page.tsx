"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import Navbar from "../../components/Navbar";
import AuthGuard from "../../components/AuthGuard";
import { useAuth } from "../../components/AuthProvider";
import { calculateTotals, ExpenseFrequency, IncomeFrequency, Transaction, TransactionFrequency, TransactionType } from "../../lib/finance";
import { auth, db } from "../../lib/firebase";

const categories = ["Vivienda", "Comida", "Transporte", "Deudas", "Ahorro", "Entretenimiento", "Otros"];
const FIRESTORE_BASE = "https://firestore.googleapis.com/v1/projects/life-boost-ai/databases/(default)/documents";
const FIREBASE_API_KEY = "AIzaSyCFvsz5ZKHirQ8fC8gvPxf2E_f-tDGWuKg";

type SyncState = "idle" | "syncing" | "synced" | "error";

function getFirebaseErrorMessage(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? String((error as { code?: string }).code) : "";
  const messages: Record<string, string> = {
    "permission-denied": "Firebase rechazó el acceso. Verifica las reglas de Firestore para tu cuenta.",
    "failed-precondition": "Firestore no está disponible o necesita configuración adicional.",
    "unavailable": "Firebase no respondió. Comprueba tu conexión a Internet e inténtalo nuevamente.",
    "deadline-exceeded": "Firebase tardó demasiado en responder. Inténtalo nuevamente.",
  };
  return messages[code] || (error instanceof Error ? error.message : "No se pudo sincronizar con Firebase.");
}

function firestoreValue(value: unknown) {
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "number" && Number.isInteger(value)) return { integerValue: String(value) };
  if (typeof value === "number") return { doubleValue: value };
  return { stringValue: String(value ?? "") };
}

function fromFirestoreDocument(document: any): Transaction {
  const fields = document.fields || {};
  const read = (name: string) => {
    const field = fields[name];
    if (!field) return "";
    if ("stringValue" in field) return field.stringValue;
    if ("integerValue" in field) return Number(field.integerValue);
    if ("doubleValue" in field) return Number(field.doubleValue);
    return "";
  };
  const name = String(document.name || "");
  const id = name.split("/").pop() || crypto.randomUUID();
  const type = String(read("type")) as TransactionType;
  const rawFrequency = String(read("frequency"));
  return {
    id,
    description: String(read("description")),
    amount: Number(read("amount")) || 0,
    type,
    category: String(read("category")),
    date: String(read("date")) || new Date().toISOString(),
    ...(rawFrequency ? { frequency: rawFrequency as TransactionFrequency } : {}),
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
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    const text = await response.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    if (!response.ok) {
      const message = data?.error?.message || `Firestore respondió ${response.status}.`;
      const error = new Error(message) as Error & { code?: string };
      error.code = data?.error?.status === "PERMISSION_DENIED" ? "permission-denied" : "";
      throw error;
    }
    return data;
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function FinancesPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState("Otros");
  const [frequency, setFrequency] = useState<TransactionFrequency>("once");
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

    let active = true;
    setSyncState("syncing");
    setSyncError("");

    const transactionsRef = collection(db, "users", user.uid, "transactions");
    const unsubscribe = onSnapshot(
      transactionsRef,
      { includeMetadataChanges: true },
      (snap) => {
        if (!active) return;
        const nextTransactions = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
        setTransactions(nextTransactions);
        if (!snap.metadata.fromCache && !snap.metadata.hasPendingWrites) {
          setSyncState("synced");
          setSyncError("");
        }
      },
      (error) => {
        console.error("LifeBoost AI Firestore listener error:", error);
        if (active) {
          setSyncState("error");
          setSyncError(`No se pudieron sincronizar tus movimientos. ${getFirebaseErrorMessage(error)}`);
        }
      },
    );

    restRequest(`users/${encodeURIComponent(user.uid)}/transactions?pageSize=100`)
      .then((data) => {
        if (!active) return;
        const remote = Array.isArray(data?.documents) ? data.documents.map(fromFirestoreDocument) : [];
        setTransactions(remote);
        setSyncState("synced");
        setSyncError("");
      })
      .catch((error) => {
        console.error("LifeBoost AI Firestore REST read error:", error);
        if (active && transactions.length === 0) {
          setSyncState("error");
          setSyncError(`No se pudieron cargar los datos desde Firebase. ${getFirebaseErrorMessage(error)}`);
        }
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user]);

  const totals = useMemo(() => calculateTotals(transactions), [transactions]);

  async function addTransaction(event: FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!user || !description.trim() || !Number.isFinite(value) || value <= 0 || saving) return;

    setSaving(true);
    setSyncState("syncing");
    setSyncError("");

    const newTransaction: Omit<Transaction, "id"> = {
      description: description.trim(),
      amount: value,
      type,
      category: type === "income" ? "Ingresos" : category,
      date: new Date().toISOString(),
      frequency,
    };

    try {
      const fields: Record<string, ReturnType<typeof firestoreValue>> = {
        description: firestoreValue(newTransaction.description),
        amount: firestoreValue(newTransaction.amount),
        type: firestoreValue(newTransaction.type),
        category: firestoreValue(newTransaction.category),
        date: firestoreValue(newTransaction.date),
        frequency: firestoreValue(frequency),
      };

      const data = await restRequest(`users/${encodeURIComponent(user.uid)}/transactions`, {
        method: "POST",
        body: JSON.stringify({ fields }),
      });

      const saved = fromFirestoreDocument(data);
      setTransactions((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setDescription("");
      setAmount("");
      setFrequency("once");
      setSyncState("synced");
      setSyncError("");
    } catch (error) {
      console.error("LifeBoost AI Firestore REST write error:", error);
      setSyncState("error");
      setSyncError(`El movimiento no pudo guardarse en Firebase. ${getFirebaseErrorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  }

  async function removeTransaction(id: string) {
    if (!user || !id) return;
    setSyncState("syncing");
    setSyncError("");
    try {
      await restRequest(`users/${encodeURIComponent(user.uid)}/transactions/${encodeURIComponent(id)}`, { method: "DELETE" });
      setTransactions((current) => current.filter((item) => item.id !== id));
      setSyncState("synced");
    } catch (error) {
      console.error("LifeBoost AI Firestore REST delete error:", error);
      setSyncState("error");
      setSyncError(`No se pudo confirmar la eliminación en Firebase. ${getFirebaseErrorMessage(error)}`);
    }
  }

  function handleTypeChange(nextType: TransactionType) {
    setType(nextType);
    setFrequency("once");
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

          {syncError && <div className="mt-4 rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">{syncError}</div>}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Summary label="Ingresos registrados" value={totals.income} />
            <Summary label="Ingreso semanal" value={totals.recurringWeekly} />
            <Summary label="Ingreso mensual" value={totals.recurringMonthly} />
            <Summary label="Gastos" value={totals.expenses} />
            <Summary label="Balance" value={totals.balance} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
            <form onSubmit={addTransaction} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold">Nuevo movimiento</h2>

              <label className="mt-5 block text-sm text-slate-400">
                Descripción
                <input required maxLength={120} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" placeholder={type === "income" ? "Ej. Salario" : "Ej. Renta"} />
              </label>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="block text-sm text-slate-400">
                  Monto
                  <input required type="number" min="0.01" max="100000000" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" placeholder="0.00" />
                </label>

                <label className="block text-sm text-slate-400">
                  Frecuencia
                  <select value={frequency} onChange={(e) => setFrequency(e.target.value as TransactionFrequency)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white">
                    <option value="once">Una sola vez</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="text-sm text-slate-400">
                  Tipo
                  <select value={type} onChange={(e) => handleTypeChange(e.target.value as TransactionType)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white">
                    <option value="expense">Gasto</option>
                    <option value="income">Ingreso</option>
                  </select>
                </label>

                <label className="text-sm text-slate-400">
                  Categoría
                  <select value={type === "income" ? "Ingresos" : category} disabled={type === "income"} onChange={(e) => setCategory(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white disabled:opacity-60">
                    {type === "income" ? <option>Ingresos</option> : categories.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                {type === "expense"
                  ? "Indica si este gasto ocurre semanalmente, mensualmente o una sola vez."
                  : "Indica si este ingreso ocurre semanalmente, mensualmente o una sola vez."}
              </p>

              <button disabled={saving} type="submit" className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? "Guardando en Firebase…" : "Agregar movimiento"}
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
                        <p className="text-sm text-slate-500">
                          {t.category} · {new Date(t.date).toLocaleDateString()}
                          {t.frequency && t.frequency !== "once" ? ` · ${t.frequency === "weekly" ? "Semanal" : "Mensual"}` : ""}
                        </p>
                      </div>
                      <p className={t.type === "income" ? "font-semibold text-emerald-400" : "font-semibold text-red-400"}>{t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}</p>
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
