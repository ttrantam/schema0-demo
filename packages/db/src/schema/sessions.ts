import { z } from "zod/v4";

export const selectSessionsSchema = z.object({
  id: z.string(),
  trainerId: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  schedule: z.object({
    dayOfWeek: z.string(), // "Monday", "Tuesday", etc.
    startTime: z.string(), // "09:00" in 24-hour format
    endTime: z.string(), // "10:00" in 24-hour format
  }),
  maxParticipants: z.number().nullable().optional().default(1),
  currentParticipants: z.number().nullable().optional().default(0),
  pricePerSession: z.number().nullable().optional(),
  sessionType: z.enum(["one-on-one", "group"]).default("one-on-one"),
  status: z.enum(["active", "inactive", "full"]).default("active"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const insertSessionsSchema = z.object({
  trainerId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  schedule: z.object({
    dayOfWeek: z.string(),
    startTime: z.string(),
    endTime: z.string(),
  }),
  maxParticipants: z.number().optional(),
  pricePerSession: z.number().optional(),
  sessionType: z.enum(["one-on-one", "group"]).default("one-on-one"),
});

export const updateSessionsSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  schedule: z.object({
    dayOfWeek: z.string(),
    startTime: z.string(),
    endTime: z.string(),
  }).optional(),
  maxParticipants: z.number().nullable().optional(),
  pricePerSession: z.number().nullable().optional(),
  sessionType: z.enum(["one-on-one", "group"]).optional(),
  status: z.enum(["active", "inactive", "full"]).optional(),
});

export const sessionsFormSchema = insertSessionsSchema.omit({
  trainerId: true,
});

export const sessionsEditFormSchema = sessionsFormSchema.partial();
