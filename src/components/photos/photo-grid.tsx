"use client"

import Image from "next/image"
import { useState } from "react"
import type { PhotoWithTrip } from "@/types"
import { cn } from "@/lib/utils"
import { Lightbox } from "./lightbox"

interface PhotoGridProps {
  photos: PhotoWithTrip[];
  columns?: 2 | 3 | 4;
}

export function PhotoGrid({ photos, columns = 3 }: PhotoGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  }

  return (
    <>
      <div className={cn("grid gap-4", gridCols[columns])}>
        {photos.map((photo, index) => (
          <button
            key={`${photo.tripId}-${photo.filename}`}
            onClick={() => setSelectedIndex(index)}
            className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Image
              src={photo.src}
              alt={photo.caption}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
            <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/80 to-transparent p-4 transition-transform duration-300 group-hover:translate-y-0">
              <p className="text-sm font-medium text-white">{photo.caption}</p>
              <p className="text-xs text-white/70">
                {photo.tripTitle} &middot; {photo.country}
              </p>
            </div>
          </button>
        ))}
      </div>

      <Lightbox
        photos={photos}
        currentIndex={selectedIndex}
        onClose={() => setSelectedIndex(null)}
        onNavigate={setSelectedIndex}
      />
    </>
  )
}
