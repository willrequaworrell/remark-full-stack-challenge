// app/components/footer.tsx
"use client";

import { signOut, useSession } from "next-auth/react";

export const Footer = () => {
  const { data: session } = useSession();

  return (
    <footer className="p-4 text-xs text-center text-gray-500">
      <p className="inline-flex gap-2">
        Powered by{" "}
        <a
          target="_blank"
          href="https://getsongbpm.com/"
          className="hover:underline hover:cursor-pointer"
        >
          getsongbpm.com
        </a>
        {session && (
          <>
            {" | "}
            <button
              onClick={() => signOut()}
              className="text-gray-500 hover:underline hover:cursor-pointer"
            >
              Sign Out
            </button>
          </>
        )}
      </p>
    </footer>
  );
};
