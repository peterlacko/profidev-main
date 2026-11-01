"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ChevronDown, X } from "lucide-react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { useRouter, usePathname } from "@/i18n/navigation"
import type { PhotoWithTrip, Trip } from "@/types"
import { filterPhotos, getTripCoverSrc } from "@/lib/trips"
import { PhotoGrid } from "@/components/photos/photo-grid"
import { TripCard } from "@/components/photos/trip-card"
import { WorldMap } from "@/components/map/WorldMap"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface GalleryContentProps {
  initialPhotos: PhotoWithTrip[]
  countries: string[]
  regionsByCountry: Record<string, string[]>
  trips: Trip[]
  locale: string
}

type MobileApiPhoto = {
  id: string
  filename: string
  country: string
  trip?: string
  caption?: string
  uploadedAt: string
  src: string
}

type MobileTripGroup = {
  key: string
  tripTitle: string
  country: string
  count: number
  coverSrc: string
}

const resolveCountriesFromQuery = (queryCountries: string[], countries: string[]): string[] => {
  if (queryCountries.length === 0) return []

  const normalized = new Set(
    queryCountries
      .map((country) => country.toLowerCase())
      .filter(Boolean)
  )

  return countries.filter((country) => normalized.has(country.toLowerCase()))
}

const toMobilePhotoWithTrip = (photo: MobileApiPhoto): PhotoWithTrip => ({
  filename: photo.filename,
  categories: [],
  caption: photo.caption || photo.filename,
  isMobile: true,
  tripId: photo.id,
  tripTitle: photo.trip || "Mobile",
  country: photo.country,
  date: photo.uploadedAt.slice(0, 10),
  src: photo.src,
})

