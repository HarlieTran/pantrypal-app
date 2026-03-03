import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION || "us-east-2";
const bucket = process.env.CURATED_RECIPES_BUCKET;
const keyPrefix = (process.env.CURATED_RECIPES_PREFIX || "images").replace(/^\/+|\/+$/g, "");

if (!bucket) {
  console.warn("CURATED_RECIPES_BUCKET is missing");
}

export const s3 = new S3Client({ region });

function resolveObjectKey(rawKey: string): string {
  if (rawKey.startsWith("s3://")) {
    const withoutScheme = rawKey.slice("s3://".length);
    const firstSlash = withoutScheme.indexOf("/");
    const keyPart = firstSlash >= 0 ? withoutScheme.slice(firstSlash + 1) : "";
    const trimmedFromS3 = keyPart.replace(/^\/+/, "");
    if (!keyPrefix) return trimmedFromS3;
    if (trimmedFromS3.startsWith(`${keyPrefix}/`)) return trimmedFromS3;
    return `${keyPrefix}/${trimmedFromS3}`;
  }

  const trimmedKey = rawKey.replace(/^\/+/, "");
  if (!keyPrefix) return trimmedKey;
  if (trimmedKey.startsWith(`${keyPrefix}/`)) return trimmedKey;
  return `${keyPrefix}/${trimmedKey}`;
}

function isHttpUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

function toPublicS3Url(objectKey: string): string {
  if (!bucket) return "";
  const encodedKey = objectKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;
}

function keyVariants(rawKey: string): string[] {
  const cleaned = rawKey.replace(/^\/+/, "");
  const fromResolver = resolveObjectKey(rawKey);
  const variants = new Set<string>([fromResolver, cleaned]);

  if (cleaned.includes("/")) {
    const filenameOnly = cleaned.split("/").pop();
    if (filenameOnly) variants.add(filenameOnly);
  }

  if (keyPrefix) {
    variants.add(`${keyPrefix}/${cleaned}`);
    if (cleaned.includes("/")) {
      const filenameOnly = cleaned.split("/").pop();
      if (filenameOnly) variants.add(`${keyPrefix}/${filenameOnly}`);
    }
  }

  return [...variants].filter(Boolean);
}

async function firstExistingObjectKey(rawKey: string): Promise<string | null> {
  if (!bucket) return null;

  for (const candidate of keyVariants(rawKey)) {
    try {
      await s3.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: candidate,
        })
      );
      return candidate;
    } catch {
      // try next candidate
    }
  }

  return null;
}

export async function getRecipeImageSignedUrl(s3Key: string): Promise<string> {
  if (!bucket) throw new Error("CURATED_RECIPES_BUCKET is not configured");
  const objectKey = (await firstExistingObjectKey(s3Key)) ?? resolveObjectKey(s3Key);

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: objectKey,
  });

  return getSignedUrl(s3, command, { expiresIn: 3600 });
}

export async function getRecipeImageUrl(s3Key: string): Promise<string | null> {
  if (isHttpUrl(s3Key)) return s3Key;

  const objectKey = (await firstExistingObjectKey(s3Key)) ?? resolveObjectKey(s3Key);
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    });
    return getSignedUrl(s3, command, { expiresIn: 3600 });
  } catch (error) {
    console.error(`Failed to sign S3 URL for key "${objectKey}":`, error);
    const publicUrl = toPublicS3Url(objectKey);
    return publicUrl || null;
  }
}
