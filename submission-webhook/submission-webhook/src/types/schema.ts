import { z } from "zod";

export const SubmissionCallback = z.object({
  token: z.string(),
  status: z.object({
    id: z.number(),
    description: z.string()
  }),
  time: z.string().optional(),
  memory: z.number().optional()
});