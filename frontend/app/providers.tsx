"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { useEffect } from "react";
import { PRIVY_CONFIG } from "@/config/privy";
import { useAppAuth } from "@/hooks/useAppAuth";

// Synchronize Privy auth state with a cookie so the Next.js Middleware can read it on the server side
function PrivyCookieSync({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = useAppAuth();

  useEffect(() => {
    if (!ready) return;

    if (authenticated) {
      // Set a cookie so the middleware knows we are logged in
      document.cookie = "privy-authenticated=true; path=/; max-age=86400; SameSite=Lax";
    } else {
      // Clear the cookie
      document.cookie = "privy-authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  }, [ready, authenticated]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_CONFIG.appId}
      config={{
        loginMethods: ["wallet", "email", "google"],
        appearance: {
          theme: "dark",
          accentColor: "#3b82f6", // tailwind blue-500
          showWalletLoginFirst: true,
        },
      }}
    >
      <PrivyCookieSync>{children}</PrivyCookieSync>
    </PrivyProvider>
  );
}
