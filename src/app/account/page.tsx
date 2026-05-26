"use client";

import { AccountScreen } from "@/components/account/AccountScreen";

export default function AccountPage() {
  return (
    <div className="p-4 pb-24 md:pb-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold">Account</h1>
        <p className="text-sm text-muted-foreground">
          Manage your wallet, deposits, and withdrawals
        </p>
      </div>
      <AccountScreen />
    </div>
  );
}
