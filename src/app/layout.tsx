import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Image Studio",
  description: "Image Studio workflow system",
  applicationName: "Image Studio",
  icons: {
    icon: [{ url: "/icon_logo.png", type: "image/png" }],
    shortcut: "/icon_logo.png",
    apple: "/icon_logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
