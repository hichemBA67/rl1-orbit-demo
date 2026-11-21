import type { Metadata } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Shell } from "@/components/Shell";

const body = Poppins({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const code = JetBrains_Mono({ variable: "--font-code", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RL1 ORBIT — Multi-issuer DLT bond demo",
  description:
    "Interactive demo of a pan-European USD/EUR DLT bond programme on Regulated Layer One: primary market, registrars, Seturion DLT TSS secondary market, OeKB CSD and Eurosystem eligibility.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${body.variable} ${code.variable}`}>
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
