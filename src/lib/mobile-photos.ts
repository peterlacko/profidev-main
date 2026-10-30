import { randomUUID, timingSafeEqual } from "node:crypto"
import {
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

export interface MobilePhoto {
  id: string
  filename: string
  country: string
  trip?: string
  caption?: string
  uploadedAt: string
  width: number
  height: number
  src: string
  r2Key: string
}

export interface MobileTripSummary {
  country: string
  trip: string
  photosCount: number
  lastUploadedAt: string
}

const MOBILE_PUBLISHED_PREFIX = "mobile/published"
const MAX_RESIZE_WIDTH = 2560
const MAX_RESIZE_HEIGHT = 1440
const JPEG_QUALITY = 88

let cachedClient: S3Client | undefined

const getRequiredEnv = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const isR2Configured = (): boolean => {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.NEXT_PUBLIC_R2_URL
  )
}

const getR2Client = (): S3Client => {
  if (cachedClient) return cachedClient

  const accountId = getRequiredEnv("R2_ACCOUNT_ID")
  const accessKeyId = getRequiredEnv("R2_ACCESS_KEY_ID")
  const secretAccessKey = getRequiredEnv("R2_SECRET_ACCESS_KEY")

  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })

  return cachedClient
}

const getBucketName = (): string => getRequiredEnv("R2_BUCKET_NAME")

const getR2PublicUrl = (): string => {
  const url = getRequiredEnv("NEXT_PUBLIC_R2_URL")
  return url.endsWith("/") ? url.slice(0, -1) : url
}

const sanitizeSegment = (value: string): string => {
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return "general"

  return trimmed
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

const encodeMetadataValue = (value?: string): string | undefined => {
  if (!value) return undefined
  return encodeURIComponent(value.trim())
}

const decodeMetadataValue = (value?: string): string | undefined => {
  if (!value) return undefined
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const safeNumber = (value: string | undefined, fallback = 0): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const getMobileUploadSettings = () => ({
  maxWidth: MAX_RESIZE_WIDTH,
  maxHeight: MAX_RESIZE_HEIGHT,
  jpegQuality: JPEG_QUALITY,
})

export const isValidUploadToken = (providedToken: string): boolean => {
  const expectedToken = process.env.MOBILE_UPLOAD_TOKEN
  if (!expectedToken) return false
  if (!providedToken) return false

  const expectedBuffer = Buffer.from(expectedToken)
  const providedBuffer = Buffer.from(providedToken)

  if (expectedBuffer.length !== providedBuffer.length) return false
  return timingSafeEqual(expectedBuffer, providedBuffer)
}

const buildObjectKey = (country: string, trip?: string): { id: string; key: string } => {
  const id = `${Date.now()}-${randomUUID().slice(0, 8)}`
  const countrySegment = sanitizeSegment(country)
  const tripSegment = sanitizeSegment(trip ?? "general")
  const key = `${MOBILE_PUBLISHED_PREFIX}/${countrySegment}/${tripSegment}/${id}.jpg`
  return { id, key }
}

export const uploadMobilePhoto = async (input: {
  buffer: Buffer
  country: string
  trip?: string
  caption?: string
  width: number
  height: number
  originalFilename: string
}): Promise<MobilePhoto> => {
  const uploadedAt = new Date().toISOString()
  const { id, key } = buildObjectKey(input.country, input.trip)
  const client = getR2Client()
  const bucket = getBucketName()
  const metadata: Record<string, string> = {
    id,
    country: encodeMetadataValue(input.country) ?? "",
    uploadedat: uploadedAt,
    width: String(input.width),
    height: String(input.height),
    originalfilename: encodeMetadataValue(input.originalFilename) ?? "",
  }

  const encodedTrip = encodeMetadataValue(input.trip)
  if (encodedTrip) {
    metadata.trip = encodedTrip
  }

  const encodedCaption = encodeMetadataValue(input.caption)
  if (encodedCaption) {
    metadata.caption = encodedCaption
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: input.buffer,
      ContentType: "image/jpeg",
      CacheControl: "public, max-age=31536000, immutable",
      Metadata: metadata,
    })
  )

  const filename = key.split("/").pop() ?? `${id}.jpg`
  return {
    id,
    filename,
    country: input.country,
    trip: input.trip,
    caption: input.caption,
    uploadedAt,
    width: input.width,
    height: input.height,
    src: `${getR2PublicUrl()}/${key}`,
    r2Key: key,
  }
}

