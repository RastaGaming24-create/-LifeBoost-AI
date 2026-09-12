"use client";

import { useState } from "react";
import { auth } from "../lib/firebase";

type State = "idle" | "syncing" | "success" | "error";

export default function BankSyncButton() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function syncBank() {
    if (state === "syncing") return;
    const user = auth.currentUser;
    if (!user) {
      setState("error");
      setMessage("Inicia sesión para sincronizar.");
      return;
    }

    setState("syncing");
    setMessage("");
    try {
      const token = await user.getIdToken(true);
      const response = await fetch("/api/plaid/sync-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || "No se pudo sincronizar.");
      const updated = Number(data.added || 0) + Number(data.modified || 0);
      setState("success");
      setMessage(updated > 0 ? `${updated} movimientos actualizados` : "Banco actualizado");
      window.setTimeout(() => setState("idle"), 3500);
    } catch (error) {
      console.error("LifeBoost AI manual bank sync error:", error);
      setState("error");
      setMessage(error instanceof Error ? error.message : "No se pudo sincronizar.");
      window.setTimeout(() => setState("idle"), 5000);
    }
  }

  return (
    <button
      type="button"
      onClick={syncBank}
      disabled={state === "syncing"}
      title="Sincronizar cuenta bancaria"
      aria-label="Sincronizar cuenta bancaria"
      className={`whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-wait disabled:opacity-70 ${state === "error" ? "border-red-700 text-red-300" : state === "success" ? "border-emerald-700 text-emerald-300" : "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"}`}
    >
      {state === "syncing" ? "↻ Sincronizando…" : state === "success" ? `✓ ${message}` : state === "error" ? "⚠ Reintentar" : "↻ Sincronizar banco"}
    </button>
  );
}
