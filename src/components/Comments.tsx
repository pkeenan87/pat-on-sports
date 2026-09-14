import { useEffect, useId, useRef, useState } from "react";

export type PublicComment = {
  id: string;
  authorName: string;
  bodyHtml: string;
  isAuthor: boolean;
  createdAt: string;
  replies: PublicComment[];
};

type Props = {
  slug: string;
};

const SUBMIT_TIMEOUT_MS = 15_000;

declare global {
  interface Window {
    __posBotIdInit?: boolean;
  }
}

/**
 * Initialise the BotID client exactly once per page lifetime.
 *
 * initBotId() wraps window.fetch and creates a challenge instance each time it
 * is called, but only the most recent instance ever receives the challenge
 * result. Every earlier wrapper then awaits a promise that never resolves, so
 * a second call (this island remounts on every view-transition navigation)
 * makes all later protected fetches hang. A window-level flag survives soft
 * navigations, unlike module state, so the guard holds across the session.
 */
function ensureBotId(): void {
  if (!import.meta.env.PROD) return;
  if (typeof window === "undefined" || window.__posBotIdInit) return;
  window.__posBotIdInit = true;
  import("botid/client/core")
    .then(({ initBotId }) => {
      initBotId({
        protect: [{ path: "/api/comments/*", method: "POST" }],
      });
    })
    .catch(() => {
      // BotID client is optional if the package path changes; the server
      // check decides what to do without it.
      window.__posBotIdInit = false;
    });
}

