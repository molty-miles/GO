"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const Privy = dynamic(() => import("@privy-io/react-auth").then((m) => m.PrivyProvider), {
  ssr: false,
});

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "clm8f3s6t0000l708p5q6h9e1";

export function PrivyProvider({ children }: { children: ReactNode }) {
  return (
    <Privy
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["google", "apple", "email"],
        appearance: {
          theme: "dark",
          accentColor: "#6366f1",
        },
        embeddedWallets: {
          createOnLogin: "all-users",
        },
      }}
    >
      {children}
    </Privy>
  );
}
