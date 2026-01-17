# Travel Photography Portfolio Website - Project Requirements Document (PRD)

## Project Overview

Build a personal travel photography portfolio website for showcasing and selling travel photos. The site should be easy to maintain, allowing photo uploads from new trips within 10 minutes.

## Technical Stack

- **Framework:** Next.js 15+ (App Router)
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Image Processing:** Sharp.js (for watermarking)
- **Hosting:** Vercel (free tier)
- **Image Storage:** Local files in `/public/photos/` (or Cloudinary free tier as alternative)
- **UI Components:** shadcn/ui

## Site Structure

### Pages Required:

1. **Home Page (`/`)** - Mosaic grid of featured travel photos
2. **Gallery Page (`/gallery`)** - All photos with filtering/categorization
3. **About Page (`/about`)** - Personal bio and story
4. **Contact Page (`/contact`)** - Contact form for inquiries and full-resolution photo purchases

## Content Management Approach

- **No CMS** - Git-based content management
- **Photo Storage:** `/public/photos/[trip-name]/`
- **Metadata:** JSON file at `/src/data/trips.json`
- **Watermarking:** Automated script that processes photos before commit

## Data Structure

### trips.json Schema:

```json
{
  "trips": [
    {
      "id": "patagonia-2024",
      "title": "Patagonia Adventure",
      "country": "Argentina",
      "date": "2024-03",
      "featured": true,
      "categories": ["mountains", "nature", "landscape"],
      "photos": [
        {
          "filename": "img1.jpg",
          "caption": "Torres del Paine at sunset",
          "categories": ["mountains", "landscape"]
        }
      ]
    }
  ]
}
```

### Photo Categories:

- Mountains
- City
- Animals
- Nature
- Landscape
- Culture
- (extensible)

## Feature Requirements

### 1. Home Page

- **Mosaic/Grid Layout** of featured photos from various trips
- Responsive grid (3-4 columns desktop, 2 mobile)
- Click photo → opens lightbox or navigates to gallery
- Minimal design - let photos shine
- Brief tagline/intro text

### 2. Gallery Page

- **All photos** displayed in grid
- **Filtering options:**
  - By country (dropdown or tags)
  - By date (chronological sort)
  - By category (mountains, city, animals, etc.)
- **Multiple active filters** allowed
- Smooth transitions when filtering
- Photo click → lightbox with:
  - Full-screen view
  - Caption
  - Navigation (prev/next)
  - "Request Full Resolution" CTA button

### 3. About Page

- Personal bio section
- Why I travel/photograph
- Photography approach/style
- Simple, clean layout with 1-2 personal photos

### 4. Contact Page

- **Contact form** with fields:
  - Name
  - Email
  - Subject (optional)
  - Message
  - Photo reference (if requesting purchase)
- Form submission via email (Vercel serverless function or form service like Formspree/Web3Forms)
- Success/error states
- Brief note about full-resolution photo purchases

### 5. Navigation

- Clean header with:
  - Logo/site name
  - Nav links (Home, Gallery, About, Contact)
  - Mobile hamburger menu
- Sticky or static (decide during implementation)

## Image Specifications

- **Display Resolution:** 1024x768px (or similar, watermarked)
- **Watermark:** Subtle, corner placement
- **Format:** JPEG (optimized)
- **Full resolution:** Available on request only (not stored in public repo)

## Watermarking Workflow

### Script: `/scripts/watermark.js`

**Purpose:** Batch process photos in a trip folder, applying watermark

**Usage:**

```bash
node scripts/watermark.js [trip-folder-name]
```

**Functionality:**

- Takes photos from `/public/photos/[trip-name]/originals/`
- Applies watermark overlay (text or logo)
- Resizes to 1024x768px (maintaining aspect ratio)
- Outputs to `/public/photos/[trip-name]/`
- Preserves originals in separate folder (not committed to git)

**Watermark Design:**

- Text: "© [Your Name] | [Website]" or logo image
- Position: Bottom-right corner
- Opacity: 70-80%
- Color: White with subtle shadow

## Content Update Workflow (10-Minute Goal)

### After Each Trip:

1. Create folder: `/public/photos/[trip-name]/originals/`
2. Copy 10-20 selected photos to originals folder
3. Run watermark script: `node scripts/watermark.js [trip-name]`
4. Add trip entry to `trips.json` with metadata
5. Commit and push to GitHub
6. Vercel auto-deploys (2 minutes)

**Total time: 5-10 minutes**

## Design Guidelines

- **Minimal aesthetic** - photography-focused
- **Color scheme:** Black/white/gray base with accent color (choose during design)
- **Typography:** Clean, readable sans-serif
- **Spacing:** Generous whitespace
- **Mobile-first:** Responsive design required
- **Performance:** Lazy loading images, optimized assets

## Non-Functional Requirements

- **Performance:** Lighthouse score 90+
- **SEO:** Basic meta tags, Open Graph images
- **Accessibility:** WCAG AA compliance
- **Browser Support:** Modern browsers (Chrome, Firefox, Safari, Edge)
- **Mobile Responsive:** All pages fully responsive

## Out of Scope (V1)

- User authentication/accounts
- Shopping cart/checkout system
- Blog/articles section
- Comments/social features
- Multi-language support

## Development Phases

### Phase 1: Setup & Core Structure

- Initialize Next.js project with Tailwind
- Set up project structure
- Create watermark script
- Set up trips.json schema
- Create basic layout and navigation

### Phase 2: Pages Implementation

- Home page with mosaic
- Gallery page with filtering
- About page
- Contact page with form

### Phase 3: Components

- Photo grid component
- Lightbox/modal component
- Filter controls component
- Contact form component

### Phase 4: Polish & Deploy

- Image optimization
- SEO meta tags
- Performance optimization
- Deploy to Vercel
- Test on devices

## Success Criteria

- ✅ All 4 pages functional
- ✅ Photo upload workflow takes <10 minutes
- ✅ Site loads quickly (<3s)
- ✅ Mobile responsive
- ✅ Contact form works
- ✅ Filtering works smoothly
- ✅ Professional appearance

## Questions/Decisions Needed

- Exact watermark design (text vs logo)
- Accent color for design
- Personal content (bio, photos for about page)
- Preferred email service for contact form

## Budget

- **Target:** €0-15/month
- **Expected:** €0/month (Vercel free tier sufficient for personal site with moderate traffic)

---

**Note for Implementation:** Start with Phase 1, create basic structure, then iterate. Focus on simplicity and maintainability over feature complexity.
