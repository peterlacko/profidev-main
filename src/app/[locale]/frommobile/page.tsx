import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import type { PhotoWithTrip } from "@/types"
import { PhotoGrid } from "@/components/photos/photo-grid"
import { listMobilePhotos } from "@/lib/mobile-photos"

type MobileGroup = {
  country: string
  trip?: string
  photos: PhotoWithTrip[]
}

const toPhotoWithTrip = (input: {
  id: string
  filename: string
  country: string
  trip?: string
  caption?: string
  uploadedAt: string
  src: string
}): PhotoWithTrip => {
  return {
    filename: input.filename,
    caption: input.caption || input.filename,
    categories: [],
    tripId: input.id,
    tripTitle: input.trip || "General",
    country: input.country,
    date: input.uploadedAt.slice(0, 10),
    src: input.src,
  }
}

const groupPhotos = (photos: PhotoWithTrip[]): MobileGroup[] => {
  const groups = new Map<string, MobileGroup>()

  for (const photo of photos) {
    const key = `${photo.country}::${photo.tripTitle}`
    if (!groups.has(key)) {
      groups.set(key, {
        country: photo.country,
        trip: photo.tripTitle === "General" ? undefined : photo.tripTitle,
        photos: [],
      })
    }
    groups.get(key)?.photos.push(photo)
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (a.country !== b.country) return a.country.localeCompare(b.country)
    return (a.trip ?? "").localeCompare(b.trip ?? "")
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "fromMobile" })

  return {
    title: t("title"),
    description: t("description"),
  }
}

export default async function FromMobilePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations("fromMobile")
  const mobilePhotos = await listMobilePhotos()
  const photoCards = mobilePhotos.map((photo) => toPhotoWithTrip(photo))
  const groups = groupPhotos(photoCards)

  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
          <p className="mt-3 text-muted-foreground">{t("description")}</p>
        </div>

        {groups.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          <div className="space-y-12">
            {groups.map((group) => (
              <section key={`${group.country}-${group.trip ?? "general"}`} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">{group.country}</h2>
                  {group.trip && (
                    <p className="text-sm text-muted-foreground">
                      {t("tripLabel")}: {group.trip}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {t("photosCount", { count: group.photos.length })}
                  </p>
                </div>
                <PhotoGrid photos={group.photos} columns={3} />
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
