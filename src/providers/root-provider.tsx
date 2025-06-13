"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import React from "react";

interface RootProviderProps {
  children: React.ReactNode;
  session: Session | null;
}

export const RootProvider = React.memo(
  ({ children, session }: RootProviderProps) => {
    return (
      <SessionProvider
        session={session}
        refetchInterval={5 * 60} // Refresh session every 5 mins
        refetchOnWindowFocus={false}
      >
        {children}
      </SessionProvider>
    );
  }
);
