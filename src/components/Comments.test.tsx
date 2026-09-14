import { render, screen, waitFor } from "@testing-library/react";
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

        if (method === "GET" && url.endsWith("/api/comments/recap.json")) {
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
    fetchMock.mockReset();
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
