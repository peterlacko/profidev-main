"use client"

import { type MouseEvent, useRef, useState } from "react"
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps"
import { useTranslations } from "next-intl"
import { Plus, Minus, RotateCcw } from "lucide-react"
import { useRouter } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"

interface WorldMapProps {
  countryPhotoCounts: Record<string, number>
}

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

const COUNTRY_ALIASES: Record<string, string> = {
  costarica: "Costarica",
  turkiye: "Turkey",
}

const normalizeCountryKey = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")

const resolveCountry = (
  mapCountryName: string,
  countryLookup: Map<string, string>,
): string | undefined => {
  const directMatch = countryLookup.get(normalizeCountryKey(mapCountryName))
  if (directMatch) return directMatch

  const aliasTarget = COUNTRY_ALIASES[normalizeCountryKey(mapCountryName)]
  if (!aliasTarget) return undefined

  return countryLookup.get(normalizeCountryKey(aliasTarget))
}

export const WorldMap = ({ countryPhotoCounts }: WorldMapProps) => {
  const tCountries = useTranslations("countries")
  const tMap = useTranslations("map")
  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<{ center: [number, number]; zoom: number }>({
    center: [0, 20],
    zoom: 1,
  })
  const [tooltip, setTooltip] = useState<{
    country: string
    count: number
    x: number
    y: number
  } | null>(null)

  const minZoom = 1
  const maxZoom = 4

  const countryLookup = new Map(
    Object.keys(countryPhotoCounts).map((country) => [normalizeCountryKey(country), country]),
  )

  const handleCountryClick = (country: string) => {
    router.push(`/gallery?country=${encodeURIComponent(country.toLowerCase())}`)
  }

  const updateZoom = (delta: number) => {
    setView((prev) => ({
      ...prev,
      zoom: Math.min(maxZoom, Math.max(minZoom, Number((prev.zoom + delta).toFixed(2)))),
    }))
  }

  const getTooltipPosition = (clientX: number, clientY: number) => {
    const rect = wrapperRef.current?.getBoundingClientRect()
    if (!rect) return { x: clientX, y: clientY }
    return {
      x: clientX - rect.left + 12,
      y: clientY - rect.top - 12,
    }
  }

  return (
    <div ref={wrapperRef} className="relative overflow-hidden rounded-lg border bg-card p-2 sm:p-4">
      <div className="absolute right-4 top-4 z-20 flex gap-2">
        <Button size="icon" variant="secondary" onClick={() => updateZoom(0.5)} aria-label="Zoom in">
          <Plus className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" onClick={() => updateZoom(-0.5)} aria-label="Zoom out">
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={() => setView({ center: [0, 20], zoom: 1 })}
          aria-label="Reset map"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-md border bg-background px-2 py-1 text-xs shadow-sm"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="font-medium">{tCountries(tooltip.country)}</div>
          <div className="text-muted-foreground">{tMap("photosCount", { count: tooltip.count })}</div>
        </div>
      )}

      <ComposableMap
        projectionConfig={{ scale: 150 }}
        width={980}
        height={500}
        className="h-auto w-full"
        aria-label="World map"
      >
        <ZoomableGroup
          center={view.center}
          zoom={view.zoom}
          minZoom={minZoom}
          maxZoom={maxZoom}
          onMoveEnd={({ coordinates, zoom }) => {
            setView((prev) => ({
              center: coordinates ?? prev.center,
              zoom: zoom ?? prev.zoom,
            }))
          }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryName =
                  typeof geo.properties?.name === "string"
                    ? geo.properties.name
                    : typeof geo.properties?.NAME === "string"
                      ? geo.properties.NAME
                      : ""
                const country = resolveCountry(countryName, countryLookup)
                const isActive = Boolean(country)
                const count = country ? countryPhotoCounts[country] ?? 0 : 0
                const fillColor = isActive ? "var(--primary)" : "var(--muted)"
                const interactionProps = isActive && country
                  ? {
                      onMouseDown: (event: MouseEvent<SVGPathElement>) => {
                        event.preventDefault()
                      },
                      onClick: () => {
                        handleCountryClick(country)
                      },
                      onMouseEnter: (event: MouseEvent<SVGPathElement>) => {
                        const pos = getTooltipPosition(event.clientX, event.clientY)
                        setTooltip({
                          country,
                          count,
                          x: pos.x,
                          y: pos.y,
                        })
                      },
                      onMouseMove: (event: MouseEvent<SVGPathElement>) => {
                        const pos = getTooltipPosition(event.clientX, event.clientY)
                        setTooltip((prev) =>
                          prev
                            ? {
                                ...prev,
                                x: pos.x,
                                y: pos.y,
                              }
                            : prev,
                        )
                      },
                      onMouseLeave: () => setTooltip(null),
                    }
                  : {}

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    tabIndex={country ? 0 : -1}
                    focusable={country}
                    {...interactionProps}
                    fill={fillColor}
                    fillOpacity={isActive ? 1 : 0.7}
                    stroke="var(--border)"
                    strokeWidth={0.5}
                    pointerEvents={isActive ? "auto" : "none"}
                    style={{ outline: "none" }}
                    className={
                      isActive
                        ? "cursor-pointer outline-none focus:outline-none transition-opacity hover:opacity-80"
                        : "cursor-default outline-none focus:outline-none"
                    }
                  />
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  )
}
