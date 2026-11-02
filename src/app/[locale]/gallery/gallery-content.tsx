"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ChevronDown, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter, usePathname } from "@/i18n/navigation"
import type { PhotoWithTrip, Trip } from "@/types"
import { filterPhotos } from "@/lib/trips"
import { PhotoGrid } from "@/components/photos/photo-grid"
import { WorldMap } from "@/components/map/WorldMap"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface GalleryContentProps {
  initialPhotos: PhotoWithTrip[]
  countries: string[]
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

const resolveCountriesFromQuery = (queryCountries: string[], countries: string[]): string[] => {
  if (queryCountries.length === 0) return []

  const countryLookup = new Set(countries.map((country) => country.toLowerCase()))
  const resolved: string[] = []

  for (const rawCountry of queryCountries) {
    const trimmed = rawCountry.trim()
    if (!trimmed) continue

    const exactMatch = countries.find((country) => country.toLowerCase() === trimmed.toLowerCase())
    if (exactMatch) {
      if (!resolved.some((country) => country.toLowerCase() === exactMatch.toLowerCase())) {
        resolved.push(exactMatch)
      }
      continue
    }

    if (!countryLookup.has(trimmed.toLowerCase())) {
      const titleCase = trimmed
        .replace(/[-_]+/g, " ")
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ")

      if (titleCase && !resolved.some((country) => country.toLowerCase() === titleCase.toLowerCase())) {
        resolved.push(titleCase)
      }
    }
  }

  return resolved
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
  trips: _trips,
  locale: _locale,
}: GalleryContentProps) {
  void _trips
  void _locale

  const t = useTranslations("gallery")
  const tMap = useTranslations("map")
  const tCountries = useTranslations("countries")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const resolveViewMode = (): "filters" | "map" => {
    const raw = searchParams.get("view")
    if (raw === "map") return raw
    return "filters"
  }
  const viewMode = resolveViewMode()
  const [selectedTrip, setSelectedTrip] = useState<string | undefined>()
  const [selectedMobileTrip, setSelectedMobileTrip] = useState<string | undefined>()
  const [countriesDropdownOpen, setCountriesDropdownOpen] = useState(false)
  const [countrySearch, setCountrySearch] = useState("")
  const [tripDropdownOpen, setTripDropdownOpen] = useState(false)
  const countryDropdownRef = useRef<HTMLDivElement | null>(null)
  const tripDropdownRef = useRef<HTMLDivElement | null>(null)
  const [includeMobilePhotos, setIncludeMobilePhotos] = useState(true)
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
    if (!countriesDropdownOpen && !tripDropdownOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return

      if (countryDropdownRef.current && !countryDropdownRef.current.contains(target)) {
        setCountriesDropdownOpen(false)
      }
      if (tripDropdownRef.current && !tripDropdownRef.current.contains(target)) {
        setTripDropdownOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [countriesDropdownOpen, tripDropdownOpen])

  const allPhotos = useMemo(
    () => (includeMobilePhotos ? [...initialPhotos, ...mobilePhotos] : initialPhotos),
    [includeMobilePhotos, initialPhotos, mobilePhotos]
  )

  const availableCountries = useMemo(() => {
    const countrySet = new Set(allPhotos.map((photo) => photo.country))
    return Array.from(countrySet).sort((a, b) =>
      tCountries(a).localeCompare(tCountries(b), undefined, { sensitivity: "base" })
    )
  }, [allPhotos, tCountries])

  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim().toLowerCase()
    if (!query) return availableCountries

    return availableCountries.filter((country) => {
      const translated = tCountries(country).toLowerCase()
      return translated.includes(query) || country.toLowerCase().includes(query)
    })
  }, [availableCountries, countrySearch, tCountries])

  const allKnownCountries = useMemo(
    () => Array.from(new Set([...countries, ...availableCountries])).sort(),
    [availableCountries, countries]
  )

  const selectedCountries = useMemo(
    () => resolveCountriesFromQuery(searchParams.getAll("country"), allKnownCountries),
    [allKnownCountries, searchParams]
  )

  const availableTrips = useMemo(() => {
    if (selectedCountries.length === 0) return []

    const tripSet = new Set(
      allPhotos
        .filter((photo) => selectedCountries.includes(photo.country))
        .map((photo) => photo.tripTitle)
        .filter(Boolean)
    )

    return Array.from(tripSet).sort((a, b) => a.localeCompare(b))
  }, [allPhotos, selectedCountries])

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

    if (selectedTrip && !nextCountries.some((selectedCountry) => {
      const tripInCountry = allPhotos.some(
        (photo) => photo.country === selectedCountry && photo.tripTitle === selectedTrip
      )
      return tripInCountry
    })) {
      setSelectedTrip(undefined)
    }

    const params = new URLSearchParams(searchParams.toString())
    params.delete("country")
    nextCountries.forEach((country) => params.append("country", country.toLowerCase()))
    const queryString = params.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }

  const activeTrip = selectedTrip && availableTrips.includes(selectedTrip) ? selectedTrip : undefined

  const filteredPhotos = useMemo(() => {
    let result = filterPhotos(allPhotos, {
      countries: selectedCountries,
    })

    if (activeTrip) {
      result = result.filter((photo) => photo.tripTitle === activeTrip)
    }

    if (selectedMobileTrip) {
      result = result.filter((photo) => photo.tripTitle === selectedMobileTrip)
    }

    return result
  }, [allPhotos, selectedCountries, activeTrip, selectedMobileTrip])

  const groupedPhotosByCountry = useMemo(() => {
    const grouped = new Map<string, PhotoWithTrip[]>()

    for (const photo of filteredPhotos) {
      const countryPhotos = grouped.get(photo.country)
      if (countryPhotos) {
        countryPhotos.push(photo)
      } else {
        grouped.set(photo.country, [photo])
      }
    }

    const toDateTime = (value: string): number => {
      const parsed = new Date(value)
      return Number.isNaN(parsed.getTime()) ? Number.MAX_SAFE_INTEGER : parsed.getTime()
    }

    const countries = Array.from(grouped.keys()).sort((countryA, countryB) => {
      const oldestA = grouped
        .get(countryA)!
        .reduce((oldest, photo) => Math.min(oldest, toDateTime(photo.date)), Number.MAX_SAFE_INTEGER)
      const oldestB = grouped
        .get(countryB)!
        .reduce((oldest, photo) => Math.min(oldest, toDateTime(photo.date)), Number.MAX_SAFE_INTEGER)

      if (oldestA !== oldestB) return oldestA - oldestB
      return countryA.localeCompare(countryB)
    })

    return countries.map((country) => ({
      country,
      photos: [...(grouped.get(country) ?? [])].sort((photoA, photoB) => {
        const dateDelta = toDateTime(photoA.date) - toDateTime(photoB.date)
        if (dateDelta !== 0) return dateDelta
        if (photoA.tripTitle !== photoB.tripTitle) {
          return photoA.tripTitle.localeCompare(photoB.tripTitle)
        }
        return photoA.filename.localeCompare(photoB.filename)
      }),
    }))
  }, [filteredPhotos])

  const hasActiveFilters = selectedCountries.length > 0 || activeTrip || selectedMobileTrip

  const clearFilters = () => {
    setSelectedTrip(undefined)
    setSelectedMobileTrip(undefined)
    updateCountryParam([])
  }

  const handleViewModeChange = (mode: "filters" | "map") => {
    const params = new URLSearchParams(searchParams.toString())
    if (mode === "filters") {
      params.delete("view")
    } else {
      params.set("view", mode)
    }
    const queryString = params.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }

  const countryFilterLabel =
    selectedCountries.length === 0
      ? t("allCountries")
      : selectedCountries.length === 1
        ? tCountries(selectedCountries[0])
        : `${selectedCountries.length} ${t("countriesSelected")}`

  const tripFilterLabel = activeTrip ? activeTrip : t("all")

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
        <div className="flex h-10 items-center justify-between gap-2 rounded-md bg-muted px-2.5 py-0 sm:ml-auto sm:w-auto sm:min-w-[150px]">
          <span className="text-sm leading-none text-muted-foreground">{t("photosFromMobile")}</span>
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
              "relative inline-flex h-4 w-7 items-center rounded-full border transition-colors",
              includeMobilePhotos ? "border-primary bg-primary" : "border-border bg-muted"
            )}
          >
            <span
              className={cn(
                "inline-block h-3 w-3 transform rounded-full bg-background transition-transform",
                includeMobilePhotos ? "translate-x-3" : "translate-x-0.5"
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
          <div className="mb-4 p-0">
            <div className="flex flex-col gap-2 pb-0">
              <div className="grid w-full gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] md:items-end">
                {/* Country Filter - dropdown multi-select */}
                <div className="w-full" ref={countryDropdownRef}>
                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {t("country")}
                  </label>
                  <div className="relative inline-block w-full">
                    <button
                      type="button"
                      onClick={() => {
                        setCountriesDropdownOpen((open) => !open)
                        if (!countriesDropdownOpen) setCountrySearch("")
                      }}
                      className="flex w-full items-center justify-between rounded-md border border-border bg-muted/60 px-2.5 py-1.5 text-left text-sm text-foreground"
                    >
                      <span className="truncate">{countryFilterLabel}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform",
                          countriesDropdownOpen && "rotate-180"
                        )}
                      />
                    </button>

                    {countriesDropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-popover p-2 shadow-lg">
                        <div className="mb-2 border-b border-border/50 pb-2">
                          <input
                            type="text"
                            value={countrySearch}
                            onChange={(event) => setCountrySearch(event.target.value)}
                            placeholder={t("searchCountries")}
                            className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>

                        <div className="mb-2 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              updateCountryParam([])
                              setCountrySearch("")
                            }}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            {t("allCountries")}
                          </button>
                          {selectedCountries.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                updateCountryParam([])
                                setCountrySearch("")
                                setCountriesDropdownOpen(false)
                              }}
                              className="text-xs font-medium text-primary"
                            >
                              {t("clearFilters")}
                            </button>
                          )}
                        </div>

                        <div className="max-h-64 space-y-1 overflow-y-auto">
                          {filteredCountries.length === 0 ? (
                            <p className="px-2 py-1.5 text-sm text-muted-foreground">{t("noResults")}</p>
                          ) : (
                            filteredCountries.map((country) => {
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
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full" ref={tripDropdownRef}>
                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {t("trip")}
                  </label>
                  <div className="relative inline-block w-full">
                    <button
                      type="button"
                      onClick={() => setTripDropdownOpen((open) => !open)}
                      disabled={selectedCountries.length === 0}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md border border-border bg-muted/60 px-2.5 py-1.5 text-left text-sm text-foreground",
                        selectedCountries.length === 0 && "cursor-not-allowed opacity-60"
                      )}
                    >
                      <span className="truncate">{tripFilterLabel}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform",
                          tripDropdownOpen && "rotate-180"
                        )}
                      />
                    </button>

                    {tripDropdownOpen && selectedCountries.length > 0 && (
                      <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-popover p-2 shadow-lg">
                        <div className="mb-2 flex items-center justify-between gap-2 border-b border-border/50 pb-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTrip(undefined)
                              setTripDropdownOpen(false)
                            }}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            {t("all")}
                          </button>
                          {activeTrip && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTrip(undefined)
                                setTripDropdownOpen(false)
                              }}
                              className="text-xs font-medium text-primary"
                            >
                              {t("clearFilters")}
                            </button>
                          )}
                        </div>

                        <div className="max-h-64 space-y-1 overflow-y-auto">
                          {availableTrips.length === 0 ? (
                            <p className="px-2 py-1.5 text-sm text-muted-foreground">{t("all")}</p>
                          ) : (
                            availableTrips.map((trip) => {
                              const active = activeTrip === trip

                              return (
                                <button
                                  key={trip}
                                  type="button"
                                  onClick={() => {
                                    setSelectedTrip(active ? undefined : trip)
                                    setTripDropdownOpen(false)
                                  }}
                                  className={cn(
                                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                                    active && "bg-accent/40"
                                  )}
                                >
                                  <span className="truncate">{trip}</span>
                                  {active && <span className="ml-2 text-primary">✓</span>}
                                </button>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full md:w-auto">
                  <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-transparent">
                    &nbsp;
                  </span>
                  <div className="flex h-[32px] items-center justify-end text-[11px] leading-none text-muted-foreground">
                    {hasActiveFilters
                      ? t("photosFiltered", { count: filteredPhotos.length })
                      : t("photos", { count: filteredPhotos.length })}
                  </div>
                </div>

                <div className="w-full md:w-auto">
                  <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-transparent">
                    &nbsp;
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className="h-[32px] w-full border border-border bg-muted/80 px-3 text-sm text-foreground shadow-none hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:border-border/60 disabled:bg-muted/50 disabled:text-muted-foreground md:w-auto"
                  >
                    {t("clearFilters")}
                  </Button>
                </div>
              </div>

            </div>

            <div className="space-y-3">
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

            </div>
          </div>

          {/* Photo Grid */}
          {filteredPhotos.length > 0 ? (
            <div className="space-y-8">
              {groupedPhotosByCountry.map(({ country, photos }) => (
                <section key={country} className="space-y-3">
                  <h2 className="text-lg font-semibold tracking-tight md:text-xl">
                    {tCountries(country)}
                  </h2>
                  <PhotoGrid photos={photos} columns={3} />
                </section>
              ))}
            </div>
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
