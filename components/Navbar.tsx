"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import Logo from "./Logo";
import { auth } from "../lib/firebase";
import { useAuth } from "./AuthProvider";

const links = [["Inicio", "/"], ["Dashboard", "/dashboard"], ["Finanzas", "/finances"], ["Metas", "/goals"], ["IA", "/ai"]] as const;

export default function Navbar() {
  const { user } = useAuth();
  return <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur"><div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
    <Link href="/" aria-label="LifeBoost AI - Inicio" className="shrink-0"><Logo /></Link>
    <div className="flex max-w-full items-center gap-1 overflow-x-auto pb-1 sm:gap-2">{links.map(([label, href]) => <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white">{label}</Link>)}
      {user ? <button onClick={() => signOut(auth)} className="whitespace-nowrap rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800">Salir</button> : <Link href="/auth" className="whitespace-nowrap rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500">Entrar</Link>}
    </div>
  </div></nav>;
}
