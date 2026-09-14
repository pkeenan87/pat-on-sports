import { describe, expect, it } from "vitest";
import {
  buildNewPostMessage,
  chunkMessages,
  normalizeTickets,
  tokensWithDeviceNotRegistered,
  type ExpoPushTicket,
} from "./expo";
import {
  broadcastPushSchema,
  registerPushSchema,
  unregisterPushSchema,
} from "./schemas";
import { bearerMatches } from "./auth";

describe("registerPushSchema", () => {
  it("accepts Expo push tokens and platforms", () => {
    expect(
      registerPushSchema.parse({
        token: "ExponentPushToken[abc123]",
        platform: "ios",
      })
    ).toEqual({
      token: "ExponentPushToken[abc123]",
      platform: "ios",
    });
    expect(
      registerPushSchema.parse({
        token: "ExpoPushToken[xyz]",
        platform: "android",
      }).platform
    ).toBe("android");
  });

  it("rejects malformed tokens and platforms", () => {
    expect(
      registerPushSchema.safeParse({
        token: "not-a-token",
        platform: "ios",
      }).success
    ).toBe(false);
    expect(
      registerPushSchema.safeParse({
        token: "ExponentPushToken[abc]",
        platform: "windows",
      }).success
    ).toBe(false);
  });
});

describe("unregisterPushSchema / broadcastPushSchema", () => {
  it("validates token and slug shapes", () => {
    expect(
      unregisterPushSchema.parse({ token: "ExponentPushToken[x]" }).token
    ).toBe("ExponentPushToken[x]");
    expect(broadcastPushSchema.parse({ slug: "week-01-pros-cons" }).slug).toBe(
      "week-01-pros-cons"
    );
    expect(broadcastPushSchema.safeParse({ slug: "../etc" }).success).toBe(
      false
    );
  });
});

describe("buildNewPostMessage", () => {
  it("builds title, body, and deep-link data", () => {
    expect(
      buildNewPostMessage("ExponentPushToken[t]", {
        slug: "week-01",
        title: "Week 1 Pros & Cons",
        description: "What worked and what didn't.",
        siteOrigin: "https://patonsports.com/",
      })
    ).toEqual({
      to: "ExponentPushToken[t]",
      title: "Week 1 Pros & Cons",
      body: "What worked and what didn't.",
      sound: "default",
      data: {
        slug: "week-01",
        url: "https://patonsports.com/blog/week-01",
      },
    });
  });
});

describe("tokensWithDeviceNotRegistered", () => {
  it("returns only tokens whose tickets report DeviceNotRegistered", () => {
    const tokens = ["a", "b", "c"];
    const tickets: ExpoPushTicket[] = [
      { status: "ok", id: "1" },
      {
        status: "error",
        message: "gone",
        details: { error: "DeviceNotRegistered" },
      },
      {
        status: "error",
        message: "bad",
        details: { error: "MessageTooBig" },
      },
    ];
    expect(tokensWithDeviceNotRegistered(tokens, tickets)).toEqual(["b"]);
  });

  it("handles missing tickets without throwing", () => {
    expect(tokensWithDeviceNotRegistered(["a", "b"], [])).toEqual([]);
  });
});

describe("normalizeTickets / chunkMessages", () => {
  it("normalizes single and array ticket payloads", () => {
    expect(normalizeTickets({ status: "ok", id: "1" })).toEqual([
      { status: "ok", id: "1" },
    ]);
    expect(normalizeTickets([{ status: "ok", id: "1" }])).toHaveLength(1);
    expect(normalizeTickets(undefined)).toEqual([]);
  });

  it("chunks at the Expo batch size", () => {
    const items = Array.from({ length: 205 }, (_, i) => i);
    const chunks = chunkMessages(items, 100);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(100);
    expect(chunks[2]).toHaveLength(5);
  });
});

describe("bearerMatches", () => {
  it("accepts the expected Bearer secret", () => {
    expect(bearerMatches("Bearer s3cret", "s3cret")).toBe(true);
    expect(bearerMatches("Bearer wrong", "s3cret")).toBe(false);
    expect(bearerMatches("s3cret", "s3cret")).toBe(false);
  });
});
