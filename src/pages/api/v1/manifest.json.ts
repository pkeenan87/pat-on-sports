import type { APIRoute } from "astro";
import {
  buildManifest,
  jsonResponse,
  siteOrigin,
} from "../../../lib/api";

export const GET: APIRoute = async () => {
  const site = siteOrigin(import.meta.env.PUBLIC_SITE_URL);
  // Comments API lands with Plan 1; until then the app treats null as "omit".
  const commentsApiBase =
    import.meta.env.PUBLIC_COMMENTS_API_BASE?.trim() || null;
  const message = import.meta.env.PUBLIC_APP_BANNER_MESSAGE?.trim() || null;

  return jsonResponse(
    buildManifest({
      site,
      commentsApiBase,
      message,
    })
  );
};
