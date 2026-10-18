import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCommentNotificationEmail,
  parseNotifyFrom,
  parseNotifyTo,
  sendResendEmail,
} from "./commentEmail";

const approveUrl =
  "https://patonsports.com/comments/moderate?token=approve-token.sig";
const rejectUrl =
  "https://patonsports.com/comments/moderate?token=reject-token.sig";
const postUrl = "https://patonsports.com/blog/week-01";

function built() {
  return buildCommentNotificationEmail({
    postTitle: "Week 1 <Patriots>\r\nBcc: bad@evil.test",
    postUrl,
    authorName: '</pre><a href="https://evil.test">Bob</a>',
    body: 'Hello <img src=x onerror=alert(1)>\nvisit https://evil.test/phish and www.evil.test',
    status: "pending",
    approveUrl,
    rejectUrl,
  });
}

describe("buildCommentNotificationEmail", () => {
  it("escapes commenter name and text and does not link URLs inside the comment", () => {
    const email = built();
    const hrefs = [...email.html.matchAll(/href="([^"]*)"/g)].map((match) => match[1]);
    expect(hrefs).toEqual([postUrl, approveUrl, rejectUrl]);

    const commentHtml =
      email.html.match(/data-comment-body[^>]*>([\s\S]*?)<\/pre>/)?.[1] ?? "";
    expect(commentHtml).not.toContain("<a");
    expect(commentHtml).not.toContain("<img");
    expect(commentHtml).not.toContain("<script");
    expect(commentHtml).toContain("&lt;img");
    expect(commentHtml).not.toContain("https://evil.test");
    expect(commentHtml).toContain("https:\u200b");
    expect(commentHtml).toContain("www.\u200b");
    expect(email.html).not.toContain("https://evil.test");
    expect(email.html).toContain("&lt;/pre&gt;");
    expect(email.html).toContain("&lt;Patriots&gt;");
    expect(email.html).not.toContain("<script");
    expect(email.html).not.toContain("<img");

    expect(email.text).toContain("https:\u200b");
    expect(email.text).toContain(approveUrl);
    expect(email.text).toContain(rejectUrl);
    expect(email.text).not.toContain("https://evil.test");
    expect(email.text).toContain("Hello <img src=x onerror=alert(1)>");
    expect(email.subject).not.toMatch(/[\r\n]/);
    expect(email.subject).toContain("Week 1 <Patriots>");
  });

  it("says when a trusted commenter is already public", () => {
    const email = buildCommentNotificationEmail({
      postTitle: "Week 2",
      postUrl,
      authorName: "Sam",
      body: "Nice game",
      status: "approved",
      approveUrl,
      rejectUrl,
    });
    expect(email.subject).toContain("already public");
    expect(email.text).toContain("already public");
    expect(email.html).not.toContain("<a href=\"https://evil");
  });
});

const sendAs = "aaaa-bbbb-cccc";

describe("sendResendEmail", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts the escaped message and keeps the API key out of logs and the body", async () => {
    const fetchImpl = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response("nope", { status: 500 })
    );
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const email = built();
    const ok = await sendResendEmail({
      apiKey: sendAs,
      from: "Pat on Sports <comments@patonsports.com>",
      to: ["pat@example.com"],
      subject: email.subject,
      html: email.html,
      text: email.text,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(ok).toBe(false);
    const logged = spy.mock.calls.flat().join(" ");
    expect(logged).not.toContain(sendAs);
    const init = fetchImpl.mock.calls[0]?.[1];
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${sendAs}`);
    const payload = JSON.parse(String(init?.body)) as { html: string };
    expect(payload.html).toContain("&lt;img");
    expect(JSON.stringify(payload)).not.toContain(sendAs);
  });

  it("logs a network failure and still resolves", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const ok = await sendResendEmail({
      apiKey: sendAs,
      from: "comments@patonsports.com",
      to: ["pat@example.com"],
      subject: "Hi",
      html: "<p>Hi</p>",
      text: "Hi",
      fetchImpl: (async () => {
        throw new Error("network down");
      }) as unknown as typeof fetch,
    });
    expect(ok).toBe(false);
  });
});

describe("notify address parsers", () => {
  it("accepts a named from address and a comma-separated to list", () => {
    expect(parseNotifyFrom("Pat on Sports <comments@patonsports.com>")).toBe(
      "Pat on Sports <comments@patonsports.com>"
    );
    expect(parseNotifyTo("a@example.com, b@example.com")).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
  });

  it("rejects header injection and malformed addresses", () => {
    expect(parseNotifyFrom("bad@example.com\r\nBcc: x@y.z")).toBeNull();
    expect(parseNotifyTo("not-an-email")).toBeNull();
    expect(parseNotifyFrom("<>")).toBeNull();
  });
});
