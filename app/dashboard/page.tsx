import Navbar from "../../components/Navbar";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-slate-950">
      <Navbar />

      <div className="max-w-7xl mx-auto p-10">

        <h1 className="text-4xl font-bold text-white">
          Dashboard
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">

          <div className="bg-slate-900 rounded-xl p-6">
            <p className="text-gray-400">Patrimonio</p>
            <h2 className="text-3xl font-bold mt-3">$0</h2>
          </div>

          <div className="bg-slate-900 rounded-xl p-6">
            <p className="text-gray-400">Ingresos</p>
            <h2 className="text-3xl font-bold mt-3">$0</h2>
          </div>

          <div className="bg-slate-900 rounded-xl p-6">
            <p className="text-gray-400">Gastos</p>
            <h2 className="text-3xl font-bold mt-3">$0</h2>
          </div>

          <div className="bg-slate-900 rounded-xl p-6">
            <p className="text-gray-400">Ahorros</p>
            <h2 className="text-3xl font-bold mt-3">$0</h2>
          </div>

        </div>

      </div>
    </main>
  );
}
