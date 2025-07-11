import type { Metadata } from "next";
import { Palette_Mosaic } from "next/font/google";  
import { Geist, Geist_Mono } from "next/font/google";
import { getServerSession } from "next-auth";
import { Suspense } from "react";
import "./globals.css";
import { RootProvider } from "./providers/root-provider";
import { AppErrorBoundary } from "./providers/error-boundary";
import { TbLoader3 } from "react-icons/tb";
import { Footer } from "./components/Footer";
import { authOptions } from "@/lib/auth/authOptions";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const paletteMosaic = Palette_Mosaic({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-palette-mosaic"
});

export const metadata: Metadata = {
  title: "AI Music Assistant",
  description: "AI-powered music recommendation assistant",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession(authOptions); 

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${paletteMosaic.variable} antialiased`}>
        <AppErrorBoundary>
          <Suspense fallback={<GlobalLoading />}>
            <RootProvider session={session}>
              {/* {children} */}
              console.log(children)
              <Footer/>
            </RootProvider>
          </Suspense>
        </AppErrorBoundary>
        {/* <StaticFooter /> */}
      </body>
    </html>
  );
}


const GlobalLoading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <TbLoader3 className="w-12 h-12 animate-spin" />
    
  </div>
);
