# PRP: Multi-Language Support (English/Slovak)

## Feature Overview

Add internationalization (i18n) support for English (en) and Slovak (sk) languages to the travel photography portfolio website. Include a language toggle button in the top-right corner of the header.

## Technical Context

### Current Stack
- Next.js 16 with App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui components

### Recommended Library
**next-intl** - Best i18n solution for Next.js App Router

**Documentation**:
- Getting Started: https://next-intl.dev/docs/getting-started/app-router
- Routing Setup: https://next-intl.dev/docs/routing/setup
- Navigation: https://next-intl.dev/docs/routing/navigation

## Current Codebase Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with Header/Footer
│   ├── page.tsx            # Home page (dynamic for shuffle)
│   ├── gallery/
│   │   ├── page.tsx
│   │   └── gallery-content.tsx
│   ├── about/page.tsx
│   ├── contact/
│   │   ├── page.tsx
│   │   └── contact-form.tsx
│   └── api/contact/route.ts
├── components/
│   ├── layout/
│   │   ├── header.tsx      # Navigation - add language toggle here
│   │   └── footer.tsx
│   └── photos/
│       ├── photo-grid.tsx
│       └── lightbox.tsx
├── data/
│   └── trips.json          # Photo metadata - needs localized strings
├── lib/
│   ├── utils.ts
│   └── trips.ts            # Data fetching - add locale param
└── types/
    └── index.ts            # Add LocalizedString type
```

## Implementation Blueprint

### Phase 1: Install & Configure next-intl

```bash
npm install next-intl
```

**Create `src/i18n/routing.ts`**:
```typescript
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'sk'],
  defaultLocale: 'en',
  localePrefix: 'always'
});

export type Locale = (typeof routing.locales)[number];
```

**Create `src/i18n/navigation.ts`**:
```typescript
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

**Create `src/i18n/request.ts`**:
```typescript
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
```

**Create `src/middleware.ts`**:
```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/([\\w-]+)?/gallery/(.+)']
};
```

**Update `next.config.ts`**:
```typescript
import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
```

### Phase 2: Create Translation Files

