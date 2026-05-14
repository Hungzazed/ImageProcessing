import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../config/env";

const s3Client = new S3Client({
  region: env.s3Region,
  credentials:
    env.awsAccessKeyId && env.awsSecretAccessKey
      ? {
          accessKeyId: env.awsAccessKeyId,
          secretAccessKey: env.awsSecretAccessKey,
        }
      : undefined,
  endpoint: env.s3Endpoint || undefined,
});

function buildPublicUrl(bucket: string, key: string): string {
  if (env.s3PublicBaseUrl) {
    return `${env.s3PublicBaseUrl.replace(/\/$/, "")}/${key}`;
  }

  if (env.s3Endpoint) {
    return `${env.s3Endpoint.replace(/\/$/, "")}/${bucket}/${key}`;
  }

  const regionSegment = env.s3Region === "us-east-1" ? "" : `.${env.s3Region}`;
  return `https://${bucket}.s3${regionSegment}.amazonaws.com/${key}`;
}

export async function uploadImageToS3(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<{ key: string; url: string }>
{
  if (!env.s3Bucket) {
    throw new Error("S3_BUCKET is required for uploading images");
  }

  const command = new PutObjectCommand({
    Bucket: env.s3Bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  return {
    key,
    url: buildPublicUrl(env.s3Bucket, key),
  };
}
