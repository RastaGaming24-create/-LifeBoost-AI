"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlaidLink, PlaidLinkOnSuccess } from "react-plaid-link";
import { auth } from "../lib/firebase";
import { useAuth } from "./AuthProvider";

export default function BankConnect() {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const getToken = useCallback(async () => {
    if (!user) throw new Error("Debes iniciar sesión para conectar un banco.");
    const idToken = await auth.currentUser?.getIdToken(true);
    if (!idToken) throw new Error("No hay una sesión válida de Firebase.");
    const response = await fetch("/api/plaid/link-token", {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}` },
    });
    const data = await response.json();
    if (!response.ok || !data.link_token) throw new Error(data.error || "No se pudo iniciar la conexión bancaria.");
    return data.link_token as string;
  }, [user]);

  const onSuccess = useCallback<PlaidLinkOnSuccess>(async (publicToken) => {
    try {
      setLoading(true);
      setError("");
      setStatus("Conexión autorizada. Guardando cuenta de forma segura…");
      const idToken = await auth.currentUser?.getIdToken(true);
      if (!idToken) throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");

      const exchange = await fetch("/api/plaid/exchange", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ public_token: publicToken }),
      });
      const exchangeData = await exchange.json();
      if (!exchange.ok) throw new Error(exchangeData.error || "No se pudo completar la conexión.");

      const sync = await fetch("/api/plaid/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: exchangeData.itemId }),
      });
      const syncData = await sync.json();
      if (!sync.ok) throw new Error(syncData.error || "La cuenta se conectó, pero no se pudieron sincronizar los movimientos.");

      setStatus(`Banco conectado. ${Number(syncData.added || 0)} movimientos sincronizados.`);
      setToken(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo conectar el banco.");
      setStatus("");
    } finally {
      setLoading(false);
    }
  }, []);

  const config = usePlaidLink({
    token,
    onSuccess,
    onExit: () => {
      setLoading(false);
      setToken(null);
    },
  });

  useEffect(() => {
    if (token && config.ready && !loading) config.open();
  }, [token, config.ready, loading, config]);

  async function start() {
    try {
      setLoading(true);
      setError("");
      setStatus("Preparando conexión segura…");
      const nextToken = await getToken();
      setToken(nextToken);
      setLoading(false);
      setStatus("");
    } catch (err) {
      setLoading(false);
      setStatus("");
      setError(err instanceof Error ? err.message : "No se pudo iniciar la conexión bancaria.");
    }
  }

  return (
    <section className="rounded-2xl border border-blue-900/60 bg-slate-900/70 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-400">Sincronización automática</p>
          <h2 className="mt-1 text-2xl font-bold">🏦 Conecta tu banco</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">Importa tus movimientos para ver ingresos y gastos semanales y mensuales. Tus credenciales bancarias no se guardan en LifeBoost AI.</p>
        </div>
        <button type="button" onClick={start} disabled={!user || loading} className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? "Conectando…" : "Conectar mi banco"}
        </button>
      </div>
      {status && <p className="mt-4 text-sm text-emerald-400">{status}</p>}
      {error && <p className="mt-4 rounded-xl border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300">{error}</p>}
      <p className="mt-4 text-xs text-slate-500">También puedes seguir usando la opción de agregar movimientos manualmente en Finanzas.</p>
    </section>
  );
}
