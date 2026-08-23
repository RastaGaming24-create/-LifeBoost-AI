import Link from "next/link";
import Navbar from "../../components/Navbar";
import StatsCard from "../../components/dashboard/StatsCard";

const stats = [
  { title: "Patrimonio", value: "$0.00", icon: "◆" },
  { title: "Ingresos", value: "$0.00", icon: "↑" },
  { title: "Gastos", value: "$0.00", icon: "↓" },
  { title: "Ahorros", value: "$0.00", icon: "✓" },
];

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-blue-400">Tu centro financiero</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Aquí tendrás una vista clara de tu progreso financiero.</p>
          </div>
          <Link href="/finances" className="rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-semibold transition hover:bg-blue-500">
            Agregar movimiento
          </Link>
        </div>

        <section aria-label="Resumen financiero" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => <StatsCard key={stat.title} {...stat} />)}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div><h2 className="text-lg font-semibold">Flujo de dinero</h2><p className="mt-1 text-sm text-slate-400">Tus ingresos y gastos aparecerán aquí.</p></div>
              <span className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-400">Este mes</span>
            </div>
            <div className="mt-8 flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-sm text-slate-500">Sin movimientos todavía</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-lg font-semibold">Próximo paso</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">Agrega tus ingresos, gastos y metas para que LifeBoost AI pueda ayudarte a construir un plan.</p>
            <div className="mt-6 space-y-3 text-sm">
              <div className="rounded-xl bg-slate-950 p-4 text-slate-300">1. Configura tus finanzas</div>
              <div className="rounded-xl bg-slate-950 p-4 text-slate-300">2. Define una meta</div>
              <div className="rounded-xl bg-slate-950 p-4 text-slate-300">3. Analiza tu progreso</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
