import { z } from "zod";

export const SubmissionInput = z.object({
  code: z.string(),
  languageId: z.enum(["js", "cpp"]),
  problemId: z.string(),
  activeContestId: z.string().optional(),
});
