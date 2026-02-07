import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/components/Web3Provider";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EZ - Make Easy Payments",
  description: "Send crypto payments that automatically route to your recipient's preferred chain and token. Integrated with Arc + ENS.",
  keywords: ["crypto", "payments", "cross-chain", "ENS", "Arc", "CCTP", "ethereum", "web3"],
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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} style={{ minHeight: '100vh' }}>
        <ThemeProvider>
          <Web3Provider>
            {children}
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
