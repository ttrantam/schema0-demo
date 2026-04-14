import { z } from "zod/v4";

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

export const updateTrainersSchema = selectTrainersSchema
  .omit({
    id: true,
    userId: true,
    email: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial()
  .required({ id: true });

export const trainersFormSchema = insertTrainersSchema.omit({
  userId: true,
});

export const trainersEditFormSchema = trainersFormSchema.partial();
