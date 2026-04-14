import { z } from "zod/v4";
import { pgTable, text, varchar, integer, numeric, timestamp, uuid, index } from "drizzle-orm/pg-core";

// Drizzle ORM table definition
export const trainersTable = pgTable(
  "trainers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    firstName: varchar("first_name", { length: 255 }).notNull(),
    lastName: varchar("last_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    profilePictureUrl: text("profile_picture_url"),
    bio: text("bio"),
    specialization: varchar("specialization", { length: 255 }),
    certifications: text("certifications").array(),
    rating: numeric("rating", { precision: 3, scale: 2 }).default(0),
    hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
    yearsExperience: integer("years_experience").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [
    index("trainers_user_id_idx").on(t.userId),
    index("trainers_email_idx").on(t.email),
  ],
);

export const selectTrainersSchema = z.object({
  id: z.string(),
  userId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  profilePictureUrl: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  specialization: z.string().nullable().optional(),
  certifications: z.array(z.string()).nullable().optional().default([]),
  rating: z.number().nullable().optional().default(0),
  hourlyRate: z.number().nullable().optional(),
  yearsExperience: z.number().nullable().optional().default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const insertTrainersSchema = z.object({
  userId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  profilePictureUrl: z.string().optional(),
  bio: z.string().optional(),
  specialization: z.string().optional(),
  certifications: z.array(z.string()).optional(),
  hourlyRate: z.number().optional(),
  yearsExperience: z.number().optional(),
});

export const updateTrainersSchema = z.object({
  id: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profilePictureUrl: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  specialization: z.string().nullable().optional(),
  certifications: z.array(z.string()).nullable().optional(),
  hourlyRate: z.number().nullable().optional(),
  yearsExperience: z.number().nullable().optional(),
});

export const trainersFormSchema = insertTrainersSchema.omit({
  userId: true,
});

export const trainersEditFormSchema = trainersFormSchema.partial();
