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

export const updateBookingsSchema = selectBookingsSchema
  .omit({
    id: true,
    userId: true,
    sessionId: true,
    trainerId: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial()
  .required({ id: true });

export const bookingsFormSchema = insertBookingsSchema.omit({
  userId: true,
});

export const bookingsEditFormSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
  notes: z.string().nullable().optional(),
});
