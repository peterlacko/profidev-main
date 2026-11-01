"use client"

import { useMemo, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type UploadItemStatus = "pending" | "uploading" | "retrying" | "success" | "error"

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

type UploadDraft = {
  files: File[]
  country: string
  trip: string
  caption: string
}

const CLIENT_MAX_WIDTH = 2560
const CLIENT_MAX_HEIGHT = 1440
const CLIENT_JPEG_QUALITY = 0.86
const TOKEN_STORAGE_KEY = "mobile-upload-token"
const BIOMETRIC_CREDENTIAL_ID_KEY = "mobile-upload-biometric-credential-id"
const UPLOAD_RETRY_DELAYS_MS = [1200, 3000, 6000]
const MAX_UPLOAD_ATTEMPTS = UPLOAD_RETRY_DELAYS_MS.length + 1

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

const bytesToBase64Url = (bytes: Uint8Array): string => {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

const base64UrlToBytes = (value: string): Uint8Array => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")
  const binary = atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer
}

const wait = async (milliseconds: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, milliseconds))
}

const shouldRetryUpload = (status: number): boolean => {
  return status === 408 || status === 425 || status === 429 || status >= 500
}

const waitUntilOnline = async (): Promise<void> => {
  if (navigator.onLine) return

  await new Promise<void>((resolve) => {
    const onOnline = () => {
      window.removeEventListener("online", onOnline)
      resolve()
    }
    window.addEventListener("online", onOnline)
  })
}

