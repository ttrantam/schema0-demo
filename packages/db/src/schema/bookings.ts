import { z } from "zod/v4";
import { pgTable, text, varchar, timestamp, uuid, date, index } from "drizzle-orm/pg-core";

// Drizzle ORM table definition
export const bookingsTable = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    sessionId: uuid("session_id").notNull(),
    trainerId: uuid("trainer_id").notNull(),
    bookingDate: date("booking_date").notNull(),
    status: varchar("status", { length: 50 }).default("pending"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [
    index("bookings_user_id_idx").on(t.userId),
    index("bookings_session_id_idx").on(t.sessionId),
    index("bookings_trainer_id_idx").on(t.trainerId),
  ],
);

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
