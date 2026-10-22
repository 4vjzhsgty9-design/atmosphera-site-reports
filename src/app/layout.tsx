import type { Metadata } from "next";
import "./globals.css";
import { DemoProvider } from "@/components/demo-provider";
import { Suspense } from "react";
import { connection } from "next/server";
import { appMode } from "@/lib/auth/config";
export const metadata: Metadata = {
  title: "Atmosphera Site Reports",
  description:
    "Construction reporting workspace for PT Bali Atmosphera Construction. Demonstration prototype.",
  applicationName: "Atmosphera Site Reports",
  appleWebApp: { capable: true, title: "Atmosphera" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<p className="empty">Loading Atmosphera…</p>}>
          <RuntimeProviders>{children}</RuntimeProviders>
        </Suspense>
      </body>
    </html>
  );
}

async function RuntimeProviders({ children }: { children: React.ReactNode }) {
  await connection();
  return appMode() === "demo" ? (
    <DemoProvider>{children}</DemoProvider>
  ) : (
    children
  );
}
