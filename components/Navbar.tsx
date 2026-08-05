"use client";

import Logo from "./Logo";

export default function Navbar() {
  return (
    <nav className="w-full h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-8">

      <div className="text-2xl font-bold text-blue-500">
        LifeBoost AI
      </div>

      <div className="flex gap-8 text-white">

        <Link href="/">
          Inicio
        </Link>

        <Link href="/dashboard">
          Dashboard
        </Link>

        <Link href="/finances">
          Finanzas
        </Link>

        <Link href="/goals">
          Metas
        </Link>

        <Link href="/ai">
          IA
        </Link>

      </div>

    </nav>
  );
}
