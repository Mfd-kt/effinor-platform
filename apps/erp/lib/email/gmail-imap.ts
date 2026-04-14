import { ImapFlow } from "imapflow";
import { simpleParser, type ParsedMail } from "mailparser";

export type FetchedAttachment = {
  filename: string;
  contentType: string;
  size: number;
  content: Buffer;
};

export type FetchedEmail = {
  gmailMessageId: string;
  from: string;
  to: string;
  subject: string;
  htmlBody: string | null;
  textBody: string | null;
  date: Date;
  attachments: FetchedAttachment[];
};

function getImapConfig() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD non configurés.");
  }
  return { user, pass };
}

/**
 * Resolve Gmail folder names (handles FR / EN locale differences).
 */
const FOLDER_CANDIDATES: Record<string, string[]> = {
  sent: ["[Gmail]/Messages envoy&AOk-s", "[Gmail]/Messages envoyés", "[Gmail]/Sent Mail"],
  inbox: ["INBOX"],
};

async function openMailbox(client: ImapFlow, type: keyof typeof FOLDER_CANDIDATES) {
  const candidates = FOLDER_CANDIDATES[type];
  for (const path of candidates) {
    try {
      return await client.getMailboxLock(path);
    } catch { /* try next */ }
  }
  throw new Error(`Cannot open ${type} mailbox`);
}

function parseMessage(parsed: ParsedMail, uid: number): FetchedEmail {
  const fromAddr = parsed.from?.value?.[0]?.address ?? "";
  const toAddr = parsed.to
    ? (Array.isArray(parsed.to)
        ? parsed.to[0]?.value?.[0]?.address
        : parsed.to.value?.[0]?.address) ?? ""
    : "";

  const attachments: FetchedAttachment[] = (parsed.attachments ?? [])
    .filter((a) => a.filename && a.content)
    .map((a) => ({
      filename: a.filename!,
      contentType: a.contentType ?? "application/octet-stream",
      size: a.size,
      content: a.content,
    }));

  return {
    gmailMessageId: parsed.messageId ?? `uid-${uid}`,
    from: fromAddr,
    to: toAddr,
    subject: parsed.subject ?? "(sans objet)",
    htmlBody: typeof parsed.html === "string" ? parsed.html : null,
    textBody: parsed.text ?? null,
    date: parsed.date ?? new Date(),
    attachments,
  };
}

/**
 * Fetch emails from Gmail IMAP that involve a specific email address.
 * Searches INBOX (received) and Sent (sent) — excludes Trash and Spam.
 * Deduplicates by Message-ID.
 */
export async function fetchEmailsForAddress(
  emailAddress: string,
  maxResults = 30,
): Promise<FetchedEmail[]> {
  const { user, pass } = getImapConfig();

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  const seen = new Map<string, FetchedEmail>();

  async function searchFolder(type: keyof typeof FOLDER_CANDIDATES) {
    let mailbox;
    try {
      mailbox = await openMailbox(client, type);
    } catch {
      return;
    }

    try {
      const searchResults = await client.search({
        or: [{ from: emailAddress }, { to: emailAddress }],
      });

      if (!searchResults || searchResults.length === 0) return;

      const uids = searchResults.slice(-maxResults);

      for await (const msg of client.fetch(uids, {
        source: true,
        uid: true,
        envelope: true,
      })) {
        try {
          if (!msg.source) continue;
          const parsed = (await simpleParser(msg.source as Buffer)) as ParsedMail;
          const email = parseMessage(parsed, msg.uid);
          if (!seen.has(email.gmailMessageId)) {
            seen.set(email.gmailMessageId, email);
          }
        } catch (parseErr) {
          console.error("[gmail-imap] parse error for uid", msg.uid, parseErr);
        }
      }
    } finally {
      mailbox.release();
    }
  }

  try {
    await client.connect();

    await searchFolder("inbox");
    await searchFolder("sent");

    await client.logout();
  } catch (err) {
    console.error("[gmail-imap] connection error:", err);
    try { await client.logout(); } catch { /* ignore */ }
    throw err;
  }

  const results = Array.from(seen.values());
  results.sort((a, b) => b.date.getTime() - a.date.getTime());
  return results;
}
