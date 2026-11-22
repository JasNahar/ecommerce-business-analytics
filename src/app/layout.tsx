import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meridian Commerce Analytics",
  description: "Executive e-commerce performance, customer, and purchase propensity analytics.",
  other: {
    "deployment-build": "nav-v2-c3a945e",
  },
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
