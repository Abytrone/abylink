import { usePrivy } from "@privy-io/react-auth";

export function useAppAuth() {
  const privy = usePrivy();
  
  // Check if mock mode is enabled in localStorage
  const isMock = typeof window !== "undefined" && localStorage.getItem("mock-auth") === "true";

  if (isMock) {
    return {
      ready: true,
      authenticated: true,
      login: () => {
        localStorage.setItem("mock-auth", "true");
        document.cookie = "privy-authenticated=true; path=/; max-age=86400; SameSite=Lax";
        window.location.href = "/dashboard";
      },
      logout: () => {
        localStorage.removeItem("mock-auth");
        document.cookie = "privy-authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        window.location.href = "/";
      },
      user: {
        wallet: {
          address: "0xMockWalletAddress1234567890abcdef",
        },
      },
      mockLogin: () => {
        localStorage.setItem("mock-auth", "true");
        document.cookie = "privy-authenticated=true; path=/; max-age=86400; SameSite=Lax";
        window.location.href = "/dashboard";
      },
    };
  }

  return {
    ...privy,
    // Add custom helper mock login for testing in headless environment
    mockLogin: () => {
      localStorage.setItem("mock-auth", "true");
      document.cookie = "privy-authenticated=true; path=/; max-age=86400; SameSite=Lax";
      window.location.href = "/dashboard";
    }
  };
}
