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
        refetchInterval={5 * 60}
        refetchOnWindowFocus={false}
      >
        {children}
      </SessionProvider>
    );
  }
);

RootProvider.displayName = 'RootProvider';  // <-- Add this line
