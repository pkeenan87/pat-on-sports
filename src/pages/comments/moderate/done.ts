import type { APIRoute } from "astro";
import {
  htmlResponse,
  renderResultPage,
  toPublicResult,
} from "../../../lib/comments/moderationPage";

export const prerender = false;

export const GET: APIRoute = ({ url }) => {
  const result = toPublicResult(url.searchParams.get("result") ?? "");
  return htmlResponse(renderResultPage(result));
};
