import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quantum Drift",
  description: "A high-speed 3D infinite runner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          defer
          data-website-id="dfid_LfY3s0Hu3l9E1MGqKKq4G"
          data-domain="gemini-quantum-drift.vercel.app"
          src="https://datafa.st/js/script.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
