"use client"

import { useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { ChevronDown, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter, usePathname } from "@/i18n/navigation"
import type { PhotoWithTrip, PhotoCategory, Trip } from "@/types"
import { filterPhotos, getTripCoverSrc } from "@/lib/trips"
import { PhotoGrid } from "@/components/photos/photo-grid"
import { TripCard } from "@/components/photos/trip-card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

interface GalleryContentProps {
  initialPhotos: PhotoWithTrip[]
  countries: string[]
  categories: PhotoCategory[]
  regionsByCountry: Record<string, string[]>
  trips: Trip[]
  locale: string
}

export function GalleryContent({
  initialPhotos,
  countries,
  categories,
  regionsByCountry,
  trips,
  locale,
}: GalleryContentProps) {
  const t = useTranslations("gallery")
  const tCategories = useTranslations("categories")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const viewMode = searchParams.get("view") === "trips" ? "trips" : "filters"
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>()
  const [selectedRegion, setSelectedRegion] = useState<string | undefined>()
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory | undefined>()
  const [sortBy, setSortBy] = useState<"date" | "country">("date")
  const [showAllFilters, setShowAllFilters] = useState(false)

  const availableRegions = useMemo(() => {
    if (!selectedCountry) return []
    return regionsByCountry[selectedCountry] || []
  }, [selectedCountry, regionsByCountry])

  const showRegionFilter = selectedCountry && availableRegions.length > 0

  const handleCountryChange = (country: string | undefined) => {
    setSelectedCountry(country)
    setSelectedRegion(undefined)
  }

  const filteredPhotos = useMemo(() => {
    return filterPhotos(initialPhotos, {
      country: selectedCountry,
      region: selectedRegion,
      category: selectedCategory,
      sortBy,
    })
  }, [initialPhotos, selectedCountry, selectedRegion, selectedCategory, sortBy])

  const hasActiveFilters = selectedCountry || selectedRegion || selectedCategory

  const clearFilters = () => {
    setSelectedCountry(undefined)
    setSelectedRegion(undefined)
    setSelectedCategory(undefined)
  }

  const handleViewModeChange = (mode: "filters" | "trips") => {
    const params = new URLSearchParams(searchParams.toString())
    if (mode === "trips") {
      params.set("view", "trips")
    } else {
      params.delete("view")
    }
    const queryString = params.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }

  return (
    <div>
      {/* View Mode Toggle */}
      <div className="mb-4 flex gap-2">
        <Button
          variant={viewMode === "filters" ? "default" : "outline"}
          size="sm"
          onClick={() => handleViewModeChange("filters")}
        >
          {t("filterView")}
        </Button>
        <Button
          variant={viewMode === "trips" ? "default" : "outline"}
          size="sm"
          onClick={() => handleViewModeChange("trips")}
        >
          {t("tripView")}
        </Button>
      </div>

      {viewMode === "filters" ? (
        <>
          {/* Filters */}
          <div className="mb-8 space-y-4 rounded-lg border bg-card p-4">
            {/* Country Filter - Always visible */}
            <div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={!selectedCountry ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCountryChange(undefined)}
                >
                  {t("all")}
                </Button>
                {countries.map((country) => (
                  <Button
                    key={country}
                    variant={selectedCountry === country ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCountryChange(country)}
                  >
                    {country}
                  </Button>
                ))}
              </div>
            </div>

            {/* Expandable Filters */}
            <Collapsible open={showAllFilters} onOpenChange={setShowAllFilters}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-center gap-2">
                  {showAllFilters ? t("showLessFilters") : t("showAllFilters")}
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    showAllFilters && "rotate-180"
                  )} />
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-4 pt-4">
                {/* Region Filter - only show when country selected and has regions */}
                {showRegionFilter && (
                  <div>
                    <label className="mb-2 block text-sm font-medium">{t("region")}</label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={!selectedRegion ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedRegion(undefined)}
                      >
                        {t("all")}
                      </Button>
                      {availableRegions.map((region) => (
                        <Button
                          key={region}
                          variant={selectedRegion === region ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedRegion(region)}
                        >
                          {region}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

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
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Results count */}
          <div className="mb-6 flex items-center justify-between">
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
              <p className="text-muted-foreground">{t("noPhotos")}</p>
              <Button variant="link" onClick={clearFilters} className="mt-2">
                {t("clearFilters")}
              </Button>
            </div>
          )}
        </>
      ) : (
        /* Trips Grid */
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map(trip => (
            <TripCard
              key={trip.id}
              trip={trip}
              coverSrc={trip.photos[0] ? getTripCoverSrc(trip.id, trip.photos[0].filename) : ""}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  )
}
