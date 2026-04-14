import { pgRole } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const authenticatedUserRole = pgRole("authenticated_user").existing();

// ============================================================================
// FORM SCHEMAS
// ============================================================================
// These schemas are for form validation in the UI
// They are not backed by database tables but are used for type-safe form handling

// User form schemas for dialogs and detail views
export const userFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional()
    .or(z.literal("")),
});

// User edit form schema (for detail page - no email/password)
export const userEditFormSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// File upload form schema
export const fileUploadSchema = z.object({
  file: z.any().refine((val) => val instanceof File, "File is required"),
});

// File batch upload form schema
export const fileBatchUploadSchema = z.object({
  files: z
    .array(z.any())
    .refine(
      (val) => val.every((v) => v instanceof File),
      "All items must be File objects",
    ),
});

// ============================================================================
// ENTITY SCHEMAS
// ============================================================================
export * from "./users";
export * from "./files";
export * from "./trainers";
export * from "./sessions";
export * from "./bookings";
