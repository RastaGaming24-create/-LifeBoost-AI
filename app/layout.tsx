import "./globals.css";

export const metadata = {
  title: "LifeBoost AI",
  description: "Tu asistente financiero inteligente",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