/** fetch with a hard timeout so a stalled request surfaces as an error. */
function fetchWithTimeout(input: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);
  return fetch(input, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

type Status = { tone: "info" | "error" | "success"; message: string } | null;

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

export default function Comments({ slug }: Props) {
  const statusId = useId();
  const statusRef = useRef<HTMLParagraphElement>(null);
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [reported, setReported] = useState<Set<string>>(() => new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    ensureBotId();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const res = await fetch(`/api/comments/${encodeURIComponent(slug)}.json`);
        if (!res.ok) throw new Error("load failed");
        const data = (await res.json()) as { comments: PublicComment[] };
        if (!cancelled) setComments(data.comments ?? []);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (status && statusRef.current) {
      statusRef.current.focus();
    }
  }, [status]);

  async function submitComment(form: HTMLFormElement, parentId: string | null) {
    setSubmitting(true);
    setStatus(null);
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      body: String(fd.get("body") ?? ""),
      website: String(fd.get("website") ?? ""),
      parentId,
    };

    try {
      const res = await fetchWithTimeout(
        `/api/comments/${encodeURIComponent(slug)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = (await res.json().catch(() => ({}))) as {
        status?: string;
        error?: string;
      };
      if (!res.ok) {
        setStatus({
          tone: "error",
          message: data.error || "Could not post comment. Try again.",
        });
        return;
      }

      const pending = data.status === "pending";
      const optimistic: PublicComment = {
        id: `local-${Date.now()}`,
        authorName: payload.name.trim(),
        bodyHtml: payload.body
          .trim()
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\n/g, "<br>"),
        isAuthor: false,
        createdAt: new Date().toISOString(),
        replies: [],
      };

      setComments((prev) => {
        if (!parentId) return [...prev, optimistic];
        return prev.map((c) =>
          c.id === parentId
            ? { ...c, replies: [...c.replies, optimistic] }
            : c
        );
      });
      form.reset();
      setReplyTo(null);
      setStatus({
        tone: pending ? "info" : "success",
        message: pending
          ? "Thanks — your comment is awaiting moderation."
          : "Posted.",
      });
    } catch (err) {
      const timedOut = err instanceof DOMException && err.name === "AbortError";
      setStatus({
        tone: "error",
        message: timedOut
          ? "Posting timed out. Reload the page and try again."
          : "Could not post comment. Try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function report(id: string) {
    if (reported.has(id)) return;
    try {
      const res = await fetchWithTimeout(
        `/api/comments/${encodeURIComponent(id)}/report`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }
      );
      if (!res.ok) throw new Error("report failed");
      setReported((prev) => new Set(prev).add(id));
      setStatus({ tone: "info", message: "Report received. Thanks." });
    } catch {
      setStatus({ tone: "error", message: "Could not send report." });
    }
  }

  return (
    <div className="mt-6">
      <p
        ref={statusRef}
        id={statusId}
        tabIndex={-1}
        aria-live="polite"
        className={
          status
            ? status.tone === "error"
              ? "mb-4 text-sm text-red"
              : status.tone === "success"
                ? "mb-4 text-sm text-navy font-semibold"
                : "mb-4 text-sm text-navy-muted"
            : "sr-only"
        }
      >
        {status?.message ?? ""}
      </p>

      {loading ? (
        <p className="text-sm text-navy-muted">Loading comments…</p>
      ) : loadError ? (
        <p className="text-sm text-navy-muted">
          Comments are temporarily unavailable.
        </p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-navy-muted mb-6">
          No comments yet. Be the first.
        </p>
      ) : (
        <ul className="mb-8 space-y-6 list-none p-0 m-0">
          {comments.map((c) => (
            <li key={c.id} className="border-t border-silver/40 pt-5">
              <CommentItem
                comment={c}
                onReply={() => setReplyTo(c.id)}
                onReport={() => void report(c.id)}
                reported={reported.has(c.id)}
              />
              {c.replies.map((r) => (
                <div key={r.id} className="mt-4 ml-4 sm:ml-8 border-l border-silver/40 pl-4">
                  <CommentItem
                    comment={r}
                    onReport={() => void report(r.id)}
                    reported={reported.has(r.id)}
                  />
                </div>
              ))}
              {replyTo === c.id ? (
                <div className="mt-4 ml-4 sm:ml-8">
                  <CommentForm
                    submitting={submitting}
                    statusId={statusId}
                    submitLabel="Post reply"
                    onCancel={() => setReplyTo(null)}
                    onSubmit={(form) => void submitComment(form, c.id)}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-silver/40 pt-6">
        <h3 className="font-display text-lg font-bold tracking-wide text-navy mb-3">
          Leave a comment
        </h3>
        <CommentForm
          submitting={submitting}
          statusId={statusId}
          submitLabel="Post comment"
          onSubmit={(form) => void submitComment(form, null)}
        />
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  onReply,
  onReport,
  reported,
}: {
  comment: PublicComment;
  onReply?: () => void;
  onReport: () => void;
  reported: boolean;
}) {
  return (
    <div>
      <p className="text-sm text-navy-muted">
        <span className="font-semibold text-navy">{comment.authorName}</span>
        {comment.isAuthor ? (
          <span className="ml-2 inline-block rounded-sm bg-navy px-1.5 py-0.5 text-[10px] font-display font-bold tracking-wider uppercase text-white">
            Pat
          </span>
        ) : null}
        <span aria-hidden="true"> · </span>
        <time dateTime={comment.createdAt}>{formatWhen(comment.createdAt)}</time>
      </p>
      <p
        className="mt-2 text-navy leading-relaxed"
        dangerouslySetInnerHTML={{ __html: comment.bodyHtml }}
      />
      <div className="mt-2 flex flex-wrap gap-3 text-sm">
        {onReply ? (
          <button
            type="button"
            className="font-semibold text-navy hover:text-red"
            onClick={onReply}
          >
            Reply
          </button>
        ) : null}
        <button
          type="button"
          className="text-navy-muted hover:text-red disabled:opacity-50"
          onClick={onReport}
          disabled={reported || comment.id.startsWith("local-")}
        >
          {reported ? "Reported" : "Report"}
        </button>
      </div>
    </div>
  );
}

function CommentForm({
  submitting,
  statusId,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  submitting: boolean;
  statusId: string;
  submitLabel: string;
  onSubmit: (form: HTMLFormElement) => void;
  onCancel?: () => void;
}) {
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(e.currentTarget);
      }}
      aria-describedby={statusId}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-semibold text-navy">Name</span>
          <input
            name="name"
            required
            maxLength={60}
            autoComplete="name"
            className="mt-1 w-full border border-silver/50 bg-white px-3 py-2 text-navy"
          />
        </label>
        <label className="block text-sm">
          <span className="font-semibold text-navy">Email (optional)</span>
          <input
            name="email"
            type="email"
            maxLength={254}
            autoComplete="email"
            className="mt-1 w-full border border-silver/50 bg-white px-3 py-2 text-navy"
          />
          <span className="mt-1 block text-xs text-navy-muted">
            Never displayed. Used only to skip moderation after your first approval.
          </span>
        </label>
      </div>
      <label className="block text-sm">
        <span className="font-semibold text-navy">Comment</span>
        <textarea
          name="body"
          required
          maxLength={2000}
          rows={4}
          className="mt-1 w-full border border-silver/50 bg-white px-3 py-2 text-navy"
        />
      </label>
      {/* Honeypot */}
      <label className="hidden" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-muted disabled:opacity-60"
        >
          {submitting ? "Posting…" : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            className="text-sm font-semibold text-navy-muted hover:text-red"
            onClick={onCancel}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
