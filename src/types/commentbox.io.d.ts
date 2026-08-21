declare module "commentbox.io" {
  export type CommentBoxOptions = {
    defaultBoxId?: string;
    sortOrder?: "best" | "newest" | "oldest";
    [key: string]: unknown;
  };

  /**
   * Initializes CommentBox for elements with class "commentbox".
   * Returns a cleanup function (removes listeners/observers).
   */
  export default function commentBox(
    projectId: string,
    options?: CommentBoxOptions
  ): () => void;
}
