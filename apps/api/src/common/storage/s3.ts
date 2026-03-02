import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION || "us-east-2";
const bucket = process.env.CURATED_RECIPES_BUCKET;
const keyPrefix = (process.env.CURATED_RECIPES_PREFIX || "").replace(/^\/+|\/+$/g, "");

if (!bucket) {
  console.warn("CURATED_RECIPES_BUCKET is missing");
}

const s3 = new S3Client({ region });

function resolveObjectKey(rawKey: string): string {
  const trimmedKey = rawKey.replace(/^\/+/, "");
  if (!keyPrefix) return trimmedKey;
  if (trimmedKey.startsWith(`${keyPrefix}/`)) return trimmedKey;
  return `${keyPrefix}/${trimmedKey}`;
}

export async function getRecipeImageSignedUrl(s3Key: string): Promise<string> {
  if (!bucket) throw new Error("CURATED_RECIPES_BUCKET is not configured");
  const objectKey = resolveObjectKey(s3Key);

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: objectKey,
  });

  return getSignedUrl(s3, command, { expiresIn: 3600 });
}
