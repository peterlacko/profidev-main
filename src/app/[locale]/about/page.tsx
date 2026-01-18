import type { Metadata } from "next";
import { Camera, MapPin, Heart } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  return {
    title: t("title"),
    description: t("bio1"),
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("about");

  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            {/* Image */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted">
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                {/* Placeholder for profile image */}
                <div className="text-center">
                  <Camera className="mx-auto h-16 w-16 opacity-50" />
                  <p className="mt-4 text-sm">Profile photo placeholder</p>
                  <p className="text-xs text-muted-foreground/70">
                    Add your photo to /public/about-photo.jpg
                  </p>
                </div>
              </div>
              {/* Uncomment when you have an actual photo:
              <Image
                src="/about-photo.jpg"
                alt="Photographer portrait"
                fill
                className="object-cover"
                priority
              />
              */}
            </div>

            {/* Bio */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t("greeting")}
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                {t("bio1")}
              </p>
              <p className="mt-4 text-muted-foreground">
                {t("bio2")}
              </p>
            </div>
          </div>
        </div>

        {/* Story Section */}
        <div className="mx-auto mt-20 max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight">{t("storyTitle")}</h2>
          <div className="mt-6 space-y-4 text-muted-foreground">
            <p>{t("story1")}</p>
            <p>{t("story2")}</p>
            <p>{t("story3")}</p>
          </div>
        </div>

        {/* Values/Approach */}
        <div className="mx-auto mt-20 max-w-4xl">
          <h2 className="mb-10 text-center text-2xl font-bold tracking-tight">
            {t("approachTitle")}
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">{t("authentic.title")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("authentic.description")}
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">{t("local.title")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("local.description")}
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">{t("passion.title")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("passion.description")}
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <p className="text-muted-foreground">
            {t("ctaText")}
          </p>
          <Button asChild className="mt-4" size="lg">
            <Link href="/contact">{t("getInTouch")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
