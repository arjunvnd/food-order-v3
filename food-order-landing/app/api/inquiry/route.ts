import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// In-memory rate limiter: max 5 requests per IP per 15 minutes.
// Sufficient for a landing page; replace with Redis for multi-instance deployments.
const ipMap = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function getRealIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (entry.count >= MAX_REQUESTS) return true;
  entry.count++;
  return false;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: NextRequest) {
  const ip = getRealIp(req);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in 15 minutes." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  // Honeypot — silently accept so bots don't know they were caught
  if (body._gotcha) {
    return NextResponse.json({ ok: true });
  }

  // Validate inputs
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const company =
    typeof body.company === "string" ? body.company.trim() : "";

  if (!name || name.length > 100) {
    return NextResponse.json(
      { error: "Name is required (max 100 characters)." },
      { status: 422 },
    );
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) {
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: 422 },
    );
  }
  if (!message || message.length > 2000) {
    return NextResponse.json(
      { error: "Message is required (max 2000 characters)." },
      { status: 422 },
    );
  }

  const to = process.env.INQUIRY_EMAIL_TO;
  if (!to || !process.env.RESEND_API_KEY) {
    console.error(
      "[inquiry] Missing RESEND_API_KEY or INQUIRY_EMAIL_TO — check .env.local",
    );
    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again later." },
      { status: 503 },
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({      // Use onboarding@resend.dev for testing; replace with your verified domain address for production.
      from: "MallBite Inquiries <onboarding@resend.dev>",
      to,
      replyTo: email,
      subject: `New inquiry from ${name}${company ? ` — ${company}` : ""}`,
      html: `
        <h2 style="font-family:sans-serif;color:#0f766e;">New MallBite Inquiry</h2>
        <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">
          <tr><td style="padding:4px 12px 4px 0;color:#64748b;font-weight:bold;">Name</td><td>${escapeHtml(name)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#64748b;font-weight:bold;">Email</td><td>${escapeHtml(email)}</td></tr>
          ${company ? `<tr><td style="padding:4px 12px 4px 0;color:#64748b;font-weight:bold;">Company</td><td>${escapeHtml(company)}</td></tr>` : ""}
        </table>
        <h3 style="font-family:sans-serif;color:#334155;margin-top:20px;">Message</h3>
        <p style="font-family:sans-serif;font-size:14px;line-height:1.6;color:#475569;">${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
        <hr style="margin-top:24px;border:none;border-top:1px solid #e2e8f0;"/>
        <p style="font-family:sans-serif;font-size:12px;color:#94a3b8;">Sent from mallbite.com inquiry form</p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[inquiry] Resend error:", err);
    return NextResponse.json(
      { error: "Failed to send email. Please try again." },
      { status: 502 },
    );
  }
}
