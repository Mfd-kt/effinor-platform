import nodemailer from "nodemailer";

let _transport: nodemailer.Transporter | null = null;
let _userCreationTransport: nodemailer.Transporter | null = null;

function isBareEmail(s: string): boolean {
  return /^[^\s<]+@[^\s>]+\.[^\s>]+$/i.test(s);
}

function resolveSmtpSecure(port: number, raw: string | undefined): boolean {
  if (raw === "false" || raw === "0") return false;
  if (raw === "true" || raw === "1") return true;
  return port === 465;
}

type SmtpConfig = { host: string; port: number; secure: boolean; user: string; pass: string };

/**
 * Lit la config SMTP Hostinger / générique.
 * @param prefix `""` → SMTP_HOST, SMTP_USER… ; `"USER_CREATION_"` → USER_CREATION_SMTP_HOST…
 */
function readSmtpConfig(prefix: "" | "USER_CREATION_"): SmtpConfig | null {
  const hostKey = prefix ? `${prefix}SMTP_HOST` : "SMTP_HOST";
  const host = process.env[hostKey]?.trim();
  if (!host) return null;

  const portKey = prefix ? `${prefix}SMTP_PORT` : "SMTP_PORT";
  const port = Number(process.env[portKey] ?? "465") || 465;

  const secureKey = prefix ? `${prefix}SMTP_SECURE` : "SMTP_SECURE";
  const secure = resolveSmtpSecure(port, process.env[secureKey]);

  const userKey = prefix ? `${prefix}SMTP_USER` : "SMTP_USER";
  const user = process.env[userKey]?.trim() ?? "";

  const passKey = prefix ? `${prefix}SMTP_PASSWORD` : "SMTP_PASSWORD";
  const passAltKey = prefix ? `${prefix}SMTP_PASS` : "SMTP_PASS";
  const pass =
    process.env[passKey]?.trim() ??
    process.env[passAltKey]?.trim() ??
    "";

  return { host, port, secure, user, pass };
}

function createSmtpTransport(cfg: SmtpConfig, forUserCreation = false): nodemailer.Transporter {
  if (!cfg.user || !cfg.pass) {
    throw new Error(
      forUserCreation
        ? "USER_CREATION_SMTP_USER et USER_CREATION_SMTP_PASSWORD (ou USER_CREATION_SMTP_PASS) sont requis."
        : "SMTP_USER et SMTP_PASSWORD (ou SMTP_PASS) sont requis.",
    );
  }

  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    // Port 587 : STARTTLS — évite des échecs d’auth «535 » sur certains hébergeurs (ex. Hostinger / Titan).
    ...(cfg.port === 587 && !cfg.secure ? { requireTLS: true as const } : {}),
  });
}

/**
 * Transport e-mail principal : SMTP générique (ex. Hostinger) si `SMTP_HOST` est défini, sinon Gmail.
 */
export function getMailTransport(): nodemailer.Transporter {
  if (_transport) return _transport;

  const smtp = readSmtpConfig("");
  if (smtp) {
    _transport = createSmtpTransport(smtp, false);
    return _transport;
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      "Configurez soit SMTP_HOST + SMTP_USER + SMTP_PASSWORD (ex. Hostinger), soit GMAIL_USER + GMAIL_APP_PASSWORD.",
    );
  }

  _transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  return _transport;
}

/** @deprecated Alias de getMailTransport — conservé pour les imports existants. */
export function getGmailTransport(): nodemailer.Transporter {
  return getMailTransport();
}

/**
 * True si l’app n’utilise que Gmail (pas de SMTP_HOST) — dans ce cas Gmail impose en général l’expéditeur = compte connecté.
 */
export function isGmailOnlyMailBackend(): boolean {
  return !process.env.SMTP_HOST?.trim() && Boolean(process.env.GMAIL_USER?.trim());
}

/** Extrait l’adresse e-mail d’un en-tête From type `"Nom" <a@b>` ou `a@b`. */
export function primaryAddressFromFromHeader(fromHeader: string): string | null {
  const trimmed = fromHeader.trim();
  const m = trimmed.match(/<([^>]+)>/);
  if (m) return m[1].trim().toLowerCase();
  if (isBareEmail(trimmed)) return trimmed.toLowerCase();
  return null;
}

export function hasUserCreationSmtpConfigured(): boolean {
  return Boolean(process.env.USER_CREATION_SMTP_HOST?.trim());
}

/**
 * En-tête From pour les envois « classiques » (études, etc.).
 */
export function getFromAddress(): string {
  const explicit = process.env.MAIL_FROM?.trim();
  if (explicit) {
    if (isBareEmail(explicit)) {
      const name =
        process.env.MAIL_FROM_NAME?.trim() ||
        process.env.GMAIL_FROM_NAME ||
        "Effinor";
      return `"${name}" <${explicit}>`;
    }
    return explicit;
  }

  const smtp = readSmtpConfig("");
  if (smtp?.user) {
    const name =
      process.env.MAIL_FROM_NAME?.trim() ||
      process.env.GMAIL_FROM_NAME ||
      "Effinor";
    return `"${name}" <${smtp.user}>`;
  }

  const name = process.env.GMAIL_FROM_NAME || "Effinor";
  const user = process.env.GMAIL_USER || "";
  return `"${name}" <${user}>`;
}

/**
 * Transport dédié à l’e-mail de création d’utilisateur (ex. Hostinger no-reply)
 * si `USER_CREATION_SMTP_HOST` est défini ; sinon même transport que le reste.
 */
export function getMailTransportForUserCreation(): nodemailer.Transporter {
  const smtp = readSmtpConfig("USER_CREATION_");
  if (!smtp) {
    return getMailTransport();
  }

  if (!_userCreationTransport) {
    _userCreationTransport = createSmtpTransport(smtp, true);
  }
  return _userCreationTransport;
}

function formatNamedFrom(email: string, nameFromEnv: string | undefined): string {
  if (isBareEmail(email)) {
    const name =
      nameFromEnv?.trim() ||
      process.env.USER_CREATION_MAIL_FROM_NAME?.trim() ||
      process.env.MAIL_FROM_NAME?.trim() ||
      process.env.GMAIL_FROM_NAME ||
      "Effinor";
    return `"${name}" <${email}>`;
  }
  return email;
}

/**
 * From pour l’e-mail de création d’utilisateur.
 * Priorité : expéditeur explicite création → MAIL_FROM global (si SMTP création défini) → login SMTP création → défaut global.
 * Ainsi, avec USER_CREATION_SMTP_USER=contact@… et MAIL_FROM=no-reply@…, l’en-tête From affiche bien no-reply (si le serveur SMTP l’autorise).
 */
export function getFromAddressForUserCreation(): string {
  const ucFrom = process.env.USER_CREATION_MAIL_FROM?.trim();
  if (ucFrom) {
    return formatNamedFrom(ucFrom, process.env.USER_CREATION_MAIL_FROM_NAME);
  }

  const ucSmtp = readSmtpConfig("USER_CREATION_");
  const globalFrom = process.env.MAIL_FROM?.trim();
  if (globalFrom && ucSmtp) {
    return formatNamedFrom(globalFrom, process.env.MAIL_FROM_NAME);
  }

  if (ucSmtp?.user) {
    const name =
      process.env.USER_CREATION_MAIL_FROM_NAME?.trim() ||
      process.env.MAIL_FROM_NAME?.trim() ||
      process.env.GMAIL_FROM_NAME ||
      "Effinor";
    return `"${name}" <${ucSmtp.user}>`;
  }

  return getFromAddress();
}
