import type { Metadata } from "next";
import { Mail, MessageSquare, Image as ImageIcon } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactForm } from "./contact-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ photo?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("contact");

  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("title")}
            </h1>
            <p className="mt-4 text-muted-foreground">
              {t("description")}
            </p>
          </div>

          {/* Info Cards */}
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-4 text-center">
              <Mail className="mx-auto h-6 w-6 text-muted-foreground" />
              <h3 className="mt-2 font-medium">{t("email")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("emailDesc")}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <ImageIcon className="mx-auto h-6 w-6 text-muted-foreground" />
              <h3 className="mt-2 font-medium">{t("photoPurchases")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("photoPurchasesDesc")}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <MessageSquare className="mx-auto h-6 w-6 text-muted-foreground" />
              <h3 className="mt-2 font-medium">{t("responseTime")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("responseTimeDesc")}
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-lg border bg-card p-6 sm:p-8">
            <ContactForm searchParamsPromise={searchParams} />
          </div>

          {/* Additional Info */}
          <div className="mt-10 text-center text-sm text-muted-foreground">
            <p>
              <strong>{t("photoPurchases")}:</strong> {t("purchaseInfo")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
