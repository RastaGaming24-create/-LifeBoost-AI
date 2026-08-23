import Link from "next/link";
import Navbar from "../../components/Navbar";

export default function GoalsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
        <p className="text-sm font-medium text-blue-400">Plan de crecimiento</p>
        <h1 className="mt-2 text-4xl font-bold">Metas</h1>
        <p className="mt-3 max-w-2xl text-slate-400">Define objetivos financieros y conviértelos en pasos medibles.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"><h2 className="text-xl font-semibold">Crear una meta</h2><p className="mt-2 text-sm text-slate-400">La próxima versión permitirá establecer monto, fecha y progreso.</p></div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"><h2 className="text-xl font-semibold">Progreso</h2><p className="mt-2 text-sm text-slate-400">Tus avances aparecerán aquí cuando agregues datos.</p></div>
        </div>
        <Link href="/dashboard" className="mt-8 inline-block rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold hover:bg-slate-800">Volver al Dashboard</Link>
      </div>
    </main>
  );
}
