"use client"

import { useEffect } from "react"
import { useLocale } from "next-intl"
import { useRouter, usePathname } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"

const STORAGE_KEY = "preferred-locale"
const COOKIE_NAME = "NEXT_LOCALE"

const isBot = (): boolean => {
  const ua = navigator.userAgent.toLowerCase()
  return /googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|embedly|quora|pinterest|redditbot|applebot/i.test(ua)
}

const detectBrowserLocale = (): Locale => {
  const browserLangs = navigator.languages || [navigator.language]
  const prefersSlovak = browserLangs.some(lang =>
    lang.startsWith("sk") || lang.startsWith("cs")
  )
  return prefersSlovak ? "sk" : "en"
}

const setCookie = (locale: Locale) => {
  document.cookie = `${COOKIE_NAME}=${locale};path=/;max-age=31536000;SameSite=Lax`
}

export const LocaleDetector = () => {
  const currentLocale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Skip redirect for search engine bots - let them index canonical URLs
    if (isBot()) return

    const savedLocale = localStorage.getItem(STORAGE_KEY) as Locale | null

    if (savedLocale) {
      setCookie(savedLocale)
      if (savedLocale !== currentLocale) {
        router.replace(pathname, { locale: savedLocale })
      }
    } else {
      const detectedLocale = detectBrowserLocale()
      localStorage.setItem(STORAGE_KEY, detectedLocale)
      setCookie(detectedLocale)

      if (detectedLocale !== currentLocale) {
        router.replace(pathname, { locale: detectedLocale })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
