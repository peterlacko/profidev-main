import type { Metadata } from "next";
import { GalleryContent } from "./gallery-content";
import { getAllPhotosWithTrip, getAllCountries, getAllCategories } from "@/lib/trips";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Browse the complete collection of travel photography. Filter by country, category, or date.",
};

export default function GalleryPage() {
  const photos = getAllPhotosWithTrip();
  const countries = getAllCountries();
  const categories = getAllCategories();

  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Gallery
          </h1>
          <p className="mt-2 text-muted-foreground">
            Browse the complete collection of travel photography
          </p>
        </div>

        {/* Gallery with filters */}
        <GalleryContent
          initialPhotos={photos}
          countries={countries}
          categories={categories}
        />
      </div>
    </div>
  );
}
