import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meridian Commerce Analytics",
  description: "Executive e-commerce performance, customer, and purchase propensity analytics.",
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
