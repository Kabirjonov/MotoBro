import "server-only";

import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { UTApi } from "uploadthing/server";

import { getStorageConfig } from "@/server/config/storage";

export type StoredObject = { contentType: string; data: Buffer };
export interface MediaStorage {
  delete(objectKey: string): Promise<void>;
  put(objectKey: string, object: StoredObject): Promise<{ url: string }>;
}

const localRoot = path.join(process.cwd(), ".local-storage");
function safeLocalPath(objectKey: string) {
  if (!/^[a-f0-9]{2}\/[a-f0-9-]+\.(?:jpg|png|webp|avif)$/.test(objectKey))
    throw new Error("Invalid object key");
  return path.join(localRoot, objectKey);
}

export class LocalMediaStorage implements MediaStorage {
  async put(objectKey: string, object: StoredObject) {
    const filePath = safeLocalPath(objectKey);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, object.data, { flag: "wx" });
    return { url: `/api/media/local/${objectKey}` };
  }
  async delete(objectKey: string) {
    await unlink(safeLocalPath(objectKey)).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error;
      },
    );
  }
}

class UploadThingMediaStorage implements MediaStorage {
  private utapi: UTApi;

  constructor(token: string) {
    this.utapi = new UTApi({ token });
  }

  async put(objectKey: string, object: StoredObject) {
    const file = new File([new Uint8Array(object.data)], objectKey, {
      type: object.contentType,
    });
    const res = await this.utapi.uploadFiles(file);
    if (res.error || !res.data) {
      throw new Error(res.error?.message ?? "UploadThing upload failed");
    }
    return { url: res.data.url };
  }

  async delete(objectKey: string) {
    await this.utapi.deleteFiles(objectKey).catch(() => undefined);
  }
}

class S3MediaStorage implements MediaStorage {
  private client: S3Client;
  constructor(
    private config: Extract<
      ReturnType<typeof getStorageConfig>,
      { driver: "s3" }
    >,
  ) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      forcePathStyle: true,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  async put(objectKey: string, object: StoredObject) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Body: object.data,
        ContentType: object.contentType,
        Key: objectKey,
      }),
    );
    return { url: `${this.config.publicUrl.replace(/\/$/, "")}/${objectKey}` };
  }
  async delete(objectKey: string) {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.config.bucket, Key: objectKey }),
    );
  }
}

export function getMediaStorage(): MediaStorage {
  const config = getStorageConfig();
  if (config.driver === "local") return new LocalMediaStorage();
  if (config.driver === "uploadthing") return new UploadThingMediaStorage(config.token);
  return new S3MediaStorage(config);
}

export async function readLocalMedia(objectKey: string) {
  return readFile(safeLocalPath(objectKey));
}
