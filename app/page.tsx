import Navbar from "../components/Navbar";

export default function Home() {

  return (

    <main className="min-h-screen bg-slate-950">

      <Navbar />

      <section className="flex flex-col justify-center items-center mt-32">

        <h1 className="text-6xl font-bold text-white">

          LifeBoost AI

        </h1>

        <p className="text-gray-400 mt-6 text-xl">

          Tu asistente financiero inteligente

        </p>

        <button className="mt-10 bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl text-white">

          Comenzar

        </button>

      </section>

    </main>

  );

}
