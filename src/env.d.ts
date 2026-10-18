/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_TWITTER_SITE?: string;
  /** Optional comments API origin for the app manifest (Plan 1). */
  readonly PUBLIC_COMMENTS_API_BASE?: string;
  /** Optional emergency banner shown by the native app. */
  readonly PUBLIC_APP_BANNER_MESSAGE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL?: string;
    ADMIN_PASSWORD?: string;
    SESSION_SECRET?: string;
    IP_HASH_SALT?: string;
    CRON_SECRET?: string;
    BLOB_READ_WRITE_TOKEN?: string;
    /** Server-only. Resend API key for new-comment mail. Never PUBLIC_. */
    RESEND_API_KEY?: string;
    /** Inbox that receives new-comment notifications. */
    COMMENT_NOTIFY_TO?: string;
    /** Verified Resend sender, e.g. Pat on Sports <comments@patonsports.com>. */
    COMMENT_NOTIFY_FROM?: string;
    /** HMAC secret for one-time comment approve/reject links. */
    COMMENT_APPROVAL_SECRET?: string;
  }
}
