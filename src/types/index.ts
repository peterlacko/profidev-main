import type { Locale } from '@/i18n/routing'

export type LocalizedString = {
  [key in Locale]: string;
};

export interface Photo {
  filename: string;
  caption: LocalizedString;
  categories: PhotoCategory[];
}

export interface Trip {
  id: string;
  title: LocalizedString;
  country: string;
  region?: string;
  date: string;
  featured: boolean;
  categories: PhotoCategory[];
  photos: Photo[];
}

export interface TripsData {
  trips: Trip[];
}

export type PhotoCategory =
  | "mountains"
  | "city"
  | "animals"
  | "nature"
  | "landscape"
  | "culture";

export interface PhotoWithTrip extends Omit<Photo, 'caption'> {
  caption: string;
  tripId: string;
  tripTitle: string;
  country: string;
  region?: string;
  date: string;
  src: string;
}
