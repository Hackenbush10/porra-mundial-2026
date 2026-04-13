import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Porra Mundial 2026",
  description:
    "Rellena tu porra del Mundial 2026 fase a fase: grupos, terceros y bracket completo. Descarga tu apuesta en PDF.",
  openGraph: {
    title: "Porra Mundial 2026",
    description:
      "Rellena tu porra del Mundial 2026 fase a fase y descarga tu bracket en PDF.",
    type: "website",
    locale: "es_ES",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} antialiased`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
