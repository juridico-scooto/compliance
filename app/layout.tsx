import type { Metadata } from "next";
import "./globals.css";
import AuthSessionProvider from "@/components/session-provider";

export const metadata: Metadata = {
  title: "Scooto Compliance",
  description: "Sistema de compliance interno da Scooto",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
