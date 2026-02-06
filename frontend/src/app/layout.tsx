import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EZ - Make Easy Payments",
  description: "Send crypto payments that automatically route to your recipient's preferred chain and token. Powered by ENS and LI.FI.",
  keywords: ["crypto", "payments", "cross-chain", "ENS", "LI.FI", "ethereum", "web3"],
  authors: [{ name: "EZ Payments" }],
  openGraph: {
    title: "EZ - Make Easy Payments",
    description: "Seamless cross-chain crypto payments using ENS preferences",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} gradient-bg gradient-mesh`} style={{ minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  );
}
