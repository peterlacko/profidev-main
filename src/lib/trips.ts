import tripsData from "@/data/trips.json"
import type { Trip, TripsData, PhotoWithTrip, PhotoCategory, LocalizedString } from "@/types"
import type { Locale } from "@/i18n/routing"

const data = tripsData as TripsData

/** Fisher-Yates shuffle algorithm */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function getLocalizedString(obj: LocalizedString, locale: Locale): string {
  return obj[locale] || obj['en']
}

export function getAllTrips(): Trip[] {
  return data.trips
}

export function getFeaturedTrips(): Trip[] {
  return data.trips.filter((trip) => trip.featured)
}

export function getTripById(id: string): Trip | undefined {
  return data.trips.find((trip) => trip.id === id)
}

export function getAllPhotosWithTrip(locale: Locale): PhotoWithTrip[] {
  const photos: PhotoWithTrip[] = []

  for (const trip of data.trips) {
    for (const photo of trip.photos) {
      photos.push({
        filename: photo.filename,
        categories: photo.categories,
        caption: getLocalizedString(photo.caption, locale),
        tripId: trip.id,
        tripTitle: getLocalizedString(trip.title, locale),
        country: trip.country,
        date: trip.date,
        src: `/photos/${trip.id}/${photo.filename}`,
      })
    }
  }

  return photos
}

export function getFeaturedPhotos(locale: Locale, shuffle = true): PhotoWithTrip[] {
  const photos: PhotoWithTrip[] = []

  for (const trip of data.trips.filter((t) => t.featured)) {
    for (const photo of trip.photos) {
      photos.push({
        filename: photo.filename,
        categories: photo.categories,
        caption: getLocalizedString(photo.caption, locale),
        tripId: trip.id,
        tripTitle: getLocalizedString(trip.title, locale),
        country: trip.country,
        date: trip.date,
        src: `/photos/${trip.id}/${photo.filename}`,
      })
    }
  }

  return shuffle ? shuffleArray(photos) : photos
}

export function getPhotosByCategory(locale: Locale, category: PhotoCategory): PhotoWithTrip[] {
  return getAllPhotosWithTrip(locale).filter((photo) =>
    photo.categories.includes(category)
  )
}

export function getPhotosByCountry(locale: Locale, country: string): PhotoWithTrip[] {
  return getAllPhotosWithTrip(locale).filter((photo) => photo.country === country)
}

export function getAllCountries(): string[] {
  const countries = new Set<string>()
  for (const trip of data.trips) {
    countries.add(trip.country)
  }
  return Array.from(countries).sort()
}

export function getAllCategories(): PhotoCategory[] {
  const categories = new Set<PhotoCategory>()
  for (const trip of data.trips) {
    for (const cat of trip.categories) {
      categories.add(cat)
    }
    for (const photo of trip.photos) {
      for (const cat of photo.categories) {
        categories.add(cat)
      }
    }
  }
  return Array.from(categories).sort()
}

export function filterPhotos(
  photos: PhotoWithTrip[],
  filters: {
    country?: string;
    category?: PhotoCategory;
    sortBy?: "date" | "country";
  }
): PhotoWithTrip[] {
  let filtered = [...photos]

  if (filters.country) {
    filtered = filtered.filter((p) => p.country === filters.country)
  }

  if (filters.category) {
    filtered = filtered.filter((p) => p.categories.includes(filters.category!))
  }

  if (filters.sortBy === "date") {
    filtered.sort((a, b) => b.date.localeCompare(a.date))
  } else if (filters.sortBy === "country") {
    filtered.sort((a, b) => a.country.localeCompare(b.country))
  }

  return filtered
}
