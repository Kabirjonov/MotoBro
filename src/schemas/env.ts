import { z } from "zod";

const emptyStringToUndefined = z.literal("").transform(() => undefined);

const optionalUrl = z.union([z.url(), emptyStringToUndefined]).optional();

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
});

export const databaseEnvSchema = z.object({
  DATABASE_URL: z.url(),
});

export const serverEnvSchema = publicEnvSchema.extend({
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.url(),
  DATABASE_URL: z.url(),
  NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: z.string().min(32),
  STORAGE_DRIVER: z.enum(["local", "s3", "uploadthing"]).default("local"),
  STORAGE_ACCESS_KEY_ID: z.string().min(1).optional(),
  STORAGE_BUCKET: z.string().min(1).optional(),
  STORAGE_ENDPOINT: optionalUrl,
  STORAGE_PUBLIC_URL: optionalUrl,
  STORAGE_REGION: z.string().min(1).default("auto"),
  STORAGE_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  UPLOADTHING_TOKEN: z.string().min(1).optional(),
  UPLOADTHING_SECRET: z.string().min(1).optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
