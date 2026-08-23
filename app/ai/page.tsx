import Link from "next/link";
import Navbar from "../../components/Navbar";

export default function AIPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
        <p className="text-sm font-medium text-blue-400">LifeBoost Intelligence</p>
        <h1 className="mt-2 text-4xl font-bold">Asistente IA</h1>
        <p className="mt-3 max-w-2xl text-slate-400">Aquí vivirá el asistente que analizará tus datos y te ayudará a tomar mejores decisiones financieras.</p>
        <div className="mt-8 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-8">
          <h2 className="text-xl font-semibold">IA lista para conectar</h2>
          <p className="mt-2 text-slate-400">La integración con OpenAI se podrá activar mediante una ruta segura del servidor, sin exponer claves en el navegador.</p>
          <Link href="/dashboard" className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500">Ir al Dashboard</Link>
        </div>
      </div>
    </main>
  );
}
