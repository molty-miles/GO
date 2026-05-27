import { Resend } from "resend";

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(request: Request) {
  try {
    const { type, subject, message, email } = await request.json();

    if (!subject || !message) {
      return new Response(JSON.stringify({ error: "Subject and message are required" }), {
        status: 400,
      });
    }

    const resend = getResend();
    if (!resend) {
      console.warn("Feedback: RESEND_API_KEY not configured, skipping email send.");
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    const html = `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #111;">New ${type === "complaint" ? "Complaint" : "Feedback"} Ticket</h2>
        
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>From:</strong> ${email || "Anonymous"}</p>
        
        <div style="margin-top: 20px; padding: 16px; background: #f9f9f9; border-radius: 8px;">
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
        
        <p style="margin-top: 24px; font-size: 12px; color: #666;">
          Submitted via GO Market Help Menu
        </p>
      </div>
    `;

    await resend.emails.send({
      from: "GO Market <support@go-market.xyz>",
      to: ["team@go-market.xyz"], // ← Change to your actual support email
      subject: `[GO Market] ${type.toUpperCase()}: ${subject}`,
      html,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Feedback API error:", error);
    return new Response(JSON.stringify({ error: "Failed to send email" }), { status: 500 });
  }
}
