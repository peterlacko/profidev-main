# Travel Photography Portfolio

Personal travel photography portfolio built with Next.js 16, TypeScript, and Tailwind CSS v4. Features i18n support (EN/SK), dark mode, and git-based content management.

## Features

- Photo gallery with filtering by country, category, and date
- Fullscreen lightbox with keyboard navigation
- Responsive design with dark mode support
- Bilingual (English/Slovak) with next-intl
- Automated photo processing with watermarks
- Contact form

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **i18n**: next-intl
- **Theming**: next-themes (dark mode)
- **Image Processing**: Sharp

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Adding Photos

1. Create folder: `public/photos/[trip-name]/originals/`
2. Add photos with descriptive filenames (e.g., `mountain-sunset.jpg`, `elephant.jpg`)
3. Run the add-trip script:

```bash
npm run add-trip <trip-name> --country <country> [--region <region>] [--date <YYYY-MM>]

# Examples:
npm run add-trip svalbard-2024 --country Norway --region Svalbard --date 2024-06
npm run add-trip peru-2024 --country Peru --date 2024-03
```

This will:
- Process images with watermarks (resize to 1920px max)
- Generate entries in `src/data/trips.json`
- Auto-detect categories from filenames

4. Edit `src/data/trips.json` to refine captions and translations
5. Commit and deploy

## Scripts

```bash
npm run dev       # Development server
npm run build     # Production build
npm run start     # Production server
npm run lint      # ESLint
npm run add-trip  # Process photos and update trips.json
npm run watermark # Watermark photos only
```

## Project Structure

```
src/
├── app/[locale]/     # Pages (home, gallery, about, contact)
├── components/       # React components
│   ├── ui/           # shadcn/ui components
│   ├── layout/       # Header, Footer, ThemeToggle
│   └── photos/       # PhotoGrid, Lightbox
├── data/trips.json   # Photo metadata
├── lib/              # Utilities and data fetching
└── types/            # TypeScript interfaces

public/photos/        # Processed photos by trip
messages/             # i18n translations (en.json, sk.json)
scripts/              # Photo processing scripts
```

## Photo Categories

`mountains` | `city` | `animals` | `nature` | `landscape` | `culture`

Categories are auto-detected from filenames using keywords like: mountain, city, elephant, temple, forest, etc.

## Deployment

Deployed on Vercel. Push to main branch triggers automatic deployment.
