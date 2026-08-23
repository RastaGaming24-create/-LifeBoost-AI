import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LifeBoost AI",
    template: "%s | LifeBoost AI",
  },
  description: "Tu asistente financiero inteligente para organizar tus finanzas, metas y progreso.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
