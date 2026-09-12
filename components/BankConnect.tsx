"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlaidLink, PlaidLinkOnSuccess } from "react-plaid-link";
import { auth } from "../lib/firebase";
import { useAuth } from "./AuthProvider";
import BankSyncButton from "./BankSyncButton";

const PLAID_TOKEN_STORAGE_KEY = "lifeboost_plaid_link_token";

export default function BankConnect() {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [receivedRedirectUri, setReceivedRedirectUri] = useState<string | undefined>();
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
      sessionStorage.removeItem(PLAID_TOKEN_STORAGE_KEY);

      const idToken = await auth.currentUser?.getIdToken(true);
      if (!idToken) throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
      if (!publicToken) throw new Error("Plaid no devolvió el token de conexión.");

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

      if (typeof window !== "undefined") {
        const cleanUrl = `${window.location.pathname}${window.location.hash}`;
        window.history.replaceState({}, document.title, cleanUrl);
      }
      setStatus(`Banco conectado. ${Number(syncData.added || 0)} movimientos sincronizados.`);
      setToken(null);
      setReceivedRedirectUri(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo conectar el banco.");
      setStatus("");
    } finally {
      setLoading(false);
    }
  }, []);

  const config = usePlaidLink({
    token,
    receivedRedirectUri,
    onSuccess,
    onExit: (exitError) => {
      setLoading(false);
      setToken(null);
      setReceivedRedirectUri(undefined);
      sessionStorage.removeItem(PLAID_TOKEN_STORAGE_KEY);
      if (exitError) {
        setError(exitError.error_message || "No se pudo completar la conexión bancaria.");
        setStatus("");
      }
    },
    onEvent: (eventName) => {
      if (eventName === "HANDOFF_EVENT") {
        setStatus("Esperando el regreso seguro del banco…");
      }
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedToken = sessionStorage.getItem(PLAID_TOKEN_STORAGE_KEY);
    const params = new URLSearchParams(window.location.search);
    const hasOAuthRedirect = params.has("oauth_state_id");

    if (savedToken) {
      setToken(savedToken);
      if (hasOAuthRedirect) {
        setReceivedRedirectUri(window.location.href);
        setLoading(true);
        setStatus("Reanudando conexión segura con tu banco…");
      }
    }
  }, []);

  useEffect(() => {
    if (token && config.ready && !loading) config.open();
  }, [token, config.ready, loading, config]);

  async function start() {
    try {
      setLoading(true);
      setError("");
      setStatus("Preparando conexión segura…");
      const nextToken = await getToken();
      sessionStorage.setItem(PLAID_TOKEN_STORAGE_KEY, nextToken);
      setReceivedRedirectUri(undefined);
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

      <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <p className="text-sm font-semibold text-white">¿Ya tienes tu banco conectado?</p>
        <p className="mt-1 text-xs text-slate-400">Pulsa una sola vez para actualizar tus movimientos cuando quieras mantener la cuenta al día.</p>
        <div className="mt-3">
          <BankSyncButton />
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">También puedes seguir usando la opción de agregar movimientos manualmente en Finanzas.</p>
    </section>
  );
}
