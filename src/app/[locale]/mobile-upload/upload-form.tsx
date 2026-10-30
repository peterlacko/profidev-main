"use client"

import { useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, Loader2, Trash2, Upload } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type UploadItemStatus = "pending" | "uploading" | "success" | "error"

type UploadItem = {
  id: string
  filename: string
  status: UploadItemStatus
  error?: string
  originalBytes: number
  uploadBytes?: number
}

type MobileTripSummary = {
  country: string
  trip: string
  photosCount: number
  lastUploadedAt: string
}

const CLIENT_MAX_WIDTH = 2560
const CLIENT_MAX_HEIGHT = 1440
const CLIENT_JPEG_QUALITY = 0.86

const fileInputClasses = cn(
  "w-full rounded-md border bg-background px-4 py-2 text-sm",
  "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20",
  "placeholder:text-muted-foreground"
)

const createUploadItem = (file: File): UploadItem => ({
  id: `${Date.now()}-${file.name}-${Math.random()}`,
  filename: file.name,
  status: "pending",
  originalBytes: file.size,
})

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B"
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

const extractErrorMessage = async (
  response: Response,
  fallbackMessage: string
): Promise<string> => {
  const raw = await response.text()
  if (!raw) return fallbackMessage

  try {
    const parsed = JSON.parse(raw) as { error?: string }
    if (parsed.error) return parsed.error
  } catch {
    // Non-JSON error response (e.g. proxy/body-size error)
  }

  return raw
}

const resizeForMobileUpload = async (file: File): Promise<File> => {
  if (!file.type.startsWith("image/")) return file
  if (file.type === "image/heic" || file.type === "image/heif") return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(
      1,
      CLIENT_MAX_WIDTH / bitmap.width,
      CLIENT_MAX_HEIGHT / bitmap.height
    )

    const targetWidth = Math.max(1, Math.round(bitmap.width * scale))
    const targetHeight = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement("canvas")
    canvas.width = targetWidth
    canvas.height = targetHeight

    const context = canvas.getContext("2d")
    if (!context) {
      bitmap.close()
      return file
    }

    context.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
    bitmap.close()

    const outputBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", CLIENT_JPEG_QUALITY)
    )
    if (!outputBlob) return file

    const outputName = file.name.replace(/\.[^/.]+$/, "") || "mobile-photo"
    return new File([outputBlob], `${outputName}.jpg`, { type: "image/jpeg" })
  } catch {
    return file
  }
}

