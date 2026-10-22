import type { Metadata } from "next";
import "./globals.css";
import { DemoProvider } from "@/components/demo-provider";
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
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
