"use client";

import { useState } from "react";

const APP_URL = "https://life-boost-ai.vercel.app/";
const SHARE_TEXT = "Estoy probando LifeBoost AI para organizar mis finanzas, controlar gastos y alcanzar metas. Pruébalo gratis:";

export default function ShareLifeBoost() {
  const [copied, setCopied] = useState(false);

  async function share() {
    const shareData = { title: "LifeBoost AI", text: SHARE_TEXT, url: APP_URL };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if ((error as DOMException)?.name === "AbortError") return;
      }
    }
    await copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${SHARE_TEXT} ${APP_URL}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copia este enlace para compartir LifeBoost AI:", APP_URL);
    }
  }

  const encodedText = encodeURIComponent(`${SHARE_TEXT} ${APP_URL}`);
  const encodedUrl = encodeURIComponent(APP_URL);

  return (
    <section className="mt-10 rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-300">Comparte LifeBoost AI</p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Invita a otras personas a probarlo</h2>
          <p className="mt-2 max-w-2xl text-slate-400">Comparte la aplicación en tus redes o directamente con amigos. En móviles, usa el botón de compartir del sistema.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={share} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500">{copied ? "¡Enlace copiado!" : "Compartir"}</button>
          <button onClick={copyLink} className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800">Copiar enlace</button>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        <a className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 hover:bg-slate-900" href={`https://wa.me/?text=${encodedText}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <a className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 hover:bg-slate-900" href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer">Facebook</a>
        <a className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 hover:bg-slate-900" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodedUrl}`} target="_blank" rel="noopener noreferrer">X</a>
        <a className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 hover:bg-slate-900" href={`mailto:?subject=${encodeURIComponent("Prueba LifeBoost AI")}&body=${encodedText}`}>Correo</a>
      </div>
    </section>
  );
}
