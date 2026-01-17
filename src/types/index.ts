export interface Photo {
  filename: string;
  caption: string;
  categories: PhotoCategory[];
}

export interface Trip {
  id: string;
  title: string;
  country: string;
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

export interface PhotoWithTrip extends Photo {
  tripId: string;
  tripTitle: string;
  country: string;
  date: string;
  src: string;
}
