import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { getTripById, getPhotosByTripId, getAllTrips } from "@/lib/trips"
import { PhotoGrid } from "@/components/photos/photo-grid"
import type { Locale } from "@/i18n/routing"

const R2_URL = process.env.NEXT_PUBLIC_R2_URL || ""

export async function generateStaticParams() {
  const trips = getAllTrips()
  return trips.map(trip => ({ tripId: trip.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; tripId: string }>
}): Promise<Metadata> {
  const { locale, tripId } = await params
  const trip = getTripById(tripId)

  if (!trip) return { title: "Trip Not Found" }

  const title = trip.title[locale as Locale] || trip.title.en
  const tCountries = await getTranslations({ locale, namespace: "countries" })
  const description = `${tCountries(trip.country)} travel photography - ${trip.photos.length} photos`

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/gallery/${tripId}`,
      languages: {
        en: `/en/gallery/${tripId}`,
        sk: `/sk/gallery/${tripId}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "article",
      images: trip.photos[0] && R2_URL ? [
        {
          url: `${R2_URL}/${tripId}/${trip.photos[0].filename}`,
          width: 1200,
          height: 630,
        },
      ] : undefined,
    },
  }
}

export default async function TripPage({
  params,
}: {
  params: Promise<{ locale: string; tripId: string }>
}) {
  const { locale, tripId } = await params
  setRequestLocale(locale)

  const trip = getTripById(tripId)
  if (!trip) notFound()

  const t = await getTranslations("gallery")
  const tCountries = await getTranslations("countries")
  const tRegions = await getTranslations("regions")
  const photos = getPhotosByTripId(locale as Locale, tripId)
  const title = trip.title[locale as Locale] || trip.title.en

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: title,
    description: `Travel photography from ${trip.country}`,
    numberOfItems: photos.length,
    image: photos.slice(0, 5).map(p => p.src),
  }

  return (
    <div className="py-12 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className="container mx-auto px-4">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {tCountries(trip.country)}{trip.region ? ` · ${tRegions(trip.region)}` : ""} · {photos.length} {t("photos", { count: photos.length }).replace(/\d+ /, "")}
          </p>
        </div>

        <PhotoGrid photos={photos} columns={3} />
      </div>
    </div>
  )
}
