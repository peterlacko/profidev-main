"use client"

import Image from "next/image"
import { Link } from "@/i18n/navigation"
import type { Trip } from "@/types"
import type { Locale } from "@/i18n/routing"

interface TripCardProps {
  trip: Trip
  coverSrc: string
  locale: string
}

export const TripCard = ({ trip, coverSrc, locale }: TripCardProps) => {
  const title = trip.title[locale as Locale] || trip.title.en

  return (
    <Link
      href={`/gallery/${trip.id}`}
      className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Image
        src={coverSrc}
        alt={title}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/30" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <p className="text-lg font-medium text-white">{title}</p>
        <p className="text-sm text-white/70">
          {trip.country} · {trip.photos.length} photos
        </p>
      </div>
    </Link>
  )
}
