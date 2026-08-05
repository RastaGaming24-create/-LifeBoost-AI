"use client";

import Link from "next/link";
import Logo from "./Logo";

export default function Navbar() {
  return (
    <nav className="w-full h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-8">

      <Logo />

      <div className="flex gap-8">

        <Link
          href="/"
          className="text-white hover:text-blue-400 transition-colors"
        >
          Inicio
        </Link>

        <Link
          href="/dashboard"
          className="text-white hover:text-blue-400 transition-colors"
        >
          Dashboard
        </Link>

        <Link
          href="/finances"
          className="text-white hover:text-blue-400 transition-colors"
        >
          Finanzas
        </Link>

        <Link
          href="/goals"
          className="text-white hover:text-blue-400 transition-colors"
        >
          Metas
        </Link>

        <Link
          href="/ai"
          className="text-white hover:text-blue-400 transition-colors"
        >
          IA
        </Link>

      </div>

    </nav>
  );
}
