// Lightweight email utility with provider-agnostic transport and sensible defaults.
// Priority order:
// 1) Custom transport (for tests)
// 2) SMTP transport (via nodemailer) if SMTP_* env vars are present
// 3) Safe no-op (logs a notice)

export type EmailPayload = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
};

export interface EmailTransport {
  send: (
    payload: Required<Pick<EmailPayload, "to" | "subject" | "from">> &
      Partial<Pick<EmailPayload, "text" | "html">>
  ) => Promise<{ id?: string }>;
}

let customTransport: EmailTransport | null = null;

export function configureEmailTransport(transport: EmailTransport | null) {
  customTransport = transport;
}

function getEnv(name: string): string | undefined {
  try {
    // Deno Deploy and Deno CLI
    // deno-lint-ignore no-explicit-any
    const D = (globalThis as any).Deno;
    if (D?.env?.get) return D.env.get(name);
  } catch (_) {
    // ignore
  }
  return undefined;
}

function getDefaultFrom(): string | undefined {
  // Prefer explicit EMAIL_FROM; fallback to SMTP_USERNAME if set.
  return getEnv("EMAIL_FROM") ?? getEnv("SMTP_USERNAME") ?? undefined;
}

async function makeSmtpTransport(): Promise<EmailTransport | null> {
  const host = getEnv("SMTP_HOST");
  const portStr = getEnv("SMTP_PORT");
  const username = getEnv("SMTP_USERNAME");
  const password = getEnv("SMTP_PASSWORD");
  const secureStr = getEnv("SMTP_SECURE"); // "true" for SMTPS (465). For STARTTLS (587), set false.

  if (!host || !username || !password) return null;

  const port = portStr ? Number(portStr) : 587;
  const secure = secureStr ? /^(1|true|yes)$/i.test(secureStr) : false;

  // Use nodemailer via Deno's Node/npm compatibility
  // Dynamic npm import via spec string to avoid static analyzers complaining when offline
  const npmSpec = "npm:nodemailer@6";
  // deno-lint-ignore no-explicit-any
  const nodemailer: any = await import(npmSpec);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user: username, pass: password },
  });

  return {
    async send({ to, subject, text, html, from }) {
      try {
        const info = await transporter.sendMail({
          from,
          to,
          subject,
          text,
          html,
        });
        return { id: info?.messageId };
      } catch (err) {
        throw new Error(`SMTP send failed: ${String(err)}`);
      }
    },
  };
}

async function resolveTransport(): Promise<EmailTransport | null> {
  if (customTransport) return customTransport;
  try {
    const smtp = await makeSmtpTransport();
    if (smtp) return smtp;
  } catch (_) {
    // fall through to no-op
  }
  return null; // No-op
}

export async function sendEmail(
  payload: EmailPayload
): Promise<{ id?: string }> {
  const { to, subject } = payload;
  const from = payload.from ?? getDefaultFrom() ?? "no-reply@localhost";
  if (!to || !subject) {
    throw new Error("sendEmail: 'to' and 'subject' are required");
  }
  // 'from' is guaranteed non-empty by fallback above
  const transport = await resolveTransport();
  if (!transport) {
    // Safe no-op in development/tests when no provider is configured
    console.warn(
      "Email transport not configured. Configure SMTP_* (and EMAIL_FROM) to enable email sending."
    );
    return {};
  }
  return await transport.send({
    to,
    subject,
    text: payload.text,
    html: payload.html,
    from,
  });
}
