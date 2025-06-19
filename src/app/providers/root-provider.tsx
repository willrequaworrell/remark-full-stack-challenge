"use client";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

export const RootProvider = ({ 
  children,
  session 
}: { 
  children: React.ReactNode;
  session: Session | null;
}) => (
  <SessionProvider 
    session={session}
    refetchInterval={300}  // Refresh session every 5 minutes
  >
    {children}
  </SessionProvider>
);
