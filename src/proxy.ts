import { NextRequest, NextResponse } from "next/server"
import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"

const intlMiddleware = createMiddleware(routing)
const blockedImageBotMarkers = [
  "bot",
  "crawler",
  "spider",
  "slurp",
  "headless",
  "curl",
  "wget",
  "python-requests",
  "scrapy",
  "facebookexternalhit",
]

const shouldBlockImageBot = (request: NextRequest): boolean => {
  if (request.nextUrl.pathname !== "/_next/image") return false

  const userAgent = request.headers.get("user-agent")?.toLowerCase().trim() ?? ""
  if (!userAgent) return true

  return blockedImageBotMarkers.some((marker) => userAgent.includes(marker))
}

export default function proxy(request: NextRequest) {
  if (shouldBlockImageBot(request)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ["/_next/image", "/((?!api|_next|_vercel|.*\\..*).*)", "/([\\w-]+)?/gallery/(.+)"]
}
