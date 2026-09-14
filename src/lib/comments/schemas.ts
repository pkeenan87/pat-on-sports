import { z } from "zod";

export const submitCommentSchema = z.object({
  name: z.string().trim().min(1).max(60),
  email: z
    .string()
    .trim()
    .max(254)
    .transform((v) => (v === "" ? undefined : v))
    .pipe(z.string().email().optional()),
  body: z.string().trim().min(1).max(2000),
  parentId: z.string().uuid().nullable().optional(),
  /** Honeypot — must be empty / absent. */
  website: z
    .string()
    .optional()
    .refine((v) => v === undefined || v === "", {
      message: "Honeypot filled",
    }),
});

export const reportCommentSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export type SubmitCommentInput = z.infer<typeof submitCommentSchema>;
export type ReportCommentInput = z.infer<typeof reportCommentSchema>;