export function GalleryContent({
  initialPhotos,
  countries,
  regionsByCountry,
  trips,
  locale,
}: GalleryContentProps) {
  const t = useTranslations("gallery")
  const tMap = useTranslations("map")
  const tCountries = useTranslations("countries")
  const tRegions = useTranslations("regions")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const resolveViewMode = (): "filters" | "trips" | "map" => {
    const raw = searchParams.get("view")
    if (raw === "trips" || raw === "map") return raw
    return "filters"
  }
  const viewMode = resolveViewMode()
  const [selectedCountries, setSelectedCountries] = useState<string[]>(() =>
    resolveCountriesFromQuery(searchParams.getAll("country"), countries)
  )
  const [selectedRegion, setSelectedRegion] = useState<string | undefined>()
  const [selectedMobileTrip, setSelectedMobileTrip] = useState<string | undefined>()
  const [sortBy, setSortBy] = useState<"date" | "country">("date")
  const [countriesDropdownOpen, setCountriesDropdownOpen] = useState(false)
  const countryDropdownRef = useRef<HTMLDivElement | null>(null)
  const [includeMobilePhotos, setIncludeMobilePhotos] = useState(false)
  const [mobilePhotos, setMobilePhotos] = useState<PhotoWithTrip[]>([])
  const [mobilePhotosLoaded, setMobilePhotosLoaded] = useState(false)
  const [mobilePhotosLoading, setMobilePhotosLoading] = useState(false)
  const [mobilePhotosError, setMobilePhotosError] = useState<string | null>(null)

  useEffect(() => {
    if (!includeMobilePhotos || mobilePhotosLoaded || mobilePhotosLoading) return

    const loadMobilePhotos = async () => {
      setMobilePhotosLoading(true)
      setMobilePhotosError(null)

      try {
        const response = await fetch("/api/mobile-photos")
        if (!response.ok) {
          throw new Error(t("mobilePhotosLoadError"))
        }

        const data = (await response.json()) as { photos?: MobileApiPhoto[] }
        const photos = (data.photos ?? []).map((photo) => toMobilePhotoWithTrip(photo))
        setMobilePhotos(photos)
        setMobilePhotosLoaded(true)
      } catch (error) {
        setMobilePhotosError(error instanceof Error ? error.message : t("mobilePhotosLoadError"))
      } finally {
        setMobilePhotosLoading(false)
      }
    }

    void loadMobilePhotos()
  }, [includeMobilePhotos, mobilePhotosLoaded, mobilePhotosLoading, t])

  useEffect(() => {
    if (!countriesDropdownOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return

      if (countryDropdownRef.current && !countryDropdownRef.current.contains(target)) {
        setCountriesDropdownOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [countriesDropdownOpen])

  const allPhotos = useMemo(
    () => (includeMobilePhotos ? [...initialPhotos, ...mobilePhotos] : initialPhotos),
    [includeMobilePhotos, initialPhotos, mobilePhotos]
  )

  const availableCountries = useMemo(() => {
    const countrySet = new Set(allPhotos.map((photo) => photo.country))
    return Array.from(countrySet).sort()
  }, [allPhotos])

  const availableRegions = useMemo(() => {
    if (selectedCountries.length === 0) return []

    const regions = new Set<string>()
    selectedCountries.forEach((country) => {
      const countryRegions = regionsByCountry[country] || []
      countryRegions.forEach((region) => regions.add(region))
    })

    return Array.from(regions).sort()
  }, [selectedCountries, regionsByCountry])

  const showRegionFilter = selectedCountries.length > 0 && availableRegions.length > 0

  const mobileTripGroups = useMemo(() => {
    if (!includeMobilePhotos) return []

    const groups = new Map<string, MobileTripGroup>()
    for (const photo of mobilePhotos) {
      const tripTitle = photo.tripTitle.trim()
      if (!tripTitle || tripTitle === "Mobile") continue

      const key = `${tripTitle}::${photo.country}`
      const existing = groups.get(key)
      if (existing) {
        existing.count += 1
      } else {
        groups.set(key, {
          key,
          tripTitle,
          country: photo.country,
          count: 1,
          coverSrc: photo.src,
        })
      }
    }

    return Array.from(groups.values()).sort((a, b) => {
      if (a.tripTitle !== b.tripTitle) return a.tripTitle.localeCompare(b.tripTitle)
      return a.country.localeCompare(b.country)
    })
  }, [includeMobilePhotos, mobilePhotos])

  const countryPhotoCounts = useMemo(() => {
    return allPhotos.reduce<Record<string, number>>((acc, photo) => {
      acc[photo.country] = (acc[photo.country] ?? 0) + 1
      return acc
    }, {})
  }, [allPhotos])

  const updateCountryParam = (countries: string[]) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("country")

    countries.forEach((country) => {
      params.append("country", country.toLowerCase())
    })

    const queryString = params.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }

  const handleCountryToggle = (country: string) => {
    const nextCountries = selectedCountries.includes(country)
      ? selectedCountries.filter((selectedCountry) => selectedCountry !== country)
      : [...selectedCountries, country]

    setSelectedCountries(nextCountries)
    setSelectedRegion(undefined)
    updateCountryParam(nextCountries)
  }

  const filteredPhotos = useMemo(() => {
    let result = filterPhotos(allPhotos, {
      countries: selectedCountries,
      region: selectedRegion,
      sortBy,
    })

    if (selectedMobileTrip) {
      result = result.filter((photo) => photo.tripTitle === selectedMobileTrip)
    }

    return result
  }, [allPhotos, selectedCountries, selectedRegion, sortBy, selectedMobileTrip])

  const hasActiveFilters = selectedCountries.length > 0 || selectedRegion || selectedMobileTrip

  const clearFilters = () => {
    setSelectedCountries([])
    setSelectedRegion(undefined)
    setSelectedMobileTrip(undefined)
    updateCountryParam([])
  }

  const handleViewModeChange = (mode: "filters" | "trips" | "map") => {
    const params = new URLSearchParams(searchParams.toString())
    if (mode === "filters") {
      params.delete("view")
    } else {
      params.set("view", mode)
    }
    const queryString = params.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }

  const handleMobileTripOpen = (tripTitle: string) => {
    setIncludeMobilePhotos(true)
    setSelectedMobileTrip(tripTitle)
    setSelectedCountries([])
    setSelectedRegion(undefined)
    updateCountryParam([])
    handleViewModeChange("filters")
  }

  const countryFilterLabel =
    selectedCountries.length === 0
      ? t("allCountries")
      : selectedCountries.length === 1
        ? tCountries(selectedCountries[0])
        : `${selectedCountries.length} ${t("countriesSelected")}`

  return (
    <div>
      {/* View Mode Toggle */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex w-full gap-2 rounded-md bg-muted p-1">
          <button
            type="button"
            onClick={() => handleViewModeChange("filters")}
            className={cn(
              "flex-1 cursor-pointer rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
              viewMode === "filters"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            {t("filterView")}
          </button>
          <button
            type="button"
            onClick={() => handleViewModeChange("trips")}
            className={cn(
              "flex-1 cursor-pointer rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
              viewMode === "trips"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            {t("tripView")}
          </button>
          <button
            type="button"
            onClick={() => handleViewModeChange("map")}
            className={cn(
              "flex-1 cursor-pointer rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
              viewMode === "map"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            {t("mapView")}
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 sm:ml-auto sm:w-auto sm:min-w-[220px]">
          <span className="text-sm text-muted-foreground">{t("photosFromMobile")}</span>
          <button
            type="button"
            role="switch"
            aria-checked={includeMobilePhotos}
            onClick={() =>
              setIncludeMobilePhotos((prev) => {
                if (prev) {
                  setSelectedMobileTrip(undefined)
                }
                return !prev
              })
            }
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full border transition-colors",
              includeMobilePhotos ? "border-primary bg-primary" : "border-border bg-muted"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-background transition-transform",
                includeMobilePhotos ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>
      </div>
      {mobilePhotosLoading && (
        <p className="mb-4 text-sm text-muted-foreground">{t("loadingMobilePhotos")}</p>
      )}
      {mobilePhotosError && (
        <p className="mb-4 text-sm text-destructive">{mobilePhotosError}</p>
      )}

      {viewMode === "filters" ? (
        <>
          {/* Filters */}
          <div className="mb-8 rounded-lg border bg-card p-4">
            <div className="flex flex-col gap-3 pb-3 md:flex-row md:items-end md:justify-between">
                {/* Country Filter - dropdown multi-select */}
                <div className="w-full md:max-w-md" ref={countryDropdownRef}>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("country")}</label>
                  <div className="relative inline-block w-full">
                    <button
                      type="button"
                      onClick={() => setCountriesDropdownOpen((open) => !open)}
                      className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-left text-sm"
                    >
                      <span className="truncate">{countryFilterLabel}</span>
                      <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", countriesDropdownOpen && "rotate-180")} />
                    </button>

                    {countriesDropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-popover p-2 shadow-lg">
                        <div className="mb-2 flex items-center justify-between gap-2 border-b border-border/50 pb-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCountries([])
                              setSelectedRegion(undefined)
                              updateCountryParam([])
                            }}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            {t("allCountries")}
                          </button>
                          {selectedCountries.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCountries([])
                                setSelectedRegion(undefined)
                                updateCountryParam([])
                                setCountriesDropdownOpen(false)
                              }}
                              className="text-xs font-medium text-primary"
                            >
                              {t("clearFilters")}
                            </button>
                          )}
                        </div>

                        <div className="max-h-64 space-y-1 overflow-y-auto">
                          {availableCountries.map((country) => {
                            const checked = selectedCountries.includes(country)

                            return (
                              <label
                                key={country}
                                className={cn(
                                  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
                                  checked && "bg-accent/40"
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    handleCountryToggle(country)
                                  }}
                                  className="h-4 w-4 rounded border-border text-primary"
                                />
                                <span>{tCountries(country)}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("sortBy")}</label>
                  <div className="inline-flex rounded-md bg-muted p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSortBy("date")}
                      className={cn(
                        "h-8 cursor-pointer rounded-sm px-3",
                        sortBy === "date" ? "bg-background shadow-sm hover:bg-background" : "text-muted-foreground"
                      )}
                    >
                      {t("date")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSortBy("country")}
                      className={cn(
                        "h-8 cursor-pointer rounded-sm px-3",
                        sortBy === "country" ? "bg-background shadow-sm hover:bg-background" : "text-muted-foreground"
                      )}
                    >
                      {t("country")}
                    </Button>
                  </div>
                </div>
            </div>

            <div className="space-y-3">
                {/* Region Filter - only show when country selected and has regions */}
                {showRegionFilter && (
                  <div className="border-t border-border/50 pt-3">
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("region")}</label>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        variant={!selectedRegion ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedRegion(undefined)}
                        className={cn(!selectedRegion ? "" : "border-border")}
                      >
                        {t("all")}
                      </Button>
                      {availableRegions.map((region) => (
                        <Button
                          key={region}
                          variant={selectedRegion === region ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedRegion(region)}
                          className={cn(selectedRegion === region ? "" : "border-border")}
                        >
                          {tRegions(region)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMobileTrip && (
                  <div className="border-t border-border/50 pt-3">
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      {t("mobileTripFilter")}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setSelectedMobileTrip(undefined)}
                        className="gap-2"
                      >
                        {selectedMobileTrip}
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <div className="border-t border-border/50 pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      {t("clearFilters")}
                    </Button>
                  </div>
                )}
            </div>
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
      ) : viewMode === "trips" ? (
        /* Trips Grid */
        <div className="space-y-8">
          {includeMobilePhotos && mobileTripGroups.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold">{t("mobileTrips")}</h2>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {mobileTripGroups.map((trip) => (
                  <button
                    key={trip.key}
                    onClick={() => handleMobileTripOpen(trip.tripTitle)}
                    className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-muted text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Image
                      src={trip.coverSrc}
                      alt={trip.tripTitle}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/30" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <p className="text-lg font-medium text-white">{trip.tripTitle}</p>
                      <p className="text-sm text-white/70">
                        {tCountries(trip.country)} · {t("photos", { count: trip.count })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-4 text-lg font-semibold">{t("tripView")}</h2>
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
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight">{tMap("title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{tMap("description")}</p>
          </div>
          <WorldMap countryPhotoCounts={countryPhotoCounts} />
        </div>
      )}
    </div>
  )
}
