import { createStorage } from 'unstorage'
import s3Driver from 'unstorage/drivers/s3'
import { AwsClient } from 'aws4fetch'

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

export function getS3Client() {
  const config = useRuntimeConfig()

  return new AwsClient({
    accessKeyId: config.minioAccessKey,
    secretAccessKey: config.minioSecretKey,
    service: 's3',
  })
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

export async function getFile(key: string): Promise<Response> {
  const config = useRuntimeConfig()
  const s3Client = getS3Client()

  // Construct S3 URL for MinIO
  const url = `${config.minioEndpoint}/${config.minioBucket}/${key}`

  // Make authenticated request to MinIO using aws4fetch
  const response = await s3Client.fetch(url, {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`)
  }

  return response
}

export async function deleteFile(key: string) {
  const storage = useS3Storage()
  return await storage.removeItem(key)
}
