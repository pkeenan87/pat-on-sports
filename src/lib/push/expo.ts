/** Expo Push HTTP API — https://docs.expo.dev/push-notifications/sending-notifications/ */
export const EXPO_PUSH_SEND_URL = "https://exp.host/--/api/v2/push/send";

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  sound?: "default" | null;
  data?: Record<string, string>;
};

export type ExpoPushTicket =
  | { status: "ok"; id: string }
  | {
      status: "error";
      message: string;
      details?: { error?: string };
    };

export type ExpoPushSendResponse = {
  data?: ExpoPushTicket | ExpoPushTicket[];
  errors?: unknown[];
};

export type PostNotificationSource = {
  slug: string;
  title: string;
  description: string;
  siteOrigin: string;
};

/** Build one Expo message for a new-post broadcast. */
export function buildNewPostMessage(
  token: string,
  post: PostNotificationSource
): ExpoPushMessage {
  return {
    to: token,
    title: post.title,
    body: post.description,
    sound: "default",
    data: {
      slug: post.slug,
      url: `${post.siteOrigin.replace(/\/$/, "")}/blog/${post.slug}`,
    },
  };
}

/**
 * Tokens whose tickets report DeviceNotRegistered, aligned by index with
 * the messages that were sent.
 */
export function tokensWithDeviceNotRegistered(
  tokens: string[],
  tickets: ExpoPushTicket[]
): string[] {
  const stale: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const ticket = tickets[i];
    const token = tokens[i];
    if (
      token &&
      ticket?.status === "error" &&
      ticket.details?.error === "DeviceNotRegistered"
    ) {
      stale.push(token);
    }
  }
  return stale;
}

export function normalizeTickets(
  data: ExpoPushSendResponse["data"]
): ExpoPushTicket[] {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

/** Chunk messages for Expo's 100-message request limit. */
export function chunkMessages<T>(items: T[], size = 100): T[][] {
  if (size < 1) throw new Error("chunk size must be >= 1");
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function sendExpoPushMessages(
  messages: ExpoPushMessage[],
  fetchImpl: typeof fetch = fetch
): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) return [];

  const tickets: ExpoPushTicket[] = [];
  for (const batch of chunkMessages(messages)) {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    };
    const accessToken = process.env.EXPO_ACCESS_TOKEN;
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const res = await fetchImpl(EXPO_PUSH_SEND_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(batch),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Expo Push API error ${res.status}: ${text.slice(0, 200)}`
      );
    }

    const json = (await res.json()) as ExpoPushSendResponse;
    tickets.push(...normalizeTickets(json.data));
  }
  return tickets;
}