export const listMobilePhotos = async (): Promise<MobilePhoto[]> => {
  if (!isR2Configured()) return []

  const client = getR2Client()
  const bucket = getBucketName()
  const publicUrl = getR2PublicUrl()

  const keys: string[] = []
  let continuationToken: string | undefined

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: `${MOBILE_PUBLISHED_PREFIX}/`,
        ContinuationToken: continuationToken,
      })
    )

    for (const item of response.Contents ?? []) {
      if (item.Key?.toLowerCase().endsWith(".jpg")) {
        keys.push(item.Key)
      }
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined
  } while (continuationToken)

  const photos = await Promise.all(
    keys.map(async (key) => {
      const head = await client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      )

      const metadata = head.Metadata ?? {}
      const filename = key.split("/").pop() ?? "photo.jpg"
      const uploadedAt = metadata.uploadedat ?? head.LastModified?.toISOString() ?? new Date(0).toISOString()
      const country = decodeMetadataValue(metadata.country) ?? "Unknown"
      const trip = decodeMetadataValue(metadata.trip)
      const caption = decodeMetadataValue(metadata.caption)
      const id = metadata.id ?? key

      return {
        id,
        filename,
        country,
        trip: trip || undefined,
        caption: caption || undefined,
        uploadedAt,
        width: safeNumber(metadata.width),
        height: safeNumber(metadata.height),
        src: `${publicUrl}/${key}`,
        r2Key: key,
      } satisfies MobilePhoto
    })
  )

  return photos.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
}

export const listMobileTripSummaries = async (): Promise<MobileTripSummary[]> => {
  const photos = await listMobilePhotos()
  const grouped = new Map<string, MobileTripSummary>()

  for (const photo of photos) {
    if (!photo.trip) continue

    const key = `${photo.country}::${photo.trip}`
    const existing = grouped.get(key)

    if (existing) {
      existing.photosCount += 1
      if (photo.uploadedAt > existing.lastUploadedAt) {
        existing.lastUploadedAt = photo.uploadedAt
      }
      continue
    }

    grouped.set(key, {
      country: photo.country,
      trip: photo.trip,
      photosCount: 1,
      lastUploadedAt: photo.uploadedAt,
    })
  }

  return Array.from(grouped.values()).sort((a, b) => {
    if (a.lastUploadedAt !== b.lastUploadedAt) {
      return b.lastUploadedAt.localeCompare(a.lastUploadedAt)
    }
    if (a.country !== b.country) return a.country.localeCompare(b.country)
    return a.trip.localeCompare(b.trip)
  })
}

const listObjectKeysByPrefix = async (prefix: string): Promise<string[]> => {
  const client = getR2Client()
  const bucket = getBucketName()
  const keys: string[] = []
  let continuationToken: string | undefined

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    )

    for (const item of response.Contents ?? []) {
      if (item.Key) {
        keys.push(item.Key)
      }
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined
  } while (continuationToken)

  return keys
}

export const deleteMobileTrip = async (country: string, trip: string): Promise<number> => {
  const normalizedTrip = trip.trim()
  if (!normalizedTrip) {
    throw new Error("Trip is required")
  }

  const countrySegment = sanitizeSegment(country)
  const tripSegment = sanitizeSegment(normalizedTrip)
  const prefix = `${MOBILE_PUBLISHED_PREFIX}/${countrySegment}/${tripSegment}/`
  const keys = await listObjectKeysByPrefix(prefix)

  if (keys.length === 0) return 0

  const client = getR2Client()
  const bucket = getBucketName()
  let deleted = 0

  for (let index = 0; index < keys.length; index += 1000) {
    const chunk = keys.slice(index, index + 1000)
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: chunk.map((key) => ({ Key: key })),
          Quiet: true,
        },
      })
    )
    deleted += chunk.length
  }

  return deleted
}
