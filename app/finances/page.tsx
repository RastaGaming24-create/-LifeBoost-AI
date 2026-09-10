"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import Navbar from "../../components/Navbar";
import AuthGuard from "../../components/AuthGuard";
import { useAuth } from "../../components/AuthProvider";
import { calculateTotals, isTransfer, Transaction, TransactionFrequency, TransactionType } from "../../lib/finance";
import { auth, db } from "../../lib/firebase";

const categories = ["Vivienda", "Comida", "Transporte", "Deudas", "Ahorro", "Entretenimiento", "Otros"];
const quickOptions = [
  { label: "Salario", description: "Salario", type: "income" as TransactionType, category: "Ingresos", frequency: "monthly" as TransactionFrequency },
  { label: "Renta", description: "Renta", type: "expense" as TransactionType, category: "Vivienda", frequency: "monthly" as TransactionFrequency },
  { label: "Comida", description: "Comida", type: "expense" as TransactionType, category: "Comida", frequency: "once" as TransactionFrequency },
  { label: "Transporte", description: "Transporte", type: "expense" as TransactionType, category: "Transporte", frequency: "once" as TransactionFrequency },
  { label: "Deuda", description: "Pago de deuda", type: "expense" as TransactionType, category: "Deudas", frequency: "monthly" as TransactionFrequency },
  { label: "Ahorro", description: "Ahorro", type: "expense" as TransactionType, category: "Ahorro", frequency: "monthly" as TransactionFrequency },
];
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
  const [movementOpen, setMovementOpen] = useState(false);
  const [entryMode, setEntryMode] = useState<"options" | "manual">("options");
  const [openSection, setOpenSection] = useState<"income" | "expense" | "transfer" | null>(null);

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
        setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction)));
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
        if (active) {
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
  const incomeTransactions = useMemo(() => transactions.filter((t) => t.type === "income" && !isTransfer(t)), [transactions]);
  const expenseTransactions = useMemo(() => transactions.filter((t) => t.type === "expense" && !isTransfer(t)), [transactions]);
  const transferTransactions = useMemo(() => transactions.filter(isTransfer), [transactions]);

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
      source: "manual",
    };
    try {
      const fields: Record<string, ReturnType<typeof firestoreValue>> = {
        description: firestoreValue(newTransaction.description),
        amount: firestoreValue(newTransaction.amount),
        type: firestoreValue(newTransaction.type),
        category: firestoreValue(newTransaction.category),
        date: firestoreValue(newTransaction.date),
        frequency: firestoreValue(frequency),
        source: firestoreValue("manual"),
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
      setMovementOpen(false);
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

  function chooseQuickOption(option: typeof quickOptions[number]) {
    setDescription(option.description);
    setType(option.type);
    setCategory(option.category === "Ingresos" ? "Otros" : option.category);
    setFrequency(option.frequency);
    setEntryMode("manual");
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-xs font-medium uppercase tracking-wide text-blue-400">Control financiero</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold">Finanzas</h1>
              <p className="mt-1 text-sm text-slate-400">Tus movimientos se guardan de forma privada.</p>
            </div>
            <span className={syncState === "synced" ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400" : syncState === "error" ? "rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-400" : "rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400"}>
              {syncState === "synced" ? "✓ Firebase" : syncState === "error" ? "⚠ Error" : "⟳ Sincronizando"}
            </span>
          </div>

          {syncError && <div className="mt-3 rounded-xl border border-red-900/60 bg-red-950/30 p-3 text-xs text-red-300">{syncError}</div>}

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Summary label="Ingresos" value={totals.income} tone="income" />
            <Summary label="Gastos" value={totals.totalExpenses} tone="expense" />
            <Summary label="Ingreso semanal" value={totals.weeklyIncome} tone="income" />
            <Summary label="Transferencias del mes" value={totals.currentMonthTransfers} tone="transfer" />
            <Summary label="Balance" value={totals.income - totals.totalExpenses} tone="balance" />
          </div>

          <section className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
            <button type="button" onClick={() => setMovementOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left">
              <span className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xl">+</span><span><span className="block font-semibold">Nuevo movimiento</span><span className="block text-xs text-slate-500">Elige una opción o introdúcelo manualmente</span></span></span>
              <span className="text-xl text-slate-300">{movementOpen ? "⌃" : "⌄"}</span>
            </button>

            {movementOpen && (
              <form onSubmit={addTransaction} className="border-t border-slate-800 px-4 pb-4 pt-3">
                <div className="grid grid-cols-2 rounded-xl border border-slate-700 bg-slate-950 p-1">
                  <button type="button" onClick={() => setEntryMode("options")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${entryMode === "options" ? "bg-blue-600 text-white" : "text-slate-400"}`}>Elegir opción</button>
                  <button type="button" onClick={() => setEntryMode("manual")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${entryMode === "manual" ? "bg-blue-600 text-white" : "text-slate-400"}`}>Entrada manual</button>
                </div>

                {entryMode === "options" ? (
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {quickOptions.map((option) => (
                      <button key={option.label} type="button" onClick={() => chooseQuickOption(option)} className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-3 text-left hover:border-blue-500">
                        <span><span className="block text-sm font-medium">{option.label}</span><span className="block text-xs text-slate-500">{option.type === "income" ? "Ingreso" : option.category}</span></span><span className="text-slate-400">›</span>
                      </button>
                    ))}
                    <button type="button" onClick={() => setEntryMode("manual")} className="flex items-center justify-between rounded-xl border border-dashed border-slate-600 px-3 py-3 text-left text-sm text-slate-300 hover:border-blue-500"><span>✎ Escribir manualmente</span><span>›</span></button>
                  </div>
                ) : (
                  <>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <label className="text-xs text-slate-400">Tipo<select value={type} onChange={(e) => handleTypeChange(e.target.value as TransactionType)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"><option value="expense">Gasto</option><option value="income">Ingreso</option></select></label>
                      <label className="text-xs text-slate-400">Monto<input required type="number" min="0.01" max="100000000" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white" placeholder="0.00" /></label>
                    </div>
                    <label className="mt-3 block text-xs text-slate-400">Descripción<input required maxLength={120} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white" placeholder={type === "income" ? "Ej. Salario" : "Ej. Renta"} /></label>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <label className="text-xs text-slate-400">Categoría<select value={type === "income" ? "Ingresos" : category} disabled={type === "income"} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white disabled:opacity-60">{type === "income" ? <option>Ingresos</option> : categories.map((item) => <option key={item}>{item}</option>)}</select></label>
                      <label className="text-xs text-slate-400">Frecuencia<select value={frequency} onChange={(e) => setFrequency(e.target.value as TransactionFrequency)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"><option value="once">Una sola vez</option><option value="weekly">Semanal</option><option value="monthly">Mensual</option></select></label>
                    </div>
                    <button disabled={saving} type="submit" className="mt-3 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500 disabled:opacity-60">{saving ? "Guardando…" : "Agregar movimiento"}</button>
                  </>
                )}
              </form>
            )}
          </section>

          <div className="mt-4 space-y-2">
            <CompactSection title="Ingresos" subtitle="Dinero que entra a tu cuenta" count={incomeTransactions.length} tone="income" open={openSection === "income"} onToggle={() => setOpenSection(openSection === "income" ? null : "income")} transactions={incomeTransactions} type="income" onRemove={removeTransaction} />
            <CompactSection title="Gastos" subtitle="Dinero que sale de tu cuenta" count={expenseTransactions.length} tone="expense" open={openSection === "expense"} onToggle={() => setOpenSection(openSection === "expense" ? null : "expense")} transactions={expenseTransactions} type="expense" onRemove={removeTransaction} />
            <CompactSection title="Transferencias" subtitle="No se cuentan como ingresos ni gastos" count={transferTransactions.length} tone="transfer" open={openSection === "transfer"} onToggle={() => setOpenSection(openSection === "transfer" ? null : "transfer")} transactions={transferTransactions} type="transfer" onRemove={removeTransaction} />
          </div>

          <Link href="/dashboard" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold">← Volver al Dashboard</Link>
        </div>
      </main>
    </AuthGuard>
  );
}

function CompactSection({ title, subtitle, count, tone, open, onToggle, transactions, type, onRemove }: { title: string; subtitle: string; count: number; tone: "income" | "expense" | "transfer"; open: boolean; onToggle: () => void; transactions: Transaction[]; type: "income" | "expense" | "transfer"; onRemove: (id: string) => void }) {
  const badge = tone === "income" ? "bg-emerald-500/10 text-emerald-400" : tone === "expense" ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400";
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left hover:bg-slate-800/40">
        <span className="min-w-0"><span className="block font-semibold">{title}</span><span className="block truncate text-xs text-slate-500">{subtitle}</span></span>
        <span className="flex shrink-0 items-center gap-3"><span className={`rounded-full px-2.5 py-1 text-xs ${badge}`}>{count}</span><span className="text-xl text-slate-300">{open ? "⌃" : "›"}</span></span>
      </button>
      {open && (
        <div className="border-t border-slate-800 p-3">
          {transactions.length === 0 ? <p className="rounded-xl border border-dashed border-slate-700 p-5 text-center text-xs text-slate-500">No hay movimientos registrados.</p> : <div className="space-y-2">{transactions.map((t) => <div key={t.id} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{t.description}</p><p className="text-xs text-slate-500">{t.category} · {new Date(t.date).toLocaleDateString()}</p></div><p className={`text-sm font-semibold ${type === "income" ? "text-emerald-400" : type === "expense" ? "text-red-400" : "text-blue-400"}`}>{type === "income" ? "+" : type === "expense" ? "-" : ""}${t.amount.toFixed(2)}</p><button type="button" onClick={() => onRemove(t.id)} className="text-xs text-slate-500 hover:text-red-400">Eliminar</button></div>)}</div>}
        </div>
      )}
    </section>
  );
}

function Summary({ label, value, tone }: { label: string; value: number; tone: "income" | "expense" | "balance" | "transfer" }) {
  const valueClass = tone === "income" ? "text-emerald-400" : tone === "expense" ? "text-red-400" : tone === "transfer" ? "text-blue-400" : value >= 0 ? "text-emerald-400" : "text-red-400";
  return <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><p className="truncate text-xs text-slate-400">{label}</p><p className={`mt-1 text-xl font-bold ${valueClass}`}>${value.toFixed(2)}</p></div>;
}
