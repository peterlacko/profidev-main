"use client"

import { useEffect } from "react"
import { useLocale } from "next-intl"
import { useRouter, usePathname } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"

const STORAGE_KEY = "preferred-locale"
const COOKIE_NAME = "NEXT_LOCALE"

const detectBrowserLocale = (): Locale => {
  // Get browser languages (e.g., ["sk", "en-US", "en"])
  const browserLangs = navigator.languages || [navigator.language]

  // Check if any browser language starts with sk or cs
  const prefersSlovak = browserLangs.some(lang =>
    lang.startsWith("sk") || lang.startsWith("cs")
  )

  return prefersSlovak ? "sk" : "en"
}

const setCookie = (locale: Locale) => {
  // Set cookie with 1 year expiry
  document.cookie = `${COOKIE_NAME}=${locale};path=/;max-age=31536000;SameSite=Lax`
}

export const LocaleDetector = () => {
  const currentLocale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const savedLocale = localStorage.getItem(STORAGE_KEY) as Locale | null

    if (savedLocale) {
      // User has a saved preference
      setCookie(savedLocale)
      if (savedLocale !== currentLocale) {
        router.replace(pathname, { locale: savedLocale })
      }
    } else {
      // First visit - detect browser language
      const detectedLocale = detectBrowserLocale()
      localStorage.setItem(STORAGE_KEY, detectedLocale)
      setCookie(detectedLocale)

      if (detectedLocale !== currentLocale) {
        router.replace(pathname, { locale: detectedLocale })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Run once on mount only
  }, [])

  return null // Invisible component
}
