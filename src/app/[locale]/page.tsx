import { ArrowRight } from "lucide-react"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { getFeaturedPhotos } from "@/lib/trips"
import { PhotoGrid } from "@/components/photos/photo-grid"
import { Button } from "@/components/ui/button"
import type { Locale } from "@/i18n/routing"

export const dynamic = "force-dynamic"

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations("home")
  const featuredPhotos = getFeaturedPhotos(locale as Locale)

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              {t("hero.title")}
              <br />
              <span className="text-muted-foreground">{t("hero.titleHighlight")}</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              {t("hero.description")}
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link href="/gallery">
                  {t("hero.browseGallery")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/about">{t("hero.aboutMe")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Photos Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {t("featured.title")}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {t("featured.description")}
              </p>
            </div>
            <Link
              href="/gallery"
              className="hidden text-sm font-medium hover:underline sm:block"
            >
              {t("featured.viewAll")} &rarr;
            </Link>
          </div>

          <PhotoGrid photos={featuredPhotos} columns={3} />

          <div className="mt-8 text-center sm:hidden">
            <Button asChild variant="outline">
              <Link href="/gallery">{t("featured.viewAll")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("cta.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {t("cta.description")}
          </p>
          <Button asChild className="mt-8" size="lg">
            <Link href="/contact">{t("cta.getInTouch")}</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
