"use client";

import { useAppAuth } from "@/hooks/useAppAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login, mockLogin, ready, authenticated } = useAppAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) {
      router.push("/dashboard");
    }
  }, [ready, authenticated, router]);

  const handleLogin = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mock") === "true") {
      mockLogin();
    } else {
      login();
    }
  };

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-950 px-6">
      {/* Sleek Minimal Background Glow */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-[250px] w-[400px] rounded-full bg-blue-600/10 blur-[100px] filter" />
      </div>

      <div className="w-full max-w-sm flex flex-col items-center justify-center text-center">
        {/* Minimal Action Button */}
        <button
          onClick={handleLogin}
          disabled={authenticated}
          className="group relative inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-6 py-4 text-sm font-semibold text-white transition-all hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] tracking-wide"
        >
          {authenticated ? "Redirecting..." : "Connect Wallet to Enter AbyLink"}
        </button>
      </div>
    </main>
  );
}
