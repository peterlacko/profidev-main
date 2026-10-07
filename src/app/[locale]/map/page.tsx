import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { WorldMap } from "@/components/map/WorldMap"
import { getAllTrips } from "@/lib/trips"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "map" })

  return {
    title: t("title"),
    description: t("description"),
  }
}

export default async function MapPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations("map")
  const countryPhotoCounts = getAllTrips().reduce<Record<string, number>>((acc, trip) => {
    acc[trip.country] = (acc[trip.country] ?? 0) + trip.photos.length
    return acc
  }, {})

  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-4 text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <WorldMap countryPhotoCounts={countryPhotoCounts} />
      </div>
    </div>
  )
}
