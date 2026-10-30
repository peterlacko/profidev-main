import { NextResponse } from "next/server"
import {
  deleteMobileTrip,
  isValidUploadToken,
  listMobileTripSummaries,
} from "@/lib/mobile-photos"

export async function GET(request: Request) {
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
    const trips = await listMobileTripSummaries()
    return NextResponse.json({ trips }, { status: 200 })
  } catch (error) {
    console.error("Mobile trips listing error:", error)
    return NextResponse.json(
      { error: "Failed to list mobile trips" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
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
    const body = (await request.json()) as { country?: string; trip?: string }
    const country = body.country?.trim() ?? ""
    const trip = body.trip?.trim() ?? ""

    if (!country || !trip) {
      return NextResponse.json(
        { error: "Country and trip are required" },
        { status: 400 }
      )
    }

    const deletedCount = await deleteMobileTrip(country, trip)
    return NextResponse.json({ deletedCount }, { status: 200 })
  } catch (error) {
    console.error("Mobile trip delete error:", error)
    return NextResponse.json(
      { error: "Failed to delete mobile trip" },
      { status: 500 }
    )
  }
}
