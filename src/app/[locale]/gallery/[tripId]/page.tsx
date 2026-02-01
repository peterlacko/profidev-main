import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { getTripById, getPhotosByTripId, getAllTrips } from "@/lib/trips"
import { PhotoGrid } from "@/components/photos/photo-grid"
import type { Locale } from "@/i18n/routing"

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
  return { title }
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
  const photos = getPhotosByTripId(locale as Locale, tripId)
  const title = trip.title[locale as Locale] || trip.title.en

  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {trip.country}{trip.region ? ` · ${trip.region}` : ""} · {photos.length} {t("photos", { count: photos.length }).replace(/\d+ /, "")}
          </p>
        </div>

        <PhotoGrid photos={photos} columns={3} />
      </div>
    </div>
  )
}
