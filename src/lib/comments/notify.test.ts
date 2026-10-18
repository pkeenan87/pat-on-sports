import { afterEach, describe, expect, it, vi } from "vitest";
import {
  deliverCommentNotification,
  scheduleCommentNotification,
  type CommentNotificationInput,
} from "./notify";

const sample: CommentNotificationInput = {
  commentId: "11111111-1111-4111-8111-111111111111",
  postSlug: "week-01",
  authorName: "Sam",
  body: "Nice game",
  status: "pending",
};

const ENV_KEYS = [
  "RESEND_API_KEY",
  "COMMENT_NOTIFY_TO",
  "COMMENT_NOTIFY_FROM",
  "COMMENT_APPROVAL_SECRET",
] as const;

describe("scheduleCommentNotification", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns before the notification finishes", async () => {
    let finished = false;
    scheduleCommentNotification(sample, async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      finished = true;
    });
    expect(finished).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(finished).toBe(true);
  });

  it("logs a send failure instead of rejecting comment submission", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      scheduleCommentNotification(sample, async () => {
        throw new Error("resend down");
      })
    ).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(spy.mock.calls.flat().join(" ")).toContain("resend down");
  });
});

describe("deliverCommentNotification", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("skips sending when Resend is not configured", async () => {
    const previous = Object.fromEntries(
      ENV_KEYS.map((key) => [key, process.env[key]])
    );
    for (const key of ENV_KEYS) delete process.env[key];
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(deliverCommentNotification(sample)).resolves.toBeUndefined();
    expect(spy.mock.calls.flat().join(" ")).toContain("RESEND_API_KEY");
    for (const key of ENV_KEYS) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  });
});
