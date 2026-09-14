import { z } from "zod";

/** Expo push tokens look like ExponentPushToken[…] or ExpoPushToken[…]. */
const expoPushToken = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^Expo(nent)?PushToken\[.+\]$/);

export const registerPushSchema = z.object({
  token: expoPushToken,
  platform: z.enum(["ios", "android", "web"]),
});

export const unregisterPushSchema = z.object({
  token: expoPushToken,
});

export const broadcastPushSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i),
});

export type RegisterPushInput = z.infer<typeof registerPushSchema>;
export type UnregisterPushInput = z.infer<typeof unregisterPushSchema>;
export type BroadcastPushInput = z.infer<typeof broadcastPushSchema>;
