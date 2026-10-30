import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { redirect } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"

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
  redirect({ href: "/gallery?view=map", locale: locale as Locale })
}
