import { Inter } from "next/font/google";
import "./globals.css";
import "./roemah-replicas.css";
import { MemberProvider } from "@/context/MemberContext";
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};
const inter = Inter({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "Roemah Roti",
  description: "Roemah Roti Insider",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <MemberProvider>
          {children}
        </MemberProvider>
      </body>
    </html>
  );
}
