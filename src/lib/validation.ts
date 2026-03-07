import { z } from "zod";

export const onboardingSchema = z.object({
  name: z.string().min(1).max(50),
  age: z.number().int().min(28).max(120),
  gender: z.enum(["M", "F", "NB"]),
  interestedIn: z.enum(["M", "F", "NB", "ALL"]),
  fiscalArchetype: z.string().min(1).max(100),
  attachmentStyle: z.string().max(100).default(""),
  socialBattery: z.string().max(100).default(""),
  lifePace: z.string().max(100).default(""),
  religion: z.string().max(100).default(""),
  politicalLeaning: z.string().max(100).default(""),
  kidsPreference: z.string().max(100).default(""),
  targetReligion: z.string().max(100).default(""),
  targetPolitical: z.string().max(100).default(""),
  targetKids: z.string().max(100).default(""),
  locationCity: z.string().max(200).default(""),
  locationLat: z.number().min(-90).max(90).nullable().optional(),
  locationLng: z.number().min(-180).max(180).nullable().optional(),
  targetMinAge: z.number().int().min(28).max(120).default(28),
  targetMaxAge: z.number().int().min(28).max(120).default(45),
  targetArchetypes: z.string().max(500).default("The Architect,The Experientialist,The Minimalist,The Builder"),
  targetAttachment: z.string().max(100).default(""),
  targetSocialBattery: z.string().max(100).default(""),
  targetLifePace: z.string().max(100).default(""),
  dealbreakers: z.string().max(500).default(""),
  strongPreferences: z.string().max(500).default(""),
  tags: z.string().max(500).default(""),
  videoUrl: z.string().url().nullable().optional(),
});

export const endorseSchema = z.object({
  targetUserId: z.string().uuid(),
  action: z.enum(["ENDORSE", "PASS"]),
});

export const messageSchema = z.object({
  matchId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

export const operatorConfigPatchSchema = z.object({
  targetMinAge: z.number().int().min(28).max(120).optional(),
  targetMaxAge: z.number().int().min(28).max(120).optional(),
  targetArchetypes: z.string().max(500).optional(),
  targetAttachment: z.string().max(100).optional(),
  targetSocialBattery: z.string().max(100).optional(),
  targetLifePace: z.string().max(100).optional(),
  dealbreakers: z.string().max(500).optional(),
  strongPreferences: z.string().max(500).optional(),
  locationCity: z.string().max(200).optional(),
  isGhostMode: z.boolean().optional(),
  attachmentStyle: z.string().max(100).optional(),
  socialBattery: z.string().max(100).optional(),
  lifePace: z.string().max(100).optional(),
  religion: z.string().max(100).optional(),
  politicalLeaning: z.string().max(100).optional(),
  kidsPreference: z.string().max(100).optional(),
  targetReligion: z.string().max(100).optional(),
  targetPolitical: z.string().max(100).optional(),
  targetKids: z.string().max(100).optional(),
  fiscalArchetype: z.string().max(100).optional(),
}).strict();

export const jointExitSchema = z.object({
  code: z.string().min(1).max(20),
});

export const waitlistSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50).trim(),
  lastName: z.string().min(1, "Last name is required").max(50).trim(),
  email: z.string().email("Invalid email address").max(200).trim().toLowerCase(),
  city: z.string().min(1, "City is required").max(200).trim(),
});

export function parseOrError<T>(schema: z.ZodType<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  return { success: false, error: `Validation failed: ${issues}` };
}