export function UploadForm() {
  const t = useTranslations("mobileUpload")
  const [token, setToken] = useState("")
  const [country, setCountry] = useState("")
  const [trip, setTrip] = useState("")
  const [caption, setCaption] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [items, setItems] = useState<UploadItem[]>([])
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [mobileTrips, setMobileTrips] = useState<MobileTripSummary[]>([])
  const [tripsLoading, setTripsLoading] = useState(false)
  const [tripsError, setTripsError] = useState<string | null>(null)
  const [deletingTripKey, setDeletingTripKey] = useState<string | null>(null)

  const successCount = useMemo(
    () => items.filter((item) => item.status === "success").length,
    [items]
  )

  const updateStatus = (id: string, status: UploadItemStatus, error?: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              error,
            }
          : item
      )
    )
  }

  const updateUploadBytes = (id: string, uploadBytes: number) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              uploadBytes,
            }
          : item
      )
    )
  }

  const loadMobileTrips = async () => {
    if (!token.trim()) {
      setTripsError(t("errors.tokenRequired"))
      return
    }

    setTripsLoading(true)
    setTripsError(null)
    try {
      const response = await fetch("/api/mobile-photos/trips", {
        method: "GET",
        headers: {
          "x-mobile-upload-token": token.trim(),
        },
      })

      if (!response.ok) {
        const errorMessage = await extractErrorMessage(
          response,
          t("errors.listTripsFailed")
        )
        throw new Error(errorMessage)
      }

      const data = (await response.json()) as { trips?: MobileTripSummary[] }
      setMobileTrips(data.trips ?? [])
    } catch (error) {
      setTripsError(
        error instanceof Error ? error.message : t("errors.listTripsFailed")
      )
    } finally {
      setTripsLoading(false)
    }
  }

  const removeMobileTrip = async (trip: MobileTripSummary) => {
    if (!token.trim()) {
      setTripsError(t("errors.tokenRequired"))
      return
    }

    const confirmed = window.confirm(
      t("confirmDeleteTrip", { trip: trip.trip, country: trip.country })
    )
    if (!confirmed) return

    const tripKey = `${trip.country}::${trip.trip}`
    setDeletingTripKey(tripKey)
    setTripsError(null)
    try {
      const response = await fetch("/api/mobile-photos/trips", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-mobile-upload-token": token.trim(),
        },
        body: JSON.stringify({
          country: trip.country,
          trip: trip.trip,
        }),
      })

      if (!response.ok) {
        const errorMessage = await extractErrorMessage(
          response,
          t("errors.deleteTripFailed")
        )
        throw new Error(errorMessage)
      }

      setMobileTrips((current) =>
        current.filter(
          (item) => !(item.country === trip.country && item.trip === trip.trip)
        )
      )
    } catch (error) {
      setTripsError(
        error instanceof Error ? error.message : t("errors.deleteTripFailed")
      )
    } finally {
      setDeletingTripKey(null)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setGlobalError(null)

    if (!token.trim()) {
      setGlobalError(t("errors.tokenRequired"))
      return
    }

    const formData = new FormData(event.currentTarget)
    const files = formData.getAll("photos").filter((entry): entry is File => entry instanceof File)

    if (files.length === 0) {
      setGlobalError(t("errors.photoRequired"))
      return
    }

    if (!country.trim()) {
      setGlobalError(t("errors.countryRequired"))
      return
    }

    const nextItems = files.map((file) => createUploadItem(file))
    setItems(nextItems)
    setIsSubmitting(true)

    for (let index = 0; index < files.length; index++) {
      const file = files[index]
      const item = nextItems[index]
      updateStatus(item.id, "uploading")

      const preparedFile = await resizeForMobileUpload(file)
      updateUploadBytes(item.id, preparedFile.size)
      const payload = new FormData()
      payload.set("file", preparedFile)
      payload.set("country", country.trim())
      payload.set("trip", trip.trim())
      payload.set("caption", caption.trim())

      try {
        const response = await fetch("/api/mobile-photos/upload", {
          method: "POST",
          headers: {
            "x-mobile-upload-token": token.trim(),
          },
          body: payload,
        })

        if (!response.ok) {
          const errorMessage = await extractErrorMessage(
            response,
            t("errors.uploadFailed")
          )
          updateStatus(item.id, "error", errorMessage)
          continue
        }

        updateStatus(item.id, "success")
      } catch (error) {
        updateStatus(
          item.id,
          "error",
          error instanceof Error ? error.message : t("errors.uploadFailed")
        )
      }
    }

    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="token" className="mb-2 block text-sm font-medium">
          {t("token")}
        </label>
        <input
          id="token"
          name="token"
          type="password"
          autoComplete="off"
          className={fileInputClasses}
          placeholder={t("tokenPlaceholder")}
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />
      </div>

      <div>
        <label htmlFor="country" className="mb-2 block text-sm font-medium">
          {t("country")}
        </label>
        <input
          id="country"
          name="country"
          required
          className={fileInputClasses}
          placeholder={t("countryPlaceholder")}
          value={country}
          onChange={(event) => setCountry(event.target.value)}
        />
      </div>

      <div>
        <label htmlFor="trip" className="mb-2 block text-sm font-medium">
          {t("trip")}
        </label>
        <input
          id="trip"
          name="trip"
          className={fileInputClasses}
          placeholder={t("tripPlaceholder")}
          value={trip}
          onChange={(event) => setTrip(event.target.value)}
        />
      </div>

      <div>
        <label htmlFor="caption" className="mb-2 block text-sm font-medium">
          {t("caption")}
        </label>
        <input
          id="caption"
          name="caption"
          className={fileInputClasses}
          placeholder={t("captionPlaceholder")}
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
        />
      </div>

      <div>
        <label htmlFor="photos" className="mb-2 block text-sm font-medium">
          {t("photos")}
        </label>
        <input
          id="photos"
          name="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          className={fileInputClasses}
        />
      </div>

      {globalError && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{globalError}</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("uploading")}
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            {t("submit")}
          </>
        )}
      </Button>

      {items.length > 0 && (
        <div className="space-y-2 rounded-md border p-3">
          <p className="text-sm font-medium">
            {t("resultSummary", { success: successCount, total: items.length })}
          </p>
          <ul className="space-y-1 text-sm">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="block truncate">{item.filename}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatBytes(item.originalBytes)} →{" "}
                    {formatBytes(item.uploadBytes ?? item.originalBytes)}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-xs">
                  {item.status === "success" && (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      {t("status.success")}
                    </>
                  )}
                  {item.status === "uploading" && (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {t("status.uploading")}
                    </>
                  )}
                  {item.status === "pending" && t("status.pending")}
                  {item.status === "error" && (
                    <span className="text-destructive">
                      {t("status.error")} {item.error ? `(${item.error})` : ""}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3 rounded-md border p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{t("manageTripsTitle")}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadMobileTrips}
            disabled={tripsLoading}
          >
            {tripsLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("loadingTrips")}
              </>
            ) : (
              t("loadTrips")
            )}
          </Button>
        </div>

        {tripsError && (
          <p className="text-sm text-destructive">{tripsError}</p>
        )}

        {mobileTrips.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noTripsToManage")}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {mobileTrips.map((trip) => {
              const tripKey = `${trip.country}::${trip.trip}`
              const isDeleting = deletingTripKey === tripKey
              return (
                <li key={tripKey} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {trip.trip} · {trip.country}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("tripSummary", { count: trip.photosCount })}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => void removeMobileTrip(trip)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="mr-1 h-4 w-4" />
                        {t("deleteTrip")}
                      </>
                    )}
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </form>
  )
}
