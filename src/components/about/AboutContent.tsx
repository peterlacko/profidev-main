"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { ChevronDown, Send, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

type FormStatus = "idle" | "submitting" | "success" | "error"

export const AboutContent = () => {
  const t = useTranslations("about")
  const tContact = useTranslations("about.contact")
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<FormStatus>("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus("submitting")
    setErrorMessage("")

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      subject: "Contact from About page",
      message: formData.get("message") as string,
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Failed to send message")
      }

      setStatus("success")
    } catch (error) {
      setStatus("error")
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      )
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Professional Section */}
      <div className="space-y-6">
        <p className="text-lg text-muted-foreground">{t("professional.intro")}</p>
        <p className="text-muted-foreground">{t("professional.experience")}</p>

        <div>
          <h3 className="font-semibold mb-2">{t("professional.whatIDoTitle")}</h3>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>{t("professional.whatIDo1")}</li>
            <li>{t("professional.whatIDo2")}</li>
            <li>{t("professional.whatIDo3")}</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-2">{t("professional.approachTitle")}</h3>
          <p className="text-muted-foreground">{t("professional.approach")}</p>
        </div>

        <p className="text-muted-foreground">
          <strong>{t("professional.languagesTitle")}:</strong> {t("professional.languages")}
        </p>
      </div>

      {/* Collapsible Personal Section */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-10">
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            {t("knowMeBetter")}
            <ChevronDown className={cn(
              "ml-2 h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <div className="mt-8 space-y-4 text-muted-foreground">
            <p>{t("personal.hobbies")}</p>
            <p>{t("personal.home")}</p>
            <p>{t("personal.prints")}</p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Get in Touch Section - Always visible */}
      <div className="mt-12 pt-8 border-t clear-both">
        <h2 className="text-2xl font-bold mb-2">{tContact("title")}</h2>
        <p className="text-muted-foreground mb-6">{tContact("description")}</p>

        {status === "success" ? (
          <div className="py-8 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-4 text-lg font-semibold">{tContact("success.title")}</h3>
            <p className="mt-2 text-muted-foreground">
              {tContact("success.description")}
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => setStatus("idle")}
            >
              {tContact("success.sendAnother")}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="about-name" className="mb-2 block text-sm font-medium">
                {tContact("name")} <span className="text-destructive">{tContact("required")}</span>
              </label>
              <input
                type="text"
                id="about-name"
                name="name"
                required
                className={cn(
                  "w-full rounded-md border bg-background px-4 py-2 text-sm",
                  "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20",
                  "placeholder:text-muted-foreground"
                )}
                placeholder={tContact("name")}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="about-email" className="mb-2 block text-sm font-medium">
                {tContact("email")} <span className="text-destructive">{tContact("required")}</span>
              </label>
              <input
                type="email"
                id="about-email"
                name="email"
                required
                className={cn(
                  "w-full rounded-md border bg-background px-4 py-2 text-sm",
                  "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20",
                  "placeholder:text-muted-foreground"
                )}
                placeholder="your@email.com"
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="about-message" className="mb-2 block text-sm font-medium">
                {tContact("message")} <span className="text-destructive">{tContact("required")}</span>
              </label>
              <textarea
                id="about-message"
                name="message"
                required
                rows={4}
                className={cn(
                  "w-full rounded-md border bg-background px-4 py-2 text-sm resize-none",
                  "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20",
                  "placeholder:text-muted-foreground"
                )}
                placeholder={tContact("messagePlaceholder")}
              />
            </div>

            {/* Error Message */}
            {status === "error" && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={status === "submitting"}
            >
              {status === "submitting" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tContact("sending")}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {tContact("send")}
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
