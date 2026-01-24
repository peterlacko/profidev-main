# CLAUDE.md
Always be extremely concise. Sacrifice grammar for the sake of concision.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A personal travel photography portfolio website for showcasing and selling travel photos. Git-based content management with no CMS required.

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Production build
npm run start    # Run production server
npm run lint     # Run ESLint

# Photo processing
node scripts/watermark.js [trip-name]       # Process photos with watermark
node scripts/generate-placeholders.js       # Generate dev placeholder images
```

## Architecture

This is a Next.js 16 project using the App Router with TypeScript and Tailwind CSS v4.

### Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home page - featured photos mosaic
│   ├── gallery/              # Gallery page with filtering
│   ├── about/                # About page - bio and story
│   ├── contact/              # Contact page with form
│   └── api/contact/          # Contact form API route
├── components/
│   ├── ui/                   # shadcn/ui components (button, card, dialog)
│   ├── layout/               # Header and Footer
│   └── photos/               # PhotoGrid and Lightbox components
├── data/
│   └── trips.json            # Photo metadata (trips and photos)
├── lib/
│   ├── utils.ts              # cn() utility for class merging
│   └── trips.ts              # Data fetching and filtering functions
└── types/
    └── index.ts              # TypeScript interfaces (Trip, Photo, PhotoCategory)

public/
└── photos/
    └── [trip-name]/          # Watermarked photos for display
        └── originals/        # Original photos (gitignored)

scripts/
├── watermark.js              # Batch watermark and resize photos
└── generate-placeholders.js  # Create placeholder images for dev
```

### Data Structure

Photos are managed via `src/data/trips.json`:

```json
{
  "trips": [
    {
      "id": "trip-id",
      "title": "Trip Title",
      "country": "Country",
      "date": "YYYY-MM",
      "featured": true,
      "categories": ["mountains", "nature"],
      "photos": [
        {
          "filename": "photo.jpg",
          "caption": "Photo caption",
          "categories": ["mountains", "landscape"]
        }
      ]
    }
  ]
}
```

**Photo Categories**: mountains, city, animals, nature, landscape, culture

### Adding New Photos Workflow

1. Create folder: `public/photos/[trip-name]/originals/`
2. Copy selected photos to originals folder
3. Run: `node scripts/watermark.js [trip-name]`
4. Add trip entry to `src/data/trips.json`
5. Commit and push (Vercel auto-deploys)

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

**Data Fetching**: Use functions from `src/lib/trips.ts`:
- `getAllPhotosWithTrip()` - All photos with trip metadata
- `getFeaturedPhotos()` - Photos from featured trips
- `filterPhotos()` - Filter by country, category, sort by date

### Pages

| Route | Description |
|-------|-------------|
| `/` | Home - Hero section + featured photos grid |
| `/gallery` | All photos with country/category/date filters |
| `/about` | Bio, story, and photography approach |
| `/contact` | Contact form for inquiries and photo purchases |

### Components

- **PhotoGrid** - Responsive photo grid with hover effects, opens Lightbox on click
- **Lightbox** - Full-screen modal with caption, prev/next navigation, keyboard support
- **Header** - Sticky nav with mobile hamburger menu
- **Footer** - Quick links and social icons
