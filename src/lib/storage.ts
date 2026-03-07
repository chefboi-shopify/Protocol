import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

function getR2Client(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) return null;

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function uploadVideo(
  userId: string,
  file: File
): Promise<string> {
  const filename = `candids/${userId}-${Date.now()}.webm`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Priority 1: Cloudflare R2 (zero egress)
  const r2 = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME || "protocol-videos";
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (r2 && publicUrl) {
    await r2.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: filename,
        Body: buffer,
        ContentType: "video/webm",
      })
    );
    return `${publicUrl.replace(/\/$/, "")}/${filename}`;
  }

  // Priority 2: Vercel Blob
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (blobToken) {
    const blob = await put(filename, file, { access: "public", token: blobToken });
    return blob.url;
  }

  // Priority 3: Local filesystem
  const uploadsDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const localName = `${userId}-${Date.now()}.webm`;
  await writeFile(join(uploadsDir, localName), buffer);
  return `/uploads/${localName}`;
}
