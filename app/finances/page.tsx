import Link from "next/link";
import Navbar from "../../components/Navbar";

export default function FinancesPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
        <p className="text-sm font-medium text-blue-400">Control financiero</p>
        <h1 className="mt-2 text-4xl font-bold">Finanzas</h1>
        <p className="mt-3 max-w-2xl text-slate-400">Registra y organiza tus ingresos, gastos y movimientos. Esta sección está preparada para conectar almacenamiento y autenticación.</p>
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-8">
          <h2 className="text-xl font-semibold">Aún no hay movimientos</h2>
          <p className="mt-2 text-slate-400">Cuando conectemos tus datos, aquí podrás administrar tu actividad financiera.</p>
          <Link href="/dashboard" className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500">Volver al Dashboard</Link>
        </div>
      </div>
    </main>
  );
}
