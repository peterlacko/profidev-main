# CLAUDE.md
Always be extremely concise. Sacrifice grammar for the sake of concision.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A personal travel photography portfolio website for showcasing and selling travel photos. Git-based content management with no CMS required. Multilingual support (English/Slovak).

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Production build
npm run start    # Run production server
npm run lint     # Run ESLint

# Photo processing
npm run add-trip <trip-name> --country <country> [--region <region>] [--date <YYYY-MM>]
npm run watermark <trip-name>                  # Process photos with watermark only
npm run reprocess -- <trip-name> [options]     # Reprocess photos (watermark/resize/upload)
npm run r2-upload <trip-name>                  # Upload processed photos to R2
npm run remove-trip <trip-name>                # Remove trip from trips.json and R2

# Reprocess options
npm run reprocess -- <trip> --width 2560 --height 1440  # Custom resolution
npm run reprocess -- <trip> --quality 85                 # Custom JPEG quality
npm run reprocess -- <trip> --no-watermark --force       # No watermark, force re-upload
npm run reprocess -- <trip> --dry-run                    # Preview without processing
```

## Architecture

This is a Next.js 16 project using the App Router with TypeScript and Tailwind CSS v4. Uses next-intl for i18n.

### Project Structure

```
src/
├── app/
│   ├── [locale]/             # Locale-prefixed routes (/en/..., /sk/...)
│   │   ├── page.tsx          # Home page - featured photos mosaic
│   │   ├── gallery/          # Gallery page with filtering
│   │   ├── about/            # About page - bio and story
│   │   └── contact/          # Contact page with form
│   └── api/contact/          # Contact form API route
├── components/
│   ├── ui/                   # shadcn/ui components (button, card, dialog)
│   ├── layout/               # Header, Footer, LanguageSwitcher
│   ├── photos/               # PhotoGrid, Lightbox, TripCard
│   ├── locale-detector.tsx   # Browser language detection + localStorage persistence
│   └── theme-provider.tsx    # Dark mode provider
├── data/
│   └── trips.json            # Photo metadata (trips and photos)
├── i18n/
│   ├── routing.ts            # Locale config (en, sk)
│   ├── navigation.ts         # Locale-aware Link, useRouter, usePathname
│   └── request.ts            # Server-side message loading
├── lib/
│   ├── utils.ts              # cn() utility for class merging
│   └── trips.ts              # Data fetching and filtering functions
└── types/
    └── index.ts              # TypeScript interfaces (Trip, Photo, PhotoCategory)

messages/
├── en.json                   # English translations
└── sk.json                   # Slovak translations

public/
└── photos/
    └── [trip-name]/          # Watermarked photos for display
        └── originals/        # Original photos (gitignored)

scripts/
├── add-trip.js               # Add new trip with auto-generated entries
├── watermark.js              # Batch watermark and resize photos
├── reprocess-photos.js       # Reprocess with custom settings (no trips.json changes)
├── r2-upload.js              # Upload to Cloudflare R2
├── remove-trip.js            # Remove trip from JSON and R2
└── generate-placeholders.js  # Create placeholder images for dev
```

### Data Structure

Photos are managed via `src/data/trips.json`:

```json
{
  "trips": [
    {
      "id": "trip-id",
      "title": { "en": "Trip Title", "sk": "Názov výletu" },
      "country": "Country",
      "region": "Region",
      "date": "YYYY-MM",
      "featured": true,
      "categories": ["mountains", "nature"],
      "photos": [
        {
          "filename": "photo.jpg",
          "caption": { "en": "Photo caption", "sk": "Popis fotky" },
          "categories": ["mountains", "landscape"]
        }
      ]
    }
  ]
}
```

**Photo Categories**: mountains, city, animals, nature, landscape, culture, buildings, climbing, beach, food, people

### Translations

Translations in `messages/*.json`:
- UI text: navigation, buttons, labels
- Categories: `categories.mountains`, `categories.city`, etc.
- Countries: `countries.Uganda`, `countries.Thailand`, etc.
- Regions: `regions.Svalbard`, etc.

When adding new countries/regions, add translations to both message files.

### Adding New Photos Workflow

1. Create folder: `public/photos/[trip-name]/originals/`
2. Copy photos with descriptive names (e.g., `mountain-sunset.jpg`, `elephant.jpg`)
3. Run: `npm run add-trip <trip-name> --country <country> [--region <region>] [--date <YYYY-MM>]`
   - Processes images with watermark
   - Auto-generates trips.json entries from filenames
   - Categories auto-detected from keywords (mountain, city, animal, temple, etc.)
   - Region is optional (e.g., Svalbard within Norway)
4. Edit `src/data/trips.json` to refine captions and Slovak translations
5. Add country/region translations to `messages/en.json` and `messages/sk.json` if new
6. Commit and push (Vercel auto-deploys)

### Reprocessing Existing Photos

Use `npm run reprocess` to update photos without modifying trips.json:

```bash
npm run reprocess -- uganda-2025 --quality 90 --force  # Higher quality, re-upload
npm run reprocess -- uganda-2025 --no-watermark        # Remove watermark
npm run reprocess -- uganda-2025 --width 2560          # Larger resolution
```

### Key Patterns

**Path Alias**: Use `@/*` to import from `src/*` (e.g., `import { cn } from "@/lib/utils"`)

- prefer arrow functions

**UI Components**: Components in `src/components/ui/` follow shadcn/ui conventions:
- Use `cva` (class-variance-authority) for variant-based styling
- Use `cn()` utility for merging Tailwind classes
- Support `asChild` prop via Radix UI's `Slot` component
- React components and files exporting react components start with capital letter

**Styling**: Tailwind CSS v4 with CSS-based theming:
- Theme variables defined in `src/app/globals.css` using CSS custom properties
- Uses `tw-animate-css` for animations
- Dark mode via `.dark` class selector

**i18n**: next-intl with locale prefix routing:
- All routes prefixed: `/en/gallery`, `/sk/gallery`
- Use `useTranslations("namespace")` in client components
- Use `getTranslations("namespace")` in server components
- Browser language auto-detected on first visit, saved to localStorage

**Data Fetching**: Use functions from `src/lib/trips.ts`:
- `getAllPhotosWithTrip()` - All photos with trip metadata
- `getFeaturedPhotos()` - Photos from featured trips
- `filterPhotos()` - Filter by country, category, sort by date

### Pages

| Route | Description |
|-------|-------------|
| `/[locale]` | Home - Hero section + featured photos grid |
| `/[locale]/gallery` | All photos with country/category/date filters |
| `/[locale]/gallery/[tripId]` | Individual trip photos |
| `/[locale]/about` | Bio, story, and photography approach |
| `/[locale]/contact` | Contact form for inquiries and photo purchases |

### Components

- **PhotoGrid** - Responsive photo grid with hover effects, opens Lightbox on click
- **Lightbox** - Full-screen modal with caption, prev/next navigation, keyboard support
- **TripCard** - Trip preview card with cover image
- **Header** - Sticky nav with mobile hamburger menu, language switcher
- **Footer** - Quick links and social icons
- **LocaleDetector** - Auto-detects browser language, persists preference
- **LanguageSwitcher** - EN/SK toggle button
