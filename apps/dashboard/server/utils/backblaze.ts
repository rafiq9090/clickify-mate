// server/utils/backblaze.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'

const B2_KEY_ID = process.env.B2_KEY_ID || '00582640740723d0000000002'
const B2_APPLICATION_KEY = process.env.B2_APPLICATION_KEY || 'K005JA/ABftkByPHc3Ee8vOJJQQtZ/o'
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || 'agent-chat-store'
const B2_REGION = process.env.B2_REGION || 'us-east-005'
const B2_ENDPOINT = process.env.B2_ENDPOINT || `https://s3.${B2_REGION}.backblazeb2.com`

let s3Client: S3Client | null = null

export const getB2Client = () => {
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: process.env.B2_ENDPOINT || B2_ENDPOINT,
      region: process.env.B2_REGION || B2_REGION,
      credentials: {
        accessKeyId: process.env.B2_KEY_ID || B2_KEY_ID,
        secretAccessKey: process.env.B2_APPLICATION_KEY || B2_APPLICATION_KEY
      }
    })
  }
  return s3Client
}

export interface UploadResult {
  url: string
  proxyUrl: string
  key: string
  bucket: string
  size: number
  contentType: string
}

/**
 * Uploads a buffer directly to Backblaze B2 bucket
 */
export async function uploadToBackblaze(
  fileBuffer: Buffer | Uint8Array,
  fileName: string,
  contentType: string = 'image/jpeg',
  folder: string = 'products'
): Promise<UploadResult> {
  const client = getB2Client()
  
  // Clean filename and create unique storage path
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const key = `${folder}/${Date.now()}_${sanitizedName}`
  const bucket = process.env.B2_BUCKET_NAME || B2_BUCKET_NAME
  const region = process.env.B2_REGION || B2_REGION

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType
  })

  await client.send(command)

  // Direct S3 URL
  const url = `https://${bucket}.s3.${region}.backblazeb2.com/${key}`
  // Local Proxy URL (works even if bucket is set to Private!)
  const proxyUrl = `/api/media/${key}`

  return {
    url,
    proxyUrl,
    key,
    bucket,
    size: fileBuffer.length,
    contentType
  }
}

/**
 * Fetch a file stream from Backblaze B2 (supports private buckets)
 */
export async function getFileFromBackblaze(key: string) {
  const client = getB2Client()
  const bucket = process.env.B2_BUCKET_NAME || B2_BUCKET_NAME
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key
  })
  return await client.send(command)
}
