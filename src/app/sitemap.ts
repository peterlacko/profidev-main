import type { MetadataRoute } from "next"
import { routing } from "@/i18n/routing"
import { getAllTrips } from "@/lib/trips"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://profidev.sk"

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = routing.locales
  const trips = getAllTrips()

  const staticPages = ["", "/gallery", "/about", "/contact"]

  const staticEntries = staticPages.flatMap((page) => {
    const alternates: Record<string, string> = {}
    locales.forEach((locale) => {
      alternates[locale] = `${SITE_URL}/${locale}${page}`
    })

    const changeFrequency: "weekly" | "monthly" = page === "" ? "weekly" : "monthly"

    return locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency,
      priority: page === "" ? 1 : 0.8,
      alternates: { languages: alternates },
    }))
  })

  const tripEntries = trips.flatMap((trip) => {
    const alternates: Record<string, string> = {}
    locales.forEach((locale) => {
      alternates[locale] = `${SITE_URL}/${locale}/gallery/${trip.id}`
    })

    return locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/gallery/${trip.id}`,
      lastModified: new Date(trip.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: { languages: alternates },
    }))
  })

  return [...staticEntries, ...tripEntries]
}
