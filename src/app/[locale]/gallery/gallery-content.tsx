"use client"

import { useState, useMemo } from "react"
import { SlidersHorizontal, X } from "lucide-react"
import { useTranslations } from "next-intl"
import type { PhotoWithTrip, PhotoCategory } from "@/types"
import { filterPhotos } from "@/lib/trips"
import { PhotoGrid } from "@/components/photos/photo-grid"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface GalleryContentProps {
  initialPhotos: PhotoWithTrip[];
  countries: string[];
  categories: PhotoCategory[];
}

export function GalleryContent({
  initialPhotos,
  countries,
  categories,
}: GalleryContentProps) {
  const t = useTranslations("gallery")
  const tCategories = useTranslations("categories")

  const [selectedCountry, setSelectedCountry] = useState<string | undefined>()
  const [selectedCategory, setSelectedCategory] = useState<
    PhotoCategory | undefined
  >()
  const [sortBy, setSortBy] = useState<"date" | "country">("date")
  const [showFilters, setShowFilters] = useState(false)

  const filteredPhotos = useMemo(() => {
    return filterPhotos(initialPhotos, {
      country: selectedCountry,
      category: selectedCategory,
      sortBy,
    })
  }, [initialPhotos, selectedCountry, selectedCategory, sortBy])

  const hasActiveFilters = selectedCountry || selectedCategory

  const clearFilters = () => {
    setSelectedCountry(undefined)
    setSelectedCategory(undefined)
  }

  return (
    <div>
      {/* Filter Toggle for Mobile */}
      <div className="mb-6 flex items-center justify-between md:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t("filters")}
          {hasActiveFilters && (
            <span className="ml-1 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
              {(selectedCountry ? 1 : 0) + (selectedCategory ? 1 : 0)}
            </span>
          )}
        </Button>
        <span className="text-sm text-muted-foreground">
          {t("photos", { count: filteredPhotos.length })}
        </span>
      </div>

      {/* Filters */}
      <div
        className={cn(
          "mb-8 space-y-4 rounded-lg border bg-card p-4 md:block",
          showFilters ? "block" : "hidden"
        )}
      >
        {/* Country Filter */}
        <div>
          <label className="mb-2 block text-sm font-medium">{t("country")}</label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={!selectedCountry ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCountry(undefined)}
            >
              {t("all")}
            </Button>
            {countries.map((country) => (
              <Button
                key={country}
                variant={selectedCountry === country ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCountry(country)}
              >
                {country}
              </Button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label className="mb-2 block text-sm font-medium">{t("category")}</label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={!selectedCategory ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(undefined)}
            >
              {t("all")}
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {tCategories(category)}
              </Button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div>
          <label className="mb-2 block text-sm font-medium">{t("sortBy")}</label>
          <div className="flex gap-2">
            <Button
              variant={sortBy === "date" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("date")}
            >
              {t("date")}
            </Button>
            <Button
              variant={sortBy === "country" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("country")}
            >
              {t("country")}
            </Button>
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            {t("clearFilters")}
          </Button>
        )}
      </div>

      {/* Results count (desktop) */}
      <div className="mb-6 hidden items-center justify-between md:flex">
        <span className="text-sm text-muted-foreground">
          {hasActiveFilters
            ? t("photosFiltered", { count: filteredPhotos.length })
            : t("photos", { count: filteredPhotos.length })}
        </span>
      </div>

      {/* Photo Grid */}
      {filteredPhotos.length > 0 ? (
        <PhotoGrid photos={filteredPhotos} columns={3} />
      ) : (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">
            {t("noPhotos")}
          </p>
          <Button variant="link" onClick={clearFilters} className="mt-2">
            {t("clearFilters")}
          </Button>
        </div>
      )}
    </div>
  )
}
