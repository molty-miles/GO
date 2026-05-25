"use client";

import { useUser } from "@/hooks/useUser";
import { useBalance } from "@/hooks/useBalance";
import { formatUsdc, truncateAddress } from "@/utils/format";

export function WalletBar() {
  const { ready, authenticated, address, login, logout } = useUser();
  const { available, isLoading } = useBalance();

  if (!ready) {
    return (
      <div className="flex h-10 w-40 animate-pulse items-center justify-center rounded-xl bg-zinc-800" />
    );
  }

  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
      >
        Sign In
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="rounded-xl bg-zinc-800 px-3 py-2 text-sm text-zinc-300">
        {isLoading ? "..." : formatUsdc(available)}
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-zinc-800 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        <span className="text-sm text-zinc-300">
          {address ? truncateAddress(address) : "No wallet"}
        </span>
      </div>

      <button
        onClick={logout}
        className="rounded-xl px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        Disconnect
      </button>
    </div>
  );
}
