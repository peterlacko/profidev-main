import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { UploadForm } from "./upload-form"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "mobileUpload" })

  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  }
}

export default async function MobileUploadPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations("mobileUpload")

  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
          <p className="mt-3 text-muted-foreground">{t("description")}</p>
        </div>
        <div className="rounded-lg border bg-card p-6 sm:p-8">
          <UploadForm />
        </div>
      </div>
    </div>
  )
}
