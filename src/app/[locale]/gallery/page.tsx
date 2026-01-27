import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { GalleryContent } from "./gallery-content"
import { getAllPhotosWithTrip, getAllCountries, getAllCategories, getRegionsByCountry } from "@/lib/trips"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "gallery" })

  return {
    title: t("title"),
    description: t("description"),
  }
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations("gallery")
  const photos = getAllPhotosWithTrip(locale as Locale)
  const countries = getAllCountries()
  const categories = getAllCategories()
  const regionsByCountry = getRegionsByCountry()

  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("description")}
          </p>
        </div>

        {/* Gallery with filters */}
        <GalleryContent
          initialPhotos={photos}
          countries={countries}
          categories={categories}
          regionsByCountry={regionsByCountry}
        />
      </div>
    </div>
  )
}
