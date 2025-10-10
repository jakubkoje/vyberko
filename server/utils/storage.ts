import { createStorage } from 'unstorage'
import s3Driver from 'unstorage/drivers/s3'

export function useS3Storage() {
  const config = useRuntimeConfig()

  const storage = createStorage({
    driver: s3Driver({
      endpoint: config.minioEndpoint,
      accessKeyId: config.minioAccessKey,
      secretAccessKey: config.minioSecretKey,
      bucket: config.minioBucket,
      region: 'eu-west-1',
    }),
  })

  return storage
}

export async function uploadFile(key: string, file: Buffer | Blob, contentType?: string) {
  const storage = useS3Storage()
  const config = useRuntimeConfig()

  // Store the file
  await storage.setItemRaw(key, file)

  // Generate the public URL
  const url = `${config.minioEndpoint}/${config.minioBucket}/${key}`

  return { url, key }
}

export async function getFile(key: string) {
  const storage = useS3Storage()
  return await storage.getItemRaw(key)
}

export async function deleteFile(key: string) {
  const storage = useS3Storage()
  return await storage.removeItem(key)
}

export async function generatePresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const config = useRuntimeConfig()

  // For MinIO/S3, we'll construct a temporary URL
  // In production, you might want to use proper presigned URLs with AWS SDK
  const url = `${config.minioEndpoint}/${config.minioBucket}/${key}`

  return url
}
