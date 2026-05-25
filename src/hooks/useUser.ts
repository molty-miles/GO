import { usePrivy, useWallets } from "@privy-io/react-auth";

export function useUser() {
  const { ready, authenticated, user, login, logout, linkWallet, exportWallet } = usePrivy();
  const { wallets } = useWallets();

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const externalWallets = wallets.filter((w) => w.walletClientType !== "privy");
  const address = embeddedWallet?.address ?? externalWallets[0]?.address;

  return {
    ready,
    authenticated,
    address,
    user,
    wallets,
    embeddedWallet,
    externalWallets,
    login,
    logout,
    linkWallet,
    exportWallet,
  };
}
