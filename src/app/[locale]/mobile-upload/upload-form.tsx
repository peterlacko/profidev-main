"use client"

import { useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, Loader2, Upload } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type UploadItemStatus = "pending" | "uploading" | "success" | "error"

type UploadItem = {
  id: string
  filename: string
  status: UploadItemStatus
  error?: string
}

const fileInputClasses = cn(
  "w-full rounded-md border bg-background px-4 py-2 text-sm",
  "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20",
  "placeholder:text-muted-foreground"
)

const createUploadItem = (filename: string): UploadItem => ({
  id: `${Date.now()}-${filename}-${Math.random()}`,
  filename,
  status: "pending",
})

export function UploadForm() {
  const t = useTranslations("mobileUpload")
  const [token, setToken] = useState("")
  const [country, setCountry] = useState("")
  const [trip, setTrip] = useState("")
  const [caption, setCaption] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [items, setItems] = useState<UploadItem[]>([])
  const [globalError, setGlobalError] = useState<string | null>(null)

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

    const nextItems = files.map((file) => createUploadItem(file.name))
    setItems(nextItems)
    setIsSubmitting(true)

    for (let index = 0; index < files.length; index++) {
      const file = files[index]
      const item = nextItems[index]
      updateStatus(item.id, "uploading")

      const payload = new FormData()
      payload.set("file", file)
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
          const data = (await response.json()) as { error?: string }
          updateStatus(item.id, "error", data.error ?? t("errors.uploadFailed"))
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
                <span className="truncate">{item.filename}</span>
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
    </form>
  )
}
