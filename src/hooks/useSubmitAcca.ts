import { useState, useCallback } from "react";

export type SubmitState =
  | "idle"
  | "reviewing"
  | "submitting"
  | "confirming"
  | "confirmed"
  | "failed";

export function useSubmitAcca() {
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);

  const startReview = useCallback(() => setState("reviewing"), []);

  const confirm = useCallback(async () => {
    setState("submitting");
    setError(null);

    try {
      const response = await fetch("/api/acca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Submission failed");
      }

      setState("confirmed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
      setState("failed");
    }
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
  }, []);

  return { state, error, startReview, confirm, reset };
}
