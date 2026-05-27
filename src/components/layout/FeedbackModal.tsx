"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const [type, setType] = useState<"feedback" | "complaint">("feedback");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, subject, message, email }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          onOpenChange(false);
          // reset form
          setSubject("");
          setMessage("");
          setEmail("");
          setSuccess(false);
        }, 1500);
      } else {
        alert("Failed to send. Please try again.");
      }
    } catch {
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Submit Ticket</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8 text-green-500">
            Thank you! Your ticket has been submitted.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1.5">Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType("feedback")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm ${type === "feedback" ? "bg-primary text-primary-foreground" : "border-border"}`}
                >
                  Feedback
                </button>
                <button
                  type="button"
                  onClick={() => setType("complaint")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm ${type === "complaint" ? "bg-primary text-primary-foreground" : "border-border"}`}
                >
                  Complaint
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1.5">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Brief summary"
              />
            </div>

            <div>
              <label className="block text-sm mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-y"
                placeholder="Describe your feedback or issue..."
              />
            </div>

            <div>
              <label className="block text-sm mb-1.5">Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {loading ? "Sending..." : "Submit Ticket"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
