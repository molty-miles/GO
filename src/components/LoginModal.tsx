"use client";

import { useUser } from "@/hooks/useUser";

export function LoginModal() {
  const { ready, authenticated, login } = useUser();

  if (!ready || authenticated) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-zinc-900 p-8 shadow-2xl">
        <h2 className="mb-2 text-center text-2xl font-bold text-white">GO Market</h2>
        <p className="mb-6 text-center text-sm text-zinc-400">
          Sign in to start building accumulators
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => login()}
            className="rounded-xl bg-white px-4 py-3 font-medium text-black transition-colors hover:bg-zinc-200"
          >
            Continue with Google
          </button>

          <button
            onClick={() => login()}
            className="rounded-xl bg-zinc-800 px-4 py-3 font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Continue with Apple
          </button>

          <button
            onClick={() => login()}
            className="rounded-xl border border-zinc-700 px-4 py-3 font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Continue with Email
          </button>

          <div className="my-2 flex items-center gap-3">
            <div className="flex-1 border-t border-zinc-700" />
            <span className="text-xs text-zinc-500">or</span>
            <div className="flex-1 border-t border-zinc-700" />
          </div>

          <button
            onClick={() => login()}
            className="rounded-xl border border-indigo-600 px-4 py-3 font-medium text-indigo-400 transition-colors hover:bg-indigo-950"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    </div>
  );
}
