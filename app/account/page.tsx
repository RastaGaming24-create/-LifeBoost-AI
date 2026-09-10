"use client";

import { useState } from "react";
import Navbar from "../../components/Navbar";
import AuthGuard from "../../components/AuthGuard";
import { useAuth } from "../../components/AuthProvider";

export default function AccountPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function getAuthToken() {
    if (!user) throw new Error("Debes iniciar sesión.");
    return user.getIdToken(true);
  }

  async function reportBug(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setStatus("");
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/report", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ title, description, severity }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "No se pudo enviar.");
      setTitle(""); setDescription(""); setStatus("Reporte enviado. Gracias por ayudarnos a mejorar LifeBoost AI.");
    } catch (e) { setStatus(e instanceof Error ? e.message : "No se pudo enviar el reporte."); }
    finally { setBusy(false); }
  }

  async function checkout() {
    setBusy(true); setStatus("");
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/billing/checkout", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "No se pudo iniciar el pago.");
      if (data.url) window.location.href = data.url;
    } catch (e) { setStatus(e instanceof Error ? e.message : "No se pudo iniciar el pago."); setBusy(false); }
  }

  async function portal() {
    setBusy(true); setStatus("");
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/billing/portal", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "No se pudo abrir facturación.");
      if (data.url) window.location.href = data.url;
    } catch (e) { setStatus(e instanceof Error ? e.message : "No se pudo abrir facturación."); setBusy(false); }
  }

  async function resetAccount() {
    const first = window.confirm("Esto restablecerá LifeBoost AI como si entraras por primera vez. Se eliminarán tus transacciones, datos financieros y conexión con el banco/Plaid. Tu cuenta para iniciar sesión NO se eliminará. ¿Continuar?");
    if (!first || !window.confirm("Última confirmación: se borrarán los datos de LifeBoost AI de esta cuenta y tendrás que conectar el banco nuevamente.")) return;
    setBusy(true); setStatus("");
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/account/reset", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "No se pudieron restablecer los datos.");
      setStatus("LifeBoost AI fue restablecido. Tu cuenta sigue activa y puedes volver a conectar tu banco desde cero.");
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) { setStatus(e instanceof Error ? e.message : "No se pudieron restablecer los datos."); setBusy(false); }
  }

  return <AuthGuard><main className="min-h-screen bg-slate-950 text-white"><Navbar/><div className="mx-auto max-w-5xl px-6 py-10 lg:px-8"><p className="text-sm font-medium text-blue-400">Cuenta</p><h1 className="mt-2 text-4xl font-bold">Mi cuenta</h1><p className="mt-2 text-slate-400">{user?.email}</p>
    {status && <div className="mt-6 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-200">{status}</div>}
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"><h2 className="text-xl font-semibold">LifeBoost Pro</h2><p className="mt-2 text-sm leading-6 text-slate-400">Desbloquea la experiencia Pro mediante una suscripción segura con Stripe.</p><button disabled={busy || !user} onClick={checkout} className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-semibold disabled:opacity-50">Suscribirme a Pro</button><button disabled={busy || !user} onClick={portal} className="ml-3 mt-5 rounded-xl border border-slate-700 px-5 py-3 font-semibold disabled:opacity-50">Gestionar facturación</button></section>
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"><h2 className="text-xl font-semibold">Reportar un error</h2><p className="mt-2 text-sm text-slate-400">Cuéntanos qué ocurrió y podremos investigarlo.</p><form onSubmit={reportBug} className="mt-5 space-y-3"><input required maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Título del problema" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"/><select value={severity} onChange={e=>setSeverity(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"><option value="low">Bajo</option><option value="medium">Medio</option><option value="high">Alto</option><option value="critical">Crítico</option></select><textarea required maxLength={4000} rows={5} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Qué hiciste, qué esperabas y qué ocurrió..." className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"/><button disabled={busy} className="rounded-xl bg-slate-800 px-5 py-3 font-semibold disabled:opacity-50">Enviar reporte</button></form></section>
    </div>
    <section className="mt-6 rounded-2xl border border-amber-900/50 bg-amber-950/20 p-6"><h2 className="text-xl font-semibold text-amber-200">Restablecer LifeBoost AI</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Deja tu cuenta como si entraras hoy por primera vez: elimina transacciones, datos financieros, conexión y datos de Plaid y demás información guardada en LifeBoost AI. Tu cuenta de inicio de sesión se conserva.</p><button disabled={busy || !user} onClick={resetAccount} className="mt-5 rounded-xl border border-amber-800 px-5 py-3 font-semibold text-amber-200 hover:bg-amber-950/40 disabled:opacity-50">Restablecer mi cuenta</button></section>
  </div></main></AuthGuard>;
}
