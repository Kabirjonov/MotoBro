import "server-only";

import { getServerEnv } from "@/server/env";

export type StorageConfig =
  | Readonly<{ driver: "local" }>
  | Readonly<{
      driver: "uploadthing";
      secret?: string;
      token: string;
    }>
  | Readonly<{
      accessKeyId: string;
      bucket: string;
      driver: "s3";
      endpoint: string;
      publicUrl: string;
      region: string;
      secretAccessKey: string;
    }>;

export function getStorageConfig(): StorageConfig {
  const env = getServerEnv();
  if (env.STORAGE_DRIVER === "local") return { driver: "local" };
  if (env.STORAGE_DRIVER === "uploadthing") {
    const token = env.UPLOADTHING_TOKEN ?? process.env.UPLOADTHING_TOKEN;
    if (!token) {
      throw new Error("UploadThing storage configuration is missing UPLOADTHING_TOKEN");
    }
    return {
      driver: "uploadthing",
      secret: env.UPLOADTHING_SECRET ?? process.env.UPLOADTHING_SECRET,
      token,
    };
  }
  if (
    !env.STORAGE_ACCESS_KEY_ID ||
    !env.STORAGE_BUCKET ||
    !env.STORAGE_ENDPOINT ||
    !env.STORAGE_PUBLIC_URL ||
    !env.STORAGE_SECRET_ACCESS_KEY
  ) {
    throw new Error("S3 storage configuration is incomplete");
  }
  return {
    accessKeyId: env.STORAGE_ACCESS_KEY_ID,
    bucket: env.STORAGE_BUCKET,
    driver: "s3",
    endpoint: env.STORAGE_ENDPOINT,
    publicUrl: env.STORAGE_PUBLIC_URL,
    region: env.STORAGE_REGION,
    secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
  };
}