**Create `messages/en.json`**:
```json
{
  "metadata": {
    "title": "Travel Portfolio | Photography",
    "titleTemplate": "%s | Travel Portfolio",
    "description": "A personal travel photography portfolio showcasing stunning captures from around the world.",
    "siteName": "Travel Portfolio"
  },
  "navigation": {
    "home": "Home",
    "gallery": "Gallery",
    "about": "About",
    "contact": "Contact",
    "openMenu": "Open menu",
    "closeMenu": "Close menu"
  },
  "home": {
    "hero": {
      "title": "Capturing the World,",
      "titleHighlight": "One Frame at a Time",
      "description": "Travel photography that tells stories. From the peaks of Patagonia to the streets of Tokyo, explore the beauty of our world through my lens.",
      "browseGallery": "Browse Gallery",
      "aboutMe": "About Me"
    },
    "featured": {
      "title": "Featured Work",
      "description": "A selection of my favorite captures from recent travels",
      "viewAll": "View all photos"
    },
    "cta": {
      "title": "Interested in a Photo?",
      "description": "All displayed photos are available for purchase in full resolution without watermarks. Perfect for prints, personal use, or commercial projects.",
      "getInTouch": "Get in Touch"
    }
  },
  "gallery": {
    "title": "Gallery",
    "description": "Browse the complete collection of travel photography",
    "filters": "Filters",
    "country": "Country",
    "category": "Category",
    "sortBy": "Sort by",
    "date": "Date",
    "all": "All",
    "clearFilters": "Clear filters",
    "photos": "{count} photos",
    "photosFiltered": "{count} photos (filtered)",
    "noPhotos": "No photos match the selected filters."
  },
  "about": {
    "title": "About",
    "greeting": "Hello, I'm a Travel Photographer",
    "bio1": "I believe that every destination has a story waiting to be told through images. My camera is my passport to documenting the raw beauty and unique moments I encounter around the world.",
    "bio2": "From the misty peaks of Patagonia to the bustling streets of Tokyo, I seek out the extraordinary in everyday moments and the quiet beauty in grand landscapes.",
    "storyTitle": "My Story",
    "story1": "Photography found me during my first solo backpacking trip through Southeast Asia. What started as simple travel snapshots quickly evolved into a deep passion for capturing the essence of a place — its people, landscapes, and fleeting moments of beauty.",
    "story2": "Over the years, I've developed a style that emphasizes natural light, authentic moments, and the raw emotions that make travel so transformative. I don't just want to show you where I've been; I want to make you feel like you're standing right there beside me.",
    "story3": "When I'm not behind the camera, you'll find me planning the next adventure, learning about local cultures, or processing photos late into the night (fueled by too much coffee).",
    "approachTitle": "My Approach",
    "authentic": {
      "title": "Authentic Moments",
      "description": "I capture real, unposed moments that tell genuine stories. Nothing staged, everything felt."
    },
    "local": {
      "title": "Local Perspective",
      "description": "I immerse myself in local culture to find unique angles and hidden gems off the beaten path."
    },
    "passion": {
      "title": "Passion-Driven",
      "description": "Every photo is taken with love and intention. I shoot what moves me, hoping it moves you too."
    },
    "ctaText": "Want to work together or have questions about my photos?",
    "getInTouch": "Get in Touch"
  },
  "contact": {
    "title": "Get in Touch",
    "description": "Interested in purchasing a photo or have a question? I'd love to hear from you.",
    "email": "Email",
    "emailDesc": "Direct inquiries",
    "photoPurchases": "Photo Purchases",
    "photoPurchasesDesc": "Full resolution available",
    "responseTime": "Response Time",
    "responseTimeDesc": "Within 24-48 hours",
    "form": {
      "name": "Name",
      "email": "Email",
      "subject": "Subject",
      "subjectPlaceholder": "What's this about?",
      "photoReference": "Photo Reference",
      "photoReferencePlaceholder": "If requesting a specific photo, enter its name here",
      "photoReferencePrefilled": "Pre-filled from gallery selection",
      "message": "Message",
      "messagePlaceholder": "Your message... If requesting a photo, please include details about intended use (personal, print, commercial).",
      "required": "*",
      "send": "Send Message",
      "sending": "Sending..."
    },
    "success": {
      "title": "Message Sent!",
      "description": "Thank you for reaching out. I'll get back to you within 24-48 hours.",
      "sendAnother": "Send Another Message"
    },
    "purchaseInfo": "Regarding photo purchases: All photos displayed on this site are available for purchase in full resolution without watermarks. Pricing depends on the intended use (personal, print, commercial). Please include details about your intended use in your message."
  },
  "footer": {
    "tagline": "Capturing moments from around the world through the lens.",
    "quickLinks": "Quick Links",
    "aboutMe": "About Me",
    "connect": "Connect",
    "copyright": "© {year} Travel Portfolio. All rights reserved."
  },
  "lightbox": {
    "close": "Close",
    "previous": "Previous photo",
    "next": "Next photo",
    "requestFullRes": "Request Full Resolution"
  },
  "categories": {
    "mountains": "Mountains",
    "city": "City",
    "animals": "Animals",
    "nature": "Nature",
    "landscape": "Landscape",
    "culture": "Culture"
  }
}
```

**Create `messages/sk.json`** (same structure with Slovak translations):
- Use Google Translate or native speaker for accurate translations
- Key examples:
  - "Home" → "Domov"
  - "Gallery" → "Galéria"
  - "About" → "O mne"
  - "Contact" → "Kontakt"

### Phase 3: Update Data Layer

**Update `src/types/index.ts`**:
```typescript
import type { Locale } from '@/i18n/routing';

export type LocalizedString = {
  [key in Locale]: string;
};

export interface Photo {
  filename: string;
  caption: LocalizedString;  // Changed from string
  categories: PhotoCategory[];
}

export interface Trip {
  id: string;
  title: LocalizedString;    // Changed from string
  country: string;
  date: string;
  featured: boolean;
  categories: PhotoCategory[];
  photos: Photo[];
}

// PhotoWithTrip keeps resolved strings (after locale applied)
export interface PhotoWithTrip extends Omit<Photo, 'caption'> {
  caption: string;
  tripId: string;
  tripTitle: string;
  country: string;
  date: string;
  src: string;
}
```

**Update `src/data/trips.json`**:
```json
{
  "trips": [
    {
      "id": "uganda-2025",
      "title": {
        "en": "Uganda Adventure",
        "sk": "Ugandské dobrodružstvo"
      },
      "country": "Uganda",
      "date": "2025-07",
      "featured": true,
      "categories": ["mountains", "nature", "landscape", "animals"],
      "photos": [
        {
          "filename": "elephant.jpg",
          "caption": {
            "en": "Elephant in Uganda's rainforest",
            "sk": "Slon v ugandskom dažďovom pralese"
          },
          "categories": ["animals", "nature"]
        }
      ]
    }
  ]
}
```

