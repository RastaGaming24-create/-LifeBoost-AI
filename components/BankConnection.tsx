"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { auth } from "../lib/firebase";

export default function BankConnection() {
  const [token, setToken] = useState<string | null>(null);
  const [environment, setEnvironment] = useState("sandbox");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const loadToken = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;
    setStatus("loading");
    setMessage("");
    try {
      const idToken = await firebaseUser.getIdToken(true);
      const response = await fetch("/api/plaid/link-token", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo iniciar la conexión bancaria.");
      setToken(data.link_token);
      setEnvironment(data.environment || "sandbox");
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "No se pudo preparar la conexión bancaria.");
    }
  }, []);

  useEffect(() => { void loadToken(); }, [loadToken]);

  const { open, ready } = usePlaidLink({
    token,
    onSuccess: async (publicToken) => {
      if (!publicToken) return;
      setStatus("syncing");
      setMessage("Cuenta conectada. Sincronizando tus movimientos…");
      try {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) throw new Error("Tu sesión ha expirado.");
        const idToken = await firebaseUser.getIdToken(true);
        const exchange = await fetch("/api/plaid/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ public_token: publicToken }),
        });
        const exchanged = await exchange.json();
        if (!exchange.ok) throw new Error(exchanged.error || "No se pudo guardar la conexión.");

        const sync = await fetch("/api/plaid/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ item_id: exchanged.itemId }),
        });
        const synced = await sync.json();
        if (!sync.ok) throw new Error(synced.error || "La cuenta se conectó, pero no se pudieron sincronizar los movimientos.");
        setStatus("connected");
        setMessage(`✓ Banco conectado. ${synced.added ?? 0} movimientos nuevos sincronizados.`);
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "No se pudo completar la sincronización.");
      }
    },
    onExit: (error) => {
      if (error) {
        setStatus("error");
        setMessage(error.display_message || "La conexión bancaria fue cancelada o no pudo completarse.");
      }
    },
  });

  return (
    <section className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-400">Sincronización bancaria</p>
          <h2 className="mt-1 text-xl font-semibold">Conecta tu banco</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Importa automáticamente tus ingresos y gastos para mantener actualizado tu resumen semanal, mensual y tus recomendaciones de LifeBoost AI.</p>
          <p className="mt-2 text-xs text-slate-500">Entorno: {environment === "production" ? "producción" : "Sandbox de Plaid"}. LifeBoost AI no almacena tu contraseña bancaria.</p>
        </div>
        <button type="button" disabled={!ready || status === "syncing"} onClick={() => open()} className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
          {status === "syncing" ? "Sincronizando…" : status === "connected" ? "Conectar otra cuenta" : "Conectar mi banco"}
        </button>
      </div>
      {status === "error" && <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{message}</p>}
      {status === "connected" && <p className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</p>}
      {status === "loading" && <p className="mt-4 text-sm text-slate-500">Preparando conexión segura…</p>}
    </section>
  );
}
