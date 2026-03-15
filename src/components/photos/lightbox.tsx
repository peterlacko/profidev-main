"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight, Mail } from "lucide-react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import type { PhotoWithTrip } from "@/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

interface LightboxProps {
  photos: PhotoWithTrip[]
  currentIndex: number | null
  onClose: () => void
  onNavigate: (index: number) => void
}

export function Lightbox({
  photos,
  currentIndex,
  onClose,
  onNavigate,
}: LightboxProps) {
  const t = useTranslations("lightbox")
  const tCategories = useTranslations("categories")

  const isOpen = currentIndex !== null
  const currentPhoto = currentIndex !== null ? photos[currentIndex] : null

  const [overlayVisible, setOverlayVisible] = useState(true)
  const touchStartX = useRef<number | null>(null)

  const goToPrevious = useCallback(() => {
    if (currentIndex !== null && currentIndex > 0) {
      onNavigate(currentIndex - 1)
    }
  }, [currentIndex, onNavigate])

  const goToNext = useCallback(() => {
    if (currentIndex !== null && currentIndex < photos.length - 1) {
      onNavigate(currentIndex + 1)
    }
  }, [currentIndex, photos.length, onNavigate])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case "ArrowLeft":
          goToPrevious()
          break
        case "ArrowRight":
          goToNext()
          break
        case "Escape":
          onClose()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, goToPrevious, goToNext, onClose])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null

    if (Math.abs(deltaX) > 50) {
      e.preventDefault()
      if (deltaX > 0) goToPrevious()
      else goToNext()
    }
  }, [goToPrevious, goToNext])

  if (!currentPhoto) return null

  const hasPrevious = currentIndex !== null && currentIndex > 0
  const hasNext = currentIndex !== null && currentIndex < photos.length - 1

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-screen h-[100dvh] max-w-none sm:max-w-none max-h-none rounded-none p-0 bg-black border-none overflow-hidden lg:w-[66vw] lg:max-w-[66vw] lg:rounded-lg"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{currentPhoto.caption}</DialogTitle>

        {/* Image container — fullscreen */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => setOverlayVisible((v) => !v)}
        >
          <Image
            src={currentPhoto.src}
            alt={currentPhoto.caption}
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 66vw"
            priority
          />
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-4 right-4 z-50 text-white hover:bg-white/20",
            "transition-opacity duration-300",
            !overlayVisible && "opacity-0 pointer-events-none"
          )}
          onClick={onClose}
        >
          <X className="h-6 w-6" />
          <span className="sr-only">{t("close")}</span>
        </Button>

        {/* Navigation buttons */}
        {hasPrevious && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20",
              "transition-opacity duration-300",
              !overlayVisible && "opacity-0 pointer-events-none"
            )}
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-8 w-8" />
            <span className="sr-only">{t("previous")}</span>
          </Button>
        )}

        {hasNext && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20",
              "transition-opacity duration-300",
              !overlayVisible && "opacity-0 pointer-events-none"
            )}
            onClick={goToNext}
          >
            <ChevronRight className="h-8 w-8" />
            <span className="sr-only">{t("next")}</span>
          </Button>
        )}

        {/* Caption and info — overlay */}
        <div
          className={cn(
            "absolute bottom-0 inset-x-0 z-40 p-4 lg:p-6 text-white",
            "bg-gradient-to-t from-black/80 to-transparent pt-16",
            "transition-opacity duration-300",
            !overlayVisible && "opacity-0 pointer-events-none"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">{currentPhoto.caption}</h3>
              <p className="text-sm text-white/70">
                {currentPhoto.tripTitle} &middot; {currentPhoto.country} &middot;{" "}
                {currentPhoto.date}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {currentPhoto.categories.map((category) => (
                  <span
                    key={category}
                    className="px-2 py-0.5 text-xs bg-white/10 rounded-full"
                  >
                    {tCategories(category)}
                  </span>
                ))}
              </div>
            </div>
            <Link
              href={`/contact?photo=${encodeURIComponent(currentPhoto.filename)}`}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium",
                "bg-white text-black rounded-md hover:bg-white/90 transition-colors",
                "shrink-0"
              )}
            >
              <Mail className="h-4 w-4" />
              {t("requestFullRes")}
            </Link>
          </div>

          {/* Counter */}
          <div className="mt-4 text-center text-sm text-white/50">
            {(currentIndex ?? 0) + 1} / {photos.length}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