export function UploadForm() {
  const t = useTranslations("mobileUpload")
  const [token, setToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [biometricAvailable] = useState(() => {
    if (typeof window === "undefined") return false
    return (
      typeof window.PublicKeyCredential !== "undefined" &&
      typeof navigator.credentials !== "undefined"
    )
  })
  const [biometricConfigured, setBiometricConfigured] = useState(() => {
    if (typeof window === "undefined") return false
    return Boolean(window.localStorage.getItem(BIOMETRIC_CREDENTIAL_ID_KEY))
  })
  const [isBiometricBusy, setIsBiometricBusy] = useState(false)
  const [country, setCountry] = useState("")
  const [trip, setTrip] = useState("")
  const [caption, setCaption] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [items, setItems] = useState<UploadItem[]>([])
  const [failedDraft, setFailedDraft] = useState<UploadDraft | null>(null)
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

  const rollbackUploadBatch = async (uploadBatchId: string): Promise<number> => {
    const response = await fetch("/api/mobile-photos/upload/rollback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-mobile-upload-token": token.trim(),
      },
      body: JSON.stringify({ uploadBatchId }),
    })

    if (!response.ok) {
      const message = await extractErrorMessage(
        response,
        t("errors.rollbackFailed")
      )
      throw new Error(message)
    }

    const data = (await response.json()) as { deletedCount?: number }
    return data.deletedCount ?? 0
  }

  const enableBiometricUnlock = async () => {
    if (!biometricAvailable) {
      setGlobalError(t("errors.biometricsNotSupported"))
      return
    }

    if (!token.trim()) {
      setGlobalError(t("errors.tokenRequired"))
      return
    }

    setGlobalError(null)
    setIsBiometricBusy(true)
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32))
      const userId = crypto.getRandomValues(new Uint8Array(32))

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: "Travel Portfolio",
          },
          user: {
            id: userId,
            name: "mobile-upload-user",
            displayName: "Mobile Upload User",
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 },
          ],
          timeout: 60_000,
          attestation: "none",
          authenticatorSelection: {
            userVerification: "required",
          },
        },
      })

      if (!(credential instanceof PublicKeyCredential)) {
        throw new Error(t("errors.biometricsSetupFailed"))
      }

      const credentialId = bytesToBase64Url(new Uint8Array(credential.rawId))
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token.trim())
      window.localStorage.setItem(BIOMETRIC_CREDENTIAL_ID_KEY, credentialId)
      setBiometricConfigured(true)
    } catch (error) {
      setGlobalError(
        error instanceof Error
          ? error.message
          : t("errors.biometricsSetupFailed")
      )
    } finally {
      setIsBiometricBusy(false)
    }
  }

  const unlockTokenWithBiometrics = async () => {
    if (!biometricAvailable) {
      setGlobalError(t("errors.biometricsNotSupported"))
      return
    }

    const credentialId = window.localStorage.getItem(BIOMETRIC_CREDENTIAL_ID_KEY)
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!credentialId || !storedToken) {
      setGlobalError(t("errors.biometricsNotConfigured"))
      return
    }

    setGlobalError(null)
    setIsBiometricBusy(true)
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32))
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [
            {
              id: toArrayBuffer(base64UrlToBytes(credentialId)),
              type: "public-key",
            },
          ],
          userVerification: "required",
          timeout: 60_000,
        },
      })

      if (!assertion) {
        throw new Error(t("errors.biometricsUnlockFailed"))
      }

      setToken(storedToken)
    } catch (error) {
      setGlobalError(
        error instanceof Error
          ? error.message
          : t("errors.biometricsUnlockFailed")
      )
    } finally {
      setIsBiometricBusy(false)
    }
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

  const uploadPhotoWithRetry = async (input: {
    file: File
    uploadBatchId: string
    countryValue: string
    tripValue: string
    captionValue: string
    itemId: string
  }): Promise<{ ok: true } | { ok: false; error: string }> => {
    for (let attempt = 1; attempt <= MAX_UPLOAD_ATTEMPTS; attempt++) {
      const payload = new FormData()
      payload.set("file", input.file)
      payload.set("country", input.countryValue)
      payload.set("trip", input.tripValue)
      payload.set("caption", input.captionValue)
      payload.set("uploadBatchId", input.uploadBatchId)

      try {
        const response = await fetch("/api/mobile-photos/upload", {
          method: "POST",
          headers: {
            "x-mobile-upload-token": token.trim(),
          },
          body: payload,
        })

        if (response.ok) {
          return { ok: true }
        }

        const errorMessage = await extractErrorMessage(response, t("errors.uploadFailed"))
        const canRetry = shouldRetryUpload(response.status)
        if (!canRetry || attempt === MAX_UPLOAD_ATTEMPTS) {
          if (attempt === 1) {
            return { ok: false, error: errorMessage }
          }
          return {
            ok: false,
            error: t("errors.uploadFailedAfterRetries", {
              reason: errorMessage,
              attempts: attempt,
            }),
          }
        }
      } catch (error) {
        if (attempt === MAX_UPLOAD_ATTEMPTS) {
          const finalErrorMessage =
            error instanceof Error ? error.message : t("errors.uploadFailed")
          if (attempt === 1) {
            return { ok: false, error: finalErrorMessage }
          }
          return {
            ok: false,
            error: t("errors.uploadFailedAfterRetries", {
              reason: finalErrorMessage,
              attempts: attempt,
            }),
          }
        }
      }

      updateStatus(
        input.itemId,
        "retrying",
        t("retryingAttempt", {
          attempt: attempt + 1,
          maxAttempts: MAX_UPLOAD_ATTEMPTS,
        })
      )
      await waitUntilOnline()
      await wait(UPLOAD_RETRY_DELAYS_MS[attempt - 1] ?? 1000)
    }

    return { ok: false, error: t("errors.uploadFailed") }
  }

  const performUploadBatch = async (draft: UploadDraft) => {
    setGlobalError(null)
    setFailedDraft(null)

    const countryValue = draft.country.trim()
    const tripValue = draft.trip.trim()
    const captionValue = draft.caption.trim()
    const files = draft.files

    const nextItems = files.map((file) => createUploadItem(file))
    setItems(nextItems)
    setIsSubmitting(true)
    const uploadBatchId = crypto.randomUUID()
    let failedUploadMessage: string | null = null
    let failedIndex = -1

    try {
      for (let index = 0; index < files.length; index++) {
        const file = files[index]
        const item = nextItems[index]
        updateStatus(item.id, "uploading")

        const preparedFile = await resizeForMobileUpload(file)
        updateUploadBytes(item.id, preparedFile.size)
        const uploadResult = await uploadPhotoWithRetry({
          file: preparedFile,
          uploadBatchId,
          countryValue,
          tripValue,
          captionValue,
          itemId: item.id,
        })

        if (!uploadResult.ok) {
          updateStatus(item.id, "error", uploadResult.error)
          failedUploadMessage = `${file.name}: ${uploadResult.error}`
          failedIndex = index
          break
        }

        updateStatus(item.id, "success")
      }

      if (failedUploadMessage !== null) {
        setFailedDraft(draft)
        for (let index = failedIndex + 1; index < files.length; index++) {
          const item = nextItems[index]
          updateStatus(item.id, "error", t("errors.uploadStopped"))
        }

        try {
          const deletedCount = await rollbackUploadBatch(uploadBatchId)
          setGlobalError(
            t("errors.uploadStoppedAndRolledBack", {
              reason: failedUploadMessage,
              deletedCount,
            })
          )
        } catch (rollbackError) {
          const rollbackMessage =
            rollbackError instanceof Error
              ? rollbackError.message
              : t("errors.rollbackFailed")

          setGlobalError(
            t("errors.uploadStoppedRollbackFailed", {
              reason: failedUploadMessage,
              rollbackError: rollbackMessage,
            })
          )
        }
        return
      }

      setFailedDraft(null)
    } finally {
      setIsSubmitting(false)
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
    await performUploadBatch({
      files,
      country: country.trim(),
      trip: trip.trim(),
      caption: caption.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="token" className="mb-2 block text-sm font-medium">
          {t("token")}
        </label>
        <div className="space-y-2">
          <div className="relative">
            <input
              id="token"
              name="token"
              type={showToken ? "text" : "password"}
              autoComplete="off"
              className={cn(fileInputClasses, "pr-10")}
              placeholder={t("tokenPlaceholder")}
              value={token}
              onChange={(event) => setToken(event.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowToken((current) => !current)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
              aria-label={showToken ? t("hideToken") : t("showToken")}
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={enableBiometricUnlock}
              disabled={isBiometricBusy || !biometricAvailable}
            >
              {isBiometricBusy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Fingerprint className="mr-2 h-4 w-4" />
              )}
              {t("enableBiometrics")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={unlockTokenWithBiometrics}
              disabled={isBiometricBusy || !biometricConfigured}
            >
              {isBiometricBusy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Fingerprint className="mr-2 h-4 w-4" />
              )}
              {t("useBiometrics")}
            </Button>
          </div>
          {!biometricAvailable && (
            <p className="text-xs text-muted-foreground">{t("biometricsUnavailable")}</p>
          )}
        </div>
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
      {failedDraft && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isSubmitting}
          onClick={() => void performUploadBatch(failedDraft)}
        >
          {t("resumeFailedUpload")}
        </Button>
      )}

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
                  {item.status === "retrying" && (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {t("status.retrying")} {item.error ? `(${item.error})` : ""}
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
