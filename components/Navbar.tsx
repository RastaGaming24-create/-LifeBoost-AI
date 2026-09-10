"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import Logo from "./Logo";
import { auth } from "../lib/firebase";
import { useAuth } from "./AuthProvider";

const links = [["Inicio", "/"], ["Dashboard", "/dashboard"], ["Finanzas", "/finances"], ["Banco", "/bank"], ["Metas", "/goals"], ["IA", "/ai"], ["Cuenta", "/account"]] as const;

export default function Navbar() {
  const { user } = useAuth();
  return <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur"><div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-3 sm:px-6 lg:px-8">
    <Link href="/" aria-label="LifeBoost AI - Inicio" className="shrink-0"><Logo /></Link>
    <details className="group relative ml-auto sm:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Menú <span className="text-slate-400">☰</span></summary>
      <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-2xl">{links.map(([label, href]) => <Link key={href} href={href} className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-800">{label}</Link>)}{user ? <button onClick={() => signOut(auth)} className="mt-1 w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-300 hover:bg-slate-800">Salir</button> : <Link href="/auth" className="mt-1 block rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white">Entrar</Link>}</div>
    </details>
    <div className="hidden flex-1 items-center justify-end gap-1 sm:flex sm:gap-2">{links.map(([label, href]) => <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white">{label}</Link>)}{user ? <button onClick={() => signOut(auth)} className="whitespace-nowrap rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800">Salir</button> : <Link href="/auth" className="whitespace-nowrap rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500">Entrar</Link>}</div>
  </div></nav>;
}
