const REQUIRED_VARS = [
  "NEXT_PUBLIC_PRIVY_APP_ID",
  "ALCHEMY_API_KEY",
  "NEXT_PUBLIC_VAULT_ADDRESS",
  "NEXT_PUBLIC_MANAGER_ADDRESS",
  "NEXT_PUBLIC_REGISTRY_ADDRESS",
] as const;

const OPTIONAL_VARS = [
  "POLYMARKET_API_KEY",
  "LIMITLESS_API_KEY",
  "REDIS_URL",
  "RESEND_API_KEY",
] as const;

export function validateEnv(): void {
  for (const name of REQUIRED_VARS) {
    if (!process.env[name]) {
      console.warn(`[env] Missing required variable: ${name}`);
    }
  }
  for (const name of OPTIONAL_VARS) {
    if (!process.env[name]) {
      console.info(`[env] Optional variable not set: ${name}`);
    }
  }
}
