"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Menu, X, Code2, Camera, Mountain, type LucideIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "./language-switcher"
import { ThemeToggle } from "./ThemeToggle"

const logoItems: { icon: LucideIcon; label: string }[] = [
  { icon: Code2, label: "build" },
  { icon: Mountain, label: "explore" },
  { icon: Camera, label: "capture" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeLogoIndex, setActiveLogoIndex] = useState(0)
  const [isFading, setIsFading] = useState(false)
  const pathname = usePathname()
  const t = useTranslations("navigation")

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true)
      setTimeout(() => {
        setActiveLogoIndex((prev) => (prev + 1) % logoItems.length)
        setIsFading(false)
      }, 1000)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname.match(/^\/[a-z]{2}\/?$/)
    }
    return pathname.includes(href)
  }

  const navLinks = [
    { href: "/" as const, label: t("home") },
    { href: "/gallery" as const, label: t("gallery") },
    { href: "/about" as const, label: t("about") },
    { href: "/contact" as const, label: t("contact") },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-sm tracking-wide hover:backdrop-brightness-95 px-4 py-2 rounded-md transition-colors"
        >
          {/* Mobile: cycling single icon */}
          <span
            className={cn(
              "flex items-center gap-1 text-muted-foreground/80 transition-opacity duration-600 sm:hidden",
              isFading ? "opacity-0" : "opacity-100"
            )}
          >
            {(() => {
              const ActiveIcon = logoItems[activeLogoIndex].icon
              return <ActiveIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
            })()}
            <span className="font-light">{logoItems[activeLogoIndex].label}</span>
          </span>

          {/* Desktop: full logo */}
          <span className="hidden sm:flex items-center gap-2.5">
            {logoItems.map((item, index) => (
              <span key={item.label} className="flex items-center gap-1">
                {index > 0 && <span className="text-muted-foreground/30 mr-2.5">·</span>}
                <span className="flex items-center gap-1 text-muted-foreground/80">
                  <item.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span className="font-light">{item.label}</span>
                </span>
              </span>
            ))}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          <ul className="flex items-center gap-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                    isActive(link.href) && "font-bold text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        {/* Mobile: Language Switcher + Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? t("closeMenu") : t("openMenu")}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div
        className={cn(
          "absolute left-0 right-0 top-20 border-b bg-background md:hidden",
          mobileMenuOpen ? "block" : "hidden",
        )}
      >
        <ul className="container mx-auto flex flex-col px-4 py-4">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "block py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  isActive(link.href) && "font-bold text-foreground",
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
