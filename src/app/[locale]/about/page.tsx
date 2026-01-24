import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import Image from "next/image"
import { AboutContent } from "@/components/about/AboutContent"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "about" })

  return {
    title: t("title"),
    description: t("professional.intro"),
  }
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations("about")

  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-[48rem]">
          {/* Photo floated right */}
          <div className="relative float-right ml-8 mb-6 w-48 md:w-64 aspect-[4/5] overflow-hidden rounded-lg bg-muted">
            <Image
              src="/about-photo.jpg"
              alt="Peter - Software Developer"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Content flows around photo */}
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("greeting")}
          </h1>
          <div className="mt-8">
            <AboutContent />
          </div>
        </div>
      </div>
    </div>
  )
}
