import { NextResponse } from "next/server"
import sharp from "sharp"
import {
  getMobileUploadSettings,
  isR2Configured,
  isValidUploadToken,
  uploadMobilePhoto,
} from "@/lib/mobile-photos"

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
])
const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024

const getStringValue = (value: FormDataEntryValue | null): string => {
  if (typeof value !== "string") return ""
  return value.trim()
}

export async function POST(request: Request) {
  if (!process.env.MOBILE_UPLOAD_TOKEN) {
    return NextResponse.json(
      { error: "MOBILE_UPLOAD_TOKEN is not configured" },
      { status: 500 }
    )
  }

  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "R2 environment variables are not fully configured" },
      { status: 500 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const token =
      request.headers.get("x-mobile-upload-token") ?? getStringValue(formData.get("token"))

    if (!isValidUploadToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 30 MB limit" },
        { status: 400 }
      )
    }

    if (!ACCEPTED_IMAGE_TYPES.has(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      )
    }

    const country = getStringValue(formData.get("country"))
    if (!country) {
      return NextResponse.json(
        { error: "Country is required" },
        { status: 400 }
      )
    }

    const trip = getStringValue(formData.get("trip")) || undefined
    const caption = getStringValue(formData.get("caption")) || undefined

    const inputBuffer = Buffer.from(await file.arrayBuffer())
    const settings = getMobileUploadSettings()
    const { data: outputBuffer, info } = await sharp(inputBuffer)
      .rotate()
      .resize({
        width: settings.maxWidth,
        height: settings.maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        quality: settings.jpegQuality,
        mozjpeg: true,
      })
      .toBuffer({ resolveWithObject: true })

    const uploaded = await uploadMobilePhoto({
      buffer: outputBuffer,
      country,
      trip,
      caption,
      width: info.width,
      height: info.height,
      originalFilename: file.name,
    })

    return NextResponse.json(uploaded, { status: 201 })
  } catch (error) {
    console.error("Mobile upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload and process image" },
      { status: 500 }
    )
  }
}
