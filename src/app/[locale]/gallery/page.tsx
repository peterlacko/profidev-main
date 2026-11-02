import type { Metadata } from "next"
import { Suspense } from "react"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { GalleryContent } from "./gallery-content"
import { getAllPhotosWithTrip, getAllCountries, getAllTrips } from "@/lib/trips"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "gallery" })

  return {
    title: t("title")
  }
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const photos = getAllPhotosWithTrip(locale as Locale)
  const countries = getAllCountries()
  const trips = getAllTrips().sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateB.getTime() - dateA.getTime()
  })

  return (
    <div className="py-4 md:py-6">
      <div className="container mx-auto px-4">
        {/* Gallery with filters */}
        <Suspense fallback={<div className="animate-pulse h-96 bg-muted rounded-lg" />}>
          <GalleryContent
            initialPhotos={photos}
            countries={countries}
            trips={trips}
            locale={locale}
          />
        </Suspense>
      </div>
    </div>
  )
}
