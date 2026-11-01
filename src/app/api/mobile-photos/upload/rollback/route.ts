import { NextResponse } from "next/server"
import {
  deleteMobilePhotosByUploadBatchId,
  isValidUploadToken,
} from "@/lib/mobile-photos"

export async function POST(request: Request) {
  if (!process.env.MOBILE_UPLOAD_TOKEN) {
    return NextResponse.json(
      { error: "MOBILE_UPLOAD_TOKEN is not configured" },
      { status: 500 }
    )
  }

  const token = request.headers.get("x-mobile-upload-token") ?? ""
  if (!isValidUploadToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = (await request.json()) as { uploadBatchId?: string }
    const uploadBatchId = body.uploadBatchId?.trim() ?? ""

    if (!uploadBatchId) {
      return NextResponse.json(
        { error: "uploadBatchId is required" },
        { status: 400 }
      )
    }

    const deletedCount = await deleteMobilePhotosByUploadBatchId(uploadBatchId)
    return NextResponse.json({ deletedCount }, { status: 200 })
  } catch (error) {
    console.error("Mobile upload rollback error:", error)
    return NextResponse.json(
      { error: "Failed to rollback mobile upload" },
      { status: 500 }
    )
  }
}
