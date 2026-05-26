import { createPublicClient, http, parseAbi } from "viem";
import { baseSepolia } from "viem/chains";

const RPC_URL =
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ||
  (process.env.ALCHEMY_API_KEY
    ? `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
    : "https://sepolia.base.org");

const VAULT_ADDRESS = (process.env.NEXT_PUBLIC_VAULT_ADDRESS ?? "") as `0x${string}`;
const MANAGER_ADDRESS = (process.env.NEXT_PUBLIC_MANAGER_ADDRESS ?? "") as `0x${string}`;

const client = createPublicClient({ chain: baseSepolia, transport: http(RPC_URL) });

const vaultAbi = parseAbi([
  "function userBalance(address user) view returns (uint256 total, uint256 locked, uint256 available)",
]);

const managerAbi = parseAbi([
  "function getAcca(bytes32 accaId) view returns (bytes32 accaId, address user, uint256 stake, uint256 potentialPayout, uint256 combinedOdds, uint256 expiresAt, uint8 status)",
  "function getUserAccaCount(address user) view returns (uint256)",
  "function getUserAccaAt(address user, uint256 index) view returns (bytes32)",
]);

export async function getVaultBalanceServer(address: `0x${string}`) {
  const [total, locked, available] = await client.readContract({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: "userBalance",
    args: [address],
  });
  return {
    total: Number(total) / 1_000_000,
    locked: Number(locked) / 1_000_000,
    available: Number(available) / 1_000_000,
  };
}

export async function getUserAccasServer(address: `0x${string}`) {
  const count = await client.readContract({
    address: MANAGER_ADDRESS,
    abi: managerAbi,
    functionName: "getUserAccaCount",
    args: [address],
  });

  const accas = [];
  for (let i = 0; i < Number(count); i++) {
    const id = await client.readContract({
      address: MANAGER_ADDRESS,
      abi: managerAbi,
      functionName: "getUserAccaAt",
      args: [address, BigInt(i)],
    });
    const acca = await client.readContract({
      address: MANAGER_ADDRESS,
      abi: managerAbi,
      functionName: "getAcca",
      args: [id],
    });
    accas.push({
      accaId: acca[0],
      user: acca[1],
      stake: Number(acca[2]) / 1_000_000,
      potentialPayout: Number(acca[3]) / 1_000_000,
      combinedOdds: acca[4].toString(),
      expiresAt: Number(acca[5]),
      status: ["OPEN", "WON", "LOST", "CANCELLED"][Number(acca[6])] ?? "UNKNOWN",
    });
  }
  return accas;
}
