"use client";

import Link from "next/link";
import Navbar from "../../components/Navbar";
import AuthGuard from "../../components/AuthGuard";
import BankConnect from "../../components/BankConnect";

export default function BankPage() {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <div className="mx-auto max-w-5xl px-6 py-10 lg:px-8">
          <p className="text-sm font-medium text-blue-400">Cuenta bancaria</p>
          <h1 className="mt-2 text-4xl font-bold">Conecta tus finanzas</h1>
          <p className="mt-3 max-w-2xl text-slate-400">Sincroniza tus movimientos automáticamente o continúa usando la entrada manual. La conexión bancaria es opcional.</p>
          <div className="mt-8"><BankConnect /></div>
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold">¿Prefieres hacerlo manualmente?</h2>
            <p className="mt-2 text-sm text-slate-400">Puedes registrar ingresos y gastos desde Finanzas sin conectar ninguna cuenta bancaria.</p>
            <Link href="/finances" className="mt-4 inline-flex rounded-xl border border-slate-700 px-5 py-3 font-semibold hover:bg-slate-800">Ir a Finanzas</Link>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
