"use client";

import { useEffect } from "react";

type Props = {
  /** Unique ID for this page’s comment thread (use the post slug) */
  boxId: string;
  /** Optional: start sort order */
  sortOrder?: "best" | "newest" | "oldest";
};

export default function CommentBox({ boxId, sortOrder = "best" }: Props) {
  useEffect(() => {
    let remove: undefined | (() => void);

    (async () => {
      const mod = await import("commentbox.io");
      const commentBox = mod.default;

      // commentBox() returns a cleanup function per their docs (React section). :contentReference[oaicite:3]{index=3}
      remove = commentBox(process.env.NEXT_PUBLIC_COMMENTBOX_PROJECT_ID as string, {
        defaultBoxId: boxId,
        sortOrder,
      });
    })();

    return () => {
      if (remove) remove();
    };
  }, [boxId, sortOrder]);

  return (
    <div className="mt-12">
      <div className="commentbox" id={boxId} />
    </div>
  );
}
