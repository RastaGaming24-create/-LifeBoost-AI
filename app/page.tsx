import Link from "next/link";
import Navbar from "../components/Navbar";

const features = [
  { title: "Control financiero", text: "Visualiza ingresos, gastos, ahorros y patrimonio en un solo lugar." },
  { title: "Metas claras", text: "Organiza objetivos financieros y conviértelos en acciones concretas." },
  { title: "Asistencia con IA", text: "Prepárate para recibir recomendaciones personalizadas basadas en tus datos." },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.18),transparent_35%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-32">
          <div className="flex flex-col justify-center">
            <span className="mb-5 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300">
              Finanzas más simples. Decisiones más inteligentes.
            </span>
            <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Construye una vida financiera más fuerte con <span className="text-blue-400">LifeBoost AI</span>.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Una plataforma para organizar tu dinero, controlar tus gastos, alcanzar metas y convertir tus números en un plan accionable.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard" className="rounded-xl bg-blue-600 px-6 py-3 text-center font-semibold transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400">
                Abrir Dashboard
              </Link>
              <Link href="/finances" className="rounded-xl border border-slate-700 bg-slate-900/60 px-6 py-3 text-center font-semibold transition hover:border-slate-500 hover:bg-slate-800">
                Ver mis finanzas
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-blue-950/20 backdrop-blur">
            <p className="text-sm font-medium text-slate-400">Vista previa financiera</p>
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm text-slate-400">Patrimonio neto</p>
              <p className="mt-2 text-4xl font-bold">$0.00</p>
              <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-1/3 rounded-full bg-blue-500" />
              </div>
              <p className="mt-3 text-xs text-slate-500">Empieza agregando tus cuentas y movimientos.</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><p className="text-xs text-slate-400">Ingresos</p><p className="mt-1 text-xl font-semibold">$0</p></div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><p className="text-xs text-slate-400">Ahorros</p><p className="mt-1 text-xl font-semibold">$0</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold">{feature.title}</h2>
              <p className="mt-3 leading-7 text-slate-400">{feature.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
