"use client";

import { useEffect, useState } from "react";
import { reload } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [verifiedAfterReload, setVerifiedAfterReload] = useState(false);

  useEffect(() => {
    if (!user) {
      setVerifiedAfterReload(false);
      setCheckingVerification(false);
      return;
    }

    let cancelled = false;
    setCheckingVerification(true);

    (async () => {
      try {
        // Firebase may keep an in-memory User object with stale emailVerified
        // after the user verifies the email in another tab/app. Reloading the
        // user forces Firebase to fetch the current verification state.
        await reload(user);
        if (!cancelled) setVerifiedAfterReload(user.emailVerified);
      } catch {
        if (!cancelled) setVerifiedAfterReload(user.emailVerified);
      } finally {
        if (!cancelled) setCheckingVerification(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!loading && configured && !user) router.replace("/auth?next=" + encodeURIComponent(window.location.pathname));
  }, [loading, configured, user, router]);

  if (!configured) return <main className="min-h-screen bg-slate-950 p-8 text-white"><div className="mx-auto max-w-xl rounded-2xl border border-amber-500/30 bg-slate-900 p-6"><h1 className="text-2xl font-bold">Configuración pendiente</h1><p className="mt-3 text-slate-400">LifeBoost AI necesita la configuración de Firebase en las variables de entorno de Vercel antes de habilitar cuentas y datos en la nube.</p></div></main>;
  if (loading) return <main className="min-h-screen bg-slate-950 p-8 text-center text-slate-400">Cargando tu cuenta…</main>;
  if (!user) return <main className="min-h-screen bg-slate-950 p-8 text-center text-slate-400">Redirigiendo al inicio de sesión…</main>;
  if (checkingVerification) return <main className="min-h-screen bg-slate-950 p-8 text-center text-slate-400">Comprobando la verificación de tu correo…</main>;
  if (!user.emailVerified && !verifiedAfterReload) return <main className="min-h-screen bg-slate-950 p-8 text-white"><div className="mx-auto max-w-xl rounded-2xl border border-blue-500/20 bg-slate-900 p-6"><h1 className="text-2xl font-bold">Verifica tu correo</h1><p className="mt-3 text-slate-400">Debes verificar tu correo electrónico para acceder a tus datos financieros.</p><button onClick={() => router.replace("/auth?next=" + encodeURIComponent(window.location.pathname))} className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold">Volver a mi cuenta</button></div></main>;
  return <>{children}</>;
}
