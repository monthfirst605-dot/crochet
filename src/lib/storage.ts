import "server-only";

export type Uploaded = { url: string; alt: string | null };

/**
 * Images go to Vercel Blob when BLOB_READ_WRITE_TOKEN is set.
 * Swapping in S3/R2 means replacing this one function.
 */
export async function uploadImage(file: File, prefix = "products"): Promise<Uploaded> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "No image store connected. Add BLOB_READ_WRITE_TOKEN, or paste image URLs instead of uploading files.",
    );
  }
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} is not an image.`);
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error(`${file.name} is over 8 MB. Resize it and try again.`);
  }

  const { put } = await import("@vercel/blob");
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
  const blob = await put(`${prefix}/${Date.now()}-${safeName}`, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type,
  });
  return { url: blob.url, alt: null };
}
