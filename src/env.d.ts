/// <reference types="astro/client" />
interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_COMMENTBOX_PROJECT_ID?: string;
  readonly PUBLIC_TWITTER_SITE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
