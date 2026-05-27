"use client";

import { usePathname } from "next/navigation";
import { NavBar } from "@/components/layout/NavBar";
import { AccaFab } from "@/components/acca/AccaFab";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDoc = pathname?.startsWith("/doc");

  if (isDoc) {
    return <>{children}</>;
  }

  return (
    <div className="flex">
      <NavBar />
      <main className="min-h-screen flex-1 md:ml-0">{children}</main>
      <AccaFab />
    </div>
  );
}
