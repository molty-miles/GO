export interface RelayRequest {
  legId: string;
  venue: string;
  venueMarketId: string;
  outcome: boolean;
  hedgeStake: number;
  minOdds: number;
}

export interface RelayResult {
  success: boolean;
  txHash?: string;
  executedOdds?: number;
  error?: string;
}

export async function submitRelayRequest(request: RelayRequest): Promise<RelayResult> {
  try {
    const response = await fetch("/api/relay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error ?? "Relay failed" };
    }

    return await response.json();
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Relay request failed",
    };
  }
}

export async function confirmRelay(
  legId: string,
  solanaTxRef: string,
  executedOdds: number,
): Promise<RelayResult> {
  try {
    const response = await fetch("/api/relay/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ legId, solanaTxRef, executedOdds }),
    });

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error ?? "Confirmation failed" };
    }

    return await response.json();
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Confirmation failed",
    };
  }
}
