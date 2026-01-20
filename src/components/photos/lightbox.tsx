"use client"

import { useEffect, useCallback } from "react"
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
  photos: PhotoWithTrip[];
  currentIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
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

  if (!currentPhoto) return null

  const hasPrevious = currentIndex !== null && currentIndex > 0
  const hasNext = currentIndex !== null && currentIndex < photos.length - 1

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none overflow-hidden"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{currentPhoto.caption}</DialogTitle>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
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
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
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
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
            onClick={goToNext}
          >
            <ChevronRight className="h-8 w-8" />
            <span className="sr-only">{t("next")}</span>
          </Button>
        )}

        {/* Image container */}
        <div className="relative w-full h-[70vh] flex items-center justify-center">
          <Image
            src={currentPhoto.src}
            alt={currentPhoto.caption}
            fill
            className="object-contain"
            sizes="95vw"
            priority
          />
        </div>

        {/* Caption and info */}
        <div className="p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
