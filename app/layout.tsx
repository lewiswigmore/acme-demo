import type { Metadata } from "next";
import "./style.css";

export const metadata: Metadata = {
  title: "ACME Supply",
  description: "Browse supplies and manage local order records.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
