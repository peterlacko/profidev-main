# Travel Photography Portfolio

Personal travel photography portfolio built with Next.js 16, TypeScript, and Tailwind CSS v4. Features i18n support (EN/SK), dark mode, Cloudflare R2 storage, and git-based content management.

## Features

- Photo gallery with filtering by country, region, category, and date
- Fullscreen lightbox with keyboard navigation
- Responsive design with dark mode support
- Bilingual (English/Slovak) with automatic browser language detection
- Automated photo processing with watermarks
- Cloudflare R2 image storage
- Contact form for photo purchase inquiries

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **i18n**: next-intl with localStorage persistence
- **Theming**: next-themes (dark mode)
- **Image Processing**: Sharp
- **Storage**: Cloudflare R2

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
- Upload to R2

4. Edit `src/data/trips.json` to refine captions and translations
5. Add country/region translations to `messages/en.json` and `messages/sk.json`
6. Commit and deploy

## Reprocessing Photos

Update existing photos with different settings without modifying trips.json:

```bash
npm run reprocess -- <trip-name> [options]

# Examples:
npm run reprocess -- uganda-2025                          # Default settings
npm run reprocess -- uganda-2025 --quality 90 --force     # Higher quality, re-upload
npm run reprocess -- uganda-2025 --width 2560             # Larger resolution
npm run reprocess -- uganda-2025 --no-watermark           # Remove watermark
npm run reprocess -- uganda-2025 --dry-run                # Preview only
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--width <n>` | Max width | 1920 |
| `--height <n>` | Max height | 1080 |
| `--quality <n>` | JPEG quality 1-100 | 95 |
| `--watermark <s>` | Watermark text | © Peter Lacko |
| `--opacity <n>` | Watermark opacity 0-1 | 0.7 |
| `--no-watermark` | Skip watermark | - |
| `--no-upload` | Skip R2 upload | - |
| `--force` | Overwrite existing in R2 | - |
| `--dry-run` | Preview without processing | - |

## Scripts

```bash
npm run dev         # Development server
npm run build       # Production build
npm run start       # Production server
npm run lint        # ESLint

# Photo management
npm run add-trip    # Process photos and update trips.json
npm run watermark   # Watermark photos only (no upload, no JSON)
npm run reprocess   # Reprocess with custom settings (no JSON changes)
npm run r2-upload   # Upload processed photos to R2
npm run remove-trip # Remove trip from JSON and R2
```

## Project Structure

```
src/
├── app/[locale]/     # Pages (home, gallery, about, contact)
├── components/       # React components
│   ├── ui/           # shadcn/ui components
│   ├── layout/       # Header, Footer, LanguageSwitcher
│   └── photos/       # PhotoGrid, Lightbox, TripCard
├── data/trips.json   # Photo metadata
├── i18n/             # Routing and navigation config
├── lib/              # Utilities and data fetching
└── types/            # TypeScript interfaces

messages/             # i18n translations (en.json, sk.json)
public/photos/        # Processed photos by trip
scripts/              # Photo processing scripts
```

## Photo Categories

`mountains` | `city` | `animals` | `nature` | `landscape` | `culture` | `buildings` | `climbing` | `beach` | `food` | `people`

Categories are auto-detected from filenames using keywords like: mountain, city, elephant, temple, forest, etc.

## Environment Variables

For R2 uploads, set in `.env.local`:

```
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
```

## Deployment

Deployed on Vercel. Push to main branch triggers automatic deployment.
