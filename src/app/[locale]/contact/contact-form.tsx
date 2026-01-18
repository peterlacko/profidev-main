"use client";

import { useState, use } from "react";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ContactFormProps {
  searchParamsPromise: Promise<{ photo?: string }>;
}

type FormStatus = "idle" | "submitting" | "success" | "error";

export function ContactForm({ searchParamsPromise }: ContactFormProps) {
  const searchParams = use(searchParamsPromise);
  const photoRef = searchParams.photo;
  const t = useTranslations("contact.form");
  const tSuccess = useTranslations("contact.success");

  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      subject: formData.get("subject") as string,
      photoReference: formData.get("photoReference") as string,
      message: formData.get("message") as string,
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to send message");
      }

      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    }
  };

  if (status === "success") {
    return (
      <div className="py-8 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-4 text-lg font-semibold">{tSuccess("title")}</h3>
        <p className="mt-2 text-muted-foreground">
          {tSuccess("description")}
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => setStatus("idle")}
        >
          {tSuccess("sendAnother")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium">
          {t("name")} <span className="text-destructive">{t("required")}</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className={cn(
            "w-full rounded-md border bg-background px-4 py-2 text-sm",
            "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20",
            "placeholder:text-muted-foreground"
          )}
          placeholder={t("name")}
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium">
          {t("email")} <span className="text-destructive">{t("required")}</span>
        </label>
        <input
          type="email"
          id="email"
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

      {/* Subject */}
      <div>
        <label htmlFor="subject" className="mb-2 block text-sm font-medium">
          {t("subject")}
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          className={cn(
            "w-full rounded-md border bg-background px-4 py-2 text-sm",
            "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20",
            "placeholder:text-muted-foreground"
          )}
          placeholder={t("subjectPlaceholder")}
        />
      </div>

      {/* Photo Reference */}
      <div>
        <label
          htmlFor="photoReference"
          className="mb-2 block text-sm font-medium"
        >
          {t("photoReference")}
        </label>
        <input
          type="text"
          id="photoReference"
          name="photoReference"
          defaultValue={photoRef || ""}
          className={cn(
            "w-full rounded-md border bg-background px-4 py-2 text-sm",
            "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20",
            "placeholder:text-muted-foreground"
          )}
          placeholder={t("photoReferencePlaceholder")}
        />
        {photoRef && (
          <p className="mt-1 text-xs text-muted-foreground">
            {t("photoReferencePrefilled")}
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="mb-2 block text-sm font-medium">
          {t("message")} <span className="text-destructive">{t("required")}</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className={cn(
            "w-full rounded-md border bg-background px-4 py-2 text-sm resize-none",
            "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20",
            "placeholder:text-muted-foreground"
          )}
          placeholder={t("messagePlaceholder")}
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
            {t("sending")}
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            {t("send")}
          </>
        )}
      </Button>
    </form>
  );
}
