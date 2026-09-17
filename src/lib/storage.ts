import "server-only";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export type Uploaded = { url: string; alt: string | null };

/**
 * Images go to Cloudflare R2, which speaks the S3 API — that's why this
 * uses the AWS SDK against R2's endpoint rather than an R2-specific client.
 *
 * Required env vars:
 *   R2_ACCOUNT_ID          — Cloudflare dashboard, right sidebar of the R2 page
 *   R2_ACCESS_KEY_ID       — R2 → Manage API tokens → create one scoped to this bucket
 *   R2_SECRET_ACCESS_KEY   — shown once when you create that token
 *   R2_BUCKET              — the bucket name, e.g. "moon-and-thread"
 *   R2_PUBLIC_URL           — the bucket's public URL: either the r2.dev URL
 *                             R2 gives you, or a custom domain you attached to it.
 *                             No trailing slash.
 */
function client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 isn't configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY, " +
        "or paste image URLs instead of uploading files.",
    );
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function uploadImage(file: File, prefix = "products"): Promise<Uploaded> {
  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!bucket || !publicUrl) {
    throw new Error(
      "R2 isn't configured. Set R2_BUCKET and R2_PUBLIC_URL, or paste image URLs instead of uploading files.",
    );
  }
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} is not an image.`);
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error(`${file.name} is over 8 MB. Resize it and try again.`);
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
  const key = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  await client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bytes,
      ContentType: file.type,
      // Cache aggressively: the random suffix in `key` means a new upload
      // never collides with, or needs to invalidate, an old URL.
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return { url: `${publicUrl}/${key}`, alt: null };
}
