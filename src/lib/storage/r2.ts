import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import sharp from "sharp"

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function uploadToR2(file: File, key: string): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Arquivo muito grande. Máximo 5 MB.")
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Tipo de arquivo não permitido.")
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  const resized = await sharp(buffer)
    .resize(800, 600, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer()

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: resized,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000",
    })
  )

  return `${process.env.R2_PUBLIC_URL}/${key}`
}
