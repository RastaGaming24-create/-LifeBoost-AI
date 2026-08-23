import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../components/AuthProvider";

export const metadata: Metadata = {
  title: { default: "LifeBoost AI", template: "%s | LifeBoost AI" },
  description: "LifeBoost AI: plataforma inteligente para organizar finanzas, metas y progreso.",
  applicationName: "LifeBoost AI",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body><AuthProvider>{children}</AuthProvider></body></html>;
}
