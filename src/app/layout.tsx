import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getServerSession } from "next-auth";
import { Suspense } from "react";
import "./globals.css";
import { RootProvider } from "./providers/root-provider";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AppErrorBoundary } from "./providers/error-boundary";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Music Assistant",
  description: "AI-powered music recommendation assistant",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession(authOptions); // ✅ Fixed authOptions

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppErrorBoundary>
          <Suspense fallback={<GlobalLoading />}>
            <RootProvider session={session}>
              {children}
            </RootProvider>
          </Suspense>
        </AppErrorBoundary>
        <StaticFooter />
      </body>
    </html>
  );
}


const StaticFooter = () => (
  <footer className="p-4 text-xs text-center text-gray-500">
    <p>Powered by <a target="_blank" href="https://getsongbpm.com/">getsongbpm.com</a></p>
  </footer>
);

const GlobalLoading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-12 h-12 border-t-2 border-b-2 border-gray-900 rounded-full animate-spin" />
  </div>
);
