"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const newLocale: Locale = locale === "en" ? "sk" : "en";
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      className="gap-1 px-2 font-medium"
      aria-label={`Switch to ${locale === "en" ? "Slovak" : "English"}`}
    >
      <span className={cn(locale === "en" ? "text-foreground" : "text-muted-foreground")}>
        EN
      </span>
      <span className="text-muted-foreground">/</span>
      <span className={cn(locale === "sk" ? "text-foreground" : "text-muted-foreground")}>
        SK
      </span>
    </Button>
  );
}