**Update `src/lib/trips.ts`** - Add locale parameter:
```typescript
import type { Locale } from "@/i18n/routing";

function getLocalizedString(obj: LocalizedString, locale: Locale): string {
  return obj[locale] || obj['en'];
}

export function getAllPhotosWithTrip(locale: Locale): PhotoWithTrip[] {
  // ... resolve localized strings using getLocalizedString
}

export function getFeaturedPhotos(locale: Locale, shuffle = true): PhotoWithTrip[] {
  // ... resolve localized strings using getLocalizedString
}
```

### Phase 4: Create Language Switcher

**Create `src/components/layout/language-switcher.tsx`**:
```typescript
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
```

### Phase 5: Restructure to [locale] Folder

**New structure**:
```
src/app/
├── [locale]/
│   ├── layout.tsx        # Locale-aware layout with NextIntlClientProvider
│   ├── page.tsx          # Home
│   ├── gallery/
│   ├── about/
│   └── contact/
├── api/                  # Keep API routes outside [locale]
└── globals.css
```

**Create `src/app/[locale]/layout.tsx`**:
```typescript
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main>{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### Phase 6: Update All Pages

Each page needs:
1. `params: Promise<{ locale: string }>` prop
2. `setRequestLocale(locale)` call
3. `getTranslations()` or `useTranslations()` for text
4. Pass locale to trips.ts functions

**Example - Home page**:
```typescript
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getFeaturedPhotos } from "@/lib/trips";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const featuredPhotos = getFeaturedPhotos(locale as Locale);

  return (
    <div>
      <h1>{t("hero.title")}</h1>
      {/* ... */}
    </div>
  );
}
```

## Task Checklist

- [ ] Install next-intl: `npm install next-intl`
- [ ] Create `src/i18n/routing.ts`
- [ ] Create `src/i18n/navigation.ts`
- [ ] Create `src/i18n/request.ts`
- [ ] Create `src/middleware.ts`
- [ ] Update `next.config.ts` with withNextIntl
- [ ] Create `messages/en.json` with all strings
- [ ] Create `messages/sk.json` with Slovak translations
- [ ] Update `src/types/index.ts` with LocalizedString
- [ ] Update `src/data/trips.json` with localized titles/captions
- [ ] Update `src/lib/trips.ts` with locale parameter
- [ ] Create `src/components/layout/language-switcher.tsx`
- [ ] Create `src/app/[locale]/layout.tsx`
- [ ] Move & update `src/app/[locale]/page.tsx`
- [ ] Move & update `src/app/[locale]/gallery/page.tsx`
- [ ] Move & update `src/app/[locale]/gallery/gallery-content.tsx`
- [ ] Move & update `src/app/[locale]/about/page.tsx`
- [ ] Move & update `src/app/[locale]/contact/page.tsx`
- [ ] Move & update `src/app/[locale]/contact/contact-form.tsx`
- [ ] Update `src/components/layout/header.tsx` with translations + switcher
- [ ] Update `src/components/layout/footer.tsx` with translations
- [ ] Update `src/components/photos/lightbox.tsx` with translations
- [ ] Delete old page files from `src/app/`
- [ ] Run build validation
- [ ] Test both languages manually

## Validation Gates

```bash
# Type check and lint
npm run lint

# Build check
npm run build

# Expected output should show:
# Route (app)
# ├ ƒ /[locale]
# ├ ƒ /[locale]/gallery
# ├ ƒ /[locale]/about
# ├ ƒ /[locale]/contact

# Manual testing
npm run dev
# Test: http://localhost:3000/en - English version
# Test: http://localhost:3000/sk - Slovak version
# Test: Language toggle switches correctly
# Test: Navigation maintains locale
# Test: Photo captions show correct language
# Test: All pages render without errors
```

## Error Handling

**Common issues**:
1. "Cannot find module messages/xx.json" → Check file path in request.ts
2. "useTranslations must be called in client component" → Add "use client" or use getTranslations
3. "Locale not found" → Verify middleware matcher and routing config
4. "Type error on caption/title" → Ensure trips.json matches LocalizedString type

## Confidence Score: 8/10

**Strengths**:
- Clear next-intl documentation
- Well-structured existing codebase
- Straightforward pattern for text replacement

**Risks**:
- ~150 strings to translate accurately
- trips.json restructure requires careful migration
- Client/server component boundaries need attention
