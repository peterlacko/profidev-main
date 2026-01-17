# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Production build
npm run start    # Run production server
npm run lint     # Run ESLint
```

## Architecture

This is a Next.js 16 project using the App Router with TypeScript and Tailwind CSS v4.

### Project Structure

- `src/app/` - Next.js App Router pages and layouts
- `src/components/ui/` - Reusable UI components (shadcn/ui style)
- `src/lib/utils.ts` - Utility functions including `cn()` for class merging

### Key Patterns

**Path Alias**: Use `@/*` to import from `src/*` (e.g., `import { cn } from "@/lib/utils"`)

**UI Components**: Components in `src/components/ui/` follow shadcn/ui conventions:
- Use `cva` (class-variance-authority) for variant-based styling
- Use `cn()` utility for merging Tailwind classes
- Support `asChild` prop via Radix UI's `Slot` component

**Styling**: Tailwind CSS v4 with CSS-based theming:
- Theme variables defined in `src/app/globals.css` using CSS custom properties
- Uses `tw-animate-css` for animations
- Dark mode via `.dark` class selector
