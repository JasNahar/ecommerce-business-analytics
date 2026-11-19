import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MachineMemory AI",
  description: "Preserve industrial maintenance knowledge and find obsolete spare parts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
