import { NextResponse } from "next/server"
import { listMobilePhotos } from "@/lib/mobile-photos"

export async function GET() {
  try {
    const photos = await listMobilePhotos()
    return NextResponse.json({ photos }, { status: 200 })
  } catch (error) {
    console.error("Mobile photos listing error:", error)
    return NextResponse.json(
      { error: "Failed to list mobile photos" },
      { status: 500 }
    )
  }
}
