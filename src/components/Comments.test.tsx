import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Comments from "./Comments";

vi.mock("botid/client/core", () => ({
  initBotId: vi.fn(),
}));

const sample = {
  comments: [
    {
      id: "c1",
      authorName: "Alex",
      bodyHtml: "Great take.",
      isAuthor: false,
      createdAt: "2026-09-01T12:00:00.000Z",
      replies: [],
    },
  ],
};

describe("Comments", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();

        if (method === "GET" && url.startsWith("/api/comments/recap.json")) {
          return new Response(JSON.stringify(sample), { status: 200 });
        }
        if (method === "POST" && url.endsWith("/api/comments/recap")) {
          const body = JSON.parse(String(init?.body ?? "{}")) as {
            email?: string;
          };
          return new Response(
            JSON.stringify({
              status: body.email ? "approved" : "pending",
            }),
            { status: 201 }
          );
        }
        if (method === "POST" && url.endsWith("/api/comments/c1/report")) {
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        return new Response(
          JSON.stringify({ error: `unmocked ${method} ${url}` }),
          { status: 404 }
        );
      }
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    fetchMock.mockReset();
    sessionStorage.clear();
  });

  it("loads and renders the thread", async () => {
    render(<Comments slug="recap" />);
    expect(await screen.findByText("Great take.")).toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeInTheDocument();
  });

  it("submits a first-time comment as pending", async () => {
    const user = userEvent.setup();
    render(<Comments slug="recap" />);
    await screen.findByText("Great take.");

    await user.type(screen.getByRole("textbox", { name: /^Name/ }), "Sam");
    await user.type(
      screen.getByRole("textbox", { name: /^Comment/ }),
      "I agree."
    );
    await user.click(screen.getByRole("button", { name: "Post comment" }));

    await waitFor(() => {
      expect(screen.getByText(/awaiting moderation/i)).toBeInTheDocument();
    });
    expect(screen.getByText("I agree.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/comments/recap",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("does not fetch until the comments section is on screen", async () => {
    let trigger: IntersectionObserverCallback | null = null;
    class FakeObserver implements IntersectionObserver {
      readonly root: Element | Document | null = null;
      readonly rootMargin = "";
      readonly scrollMargin = "";
      readonly thresholds: readonly number[] = [];
      constructor(callback: IntersectionObserverCallback) {
        trigger = callback;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }
    vi.stubGlobal("IntersectionObserver", FakeObserver);

    render(<Comments slug="recap" />);
    expect(screen.getByText("Loading comments…")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    act(() => {
      trigger?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        null as unknown as IntersectionObserver
      );
    });

    expect(await screen.findByText("Great take.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/comments/recap.json",
      undefined
    );
  });

  it("skips the fetch for an obvious crawler", async () => {
    const userAgent = vi.spyOn(navigator, "userAgent", "get");
    userAgent.mockReturnValue(
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
    );

    render(<Comments slug="recap" />);
    expect(await screen.findByText(/no comments yet/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("bypasses the CDN cache on the next read after an approved comment", async () => {
    const user = userEvent.setup();
    const first = render(<Comments slug="recap" />);
    await screen.findByText("Great take.");

    await user.type(screen.getByRole("textbox", { name: /^Name/ }), "Sam");
    await user.type(screen.getByRole("textbox", { name: /^Email/ }), "sam@example.com");
    await user.type(screen.getByRole("textbox", { name: /^Comment/ }), "I agree.");
    await user.click(screen.getByRole("button", { name: "Post comment" }));
    await screen.findByText(/^Posted\.$/);

    first.unmount();
    fetchMock.mockClear();
    render(<Comments slug="recap" />);
    await screen.findByText("Great take.");

    const read = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).startsWith("/api/comments/recap.json") &&
        (init as RequestInit | undefined)?.method !== "POST"
    );
    expect(String(read?.[0])).toMatch(/\/api\/comments\/recap\.json\?fresh=\d{13}$/);
    expect(read?.[1]).toEqual({ cache: "no-store" });
  });

  it("keeps the shared cache after a comment that is still pending", async () => {
    const user = userEvent.setup();
    const first = render(<Comments slug="recap" />);
    await screen.findByText("Great take.");

    await user.type(screen.getByRole("textbox", { name: /^Name/ }), "Sam");
    await user.type(screen.getByRole("textbox", { name: /^Comment/ }), "I agree.");
    await user.click(screen.getByRole("button", { name: "Post comment" }));
    await screen.findByText(/awaiting moderation/i);

    first.unmount();
    fetchMock.mockClear();
    render(<Comments slug="recap" />);
    await screen.findByText("Great take.");

    expect(fetchMock).toHaveBeenCalledWith("/api/comments/recap.json", undefined);
    expect(sessionStorage.getItem("pos-comments-fresh:recap")).toBeNull();
  });

  it("reports a comment and disables the control", async () => {
    const user = userEvent.setup();
    render(<Comments slug="recap" />);
    await screen.findByText("Great take.");

    await user.click(screen.getByRole("button", { name: "Report" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Reported" })).toBeDisabled();
    });
  });
});
