"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && configured && !user) router.replace("/auth?next=" + encodeURIComponent(window.location.pathname));
  }, [loading, configured, user, router]);

  if (!configured) return <main className="min-h-screen bg-slate-950 p-8 text-white"><div className="mx-auto max-w-xl rounded-2xl border border-amber-500/30 bg-slate-900 p-6"><h1 className="text-2xl font-bold">Configuración pendiente</h1><p className="mt-3 text-slate-400">LifeBoost AI necesita la configuración de Firebase en las variables de entorno de Vercel antes de habilitar cuentas y datos en la nube.</p></div></main>;
  if (loading) return <main className="min-h-screen bg-slate-950 p-8 text-center text-slate-400">Cargando tu cuenta…</main>;
  if (!user) return <main className="min-h-screen bg-slate-950 p-8 text-center text-slate-400">Redirigiendo al inicio de sesión…</main>;
  if (!user.emailVerified) return <main className="min-h-screen bg-slate-950 p-8 text-white"><div className="mx-auto max-w-xl rounded-2xl border border-blue-500/20 bg-slate-900 p-6"><h1 className="text-2xl font-bold">Verifica tu correo</h1><p className="mt-3 text-slate-400">Debes verificar tu correo electrónico para acceder a tus datos financieros.</p><button onClick={() => router.replace("/auth")} className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold">Volver a mi cuenta</button></div></main>;
  return <>{children}</>;
}
