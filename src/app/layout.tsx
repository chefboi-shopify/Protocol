import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/lib/components";

export const metadata: Metadata = {
  title: "PROTOCOL",
  description: "High-stakes logistics engine for human connection.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-neutral-950 text-neutral-200 antialiased min-h-screen">
        <NavBar />
        <main className="max-w-lg mx-auto px-4 pb-24">{children}</main>
      </body>
    </html>
  );
}
