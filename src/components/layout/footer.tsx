"use client";

import { Camera, Instagram, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("navigation");

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Camera className="h-5 w-5" />
              <span>Travel Portfolio</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {t("tagline")}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t("quickLinks")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/gallery" className="hover:text-foreground">
                  {tNav("gallery")}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-foreground">
                  {t("aboutMe")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground">
                  {tNav("contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t("connect")}</h3>
            <div className="flex gap-4">
              <a
                href="mailto:hello@example.com"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t pt-6 text-center text-sm text-muted-foreground">
          <p>
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
