"use client";

import { useState } from "react";
import { Facebook, Instagram, Mail, MessageCircle } from "lucide-react";

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

  async function shareInstagram() {
    await copyLink();
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  }

  const encodedText = encodeURIComponent(`${SHARE_TEXT} ${APP_URL}`);
  const encodedUrl = encodeURIComponent(APP_URL);
  const iconButton = "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-950/50 text-slate-200 transition hover:border-blue-400/60 hover:bg-slate-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50";

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
      <div className="mt-5 flex items-center gap-3" aria-label="Compartir en redes sociales">
        <a aria-label="Compartir por WhatsApp" title="WhatsApp" className={iconButton} href={`https://wa.me/?text=${encodedText}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={21} /></a>
        <a aria-label="Compartir en Facebook" title="Facebook" className={iconButton} href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer"><Facebook size={21} /></a>
        <button aria-label="Compartir en Instagram" title="Instagram" className={iconButton} onClick={shareInstagram}><Instagram size={21} /></button>
        <a aria-label="Compartir por correo" title="Correo" className={iconButton} href={`mailto:?subject=${encodeURIComponent("Prueba LifeBoost AI")}&body=${encodedText}`}><Mail size={21} /></a>
      </div>
    </section>
  );
}
