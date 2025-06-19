"use client";

import { ErrorBoundary } from "react-error-boundary";

export const AppErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary
    fallbackRender={({ error }) => (
      <div className="p-4 text-red-500">
        <h2>Something went wrong:</h2>
        <pre>{error.message}</pre>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);
