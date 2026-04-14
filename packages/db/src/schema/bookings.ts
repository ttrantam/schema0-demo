import { z } from "zod/v4";

export const selectBookingsSchema = z.object({
  id: z.string(),
  userId: z.string(),
  sessionId: z.string(),
  trainerId: z.string(),
  bookingDate: z.string(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).default("pending"),
  notes: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const insertBookingsSchema = z.object({
  userId: z.string(),
  sessionId: z.string(),
  trainerId: z.string(),
  bookingDate: z.string(),
  notes: z.string().optional(),
});

export const updateBookingsSchema = z.object({
  id: z.string(),
  bookingDate: z.string().optional(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  notes: z.string().nullable().optional(),
});

export const bookingsFormSchema = insertBookingsSchema.omit({
  userId: true,
});

export const bookingsEditFormSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
  notes: z.string().nullable().optional(),
});
