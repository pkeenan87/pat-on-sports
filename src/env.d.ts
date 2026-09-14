/// <reference types="astro/client" />
interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_COMMENTBOX_PROJECT_ID?: string;
  readonly PUBLIC_TWITTER_SITE?: string;
  /** Optional comments API origin for the app manifest (Plan 1). */
  readonly PUBLIC_COMMENTS_API_BASE?: string;
  /** Optional emergency banner shown by the native app. */
  readonly PUBLIC_APP_BANNER_MESSAGE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
