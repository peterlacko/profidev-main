import type { Metadata } from "next";
import Link from "next/link";
import { Camera, MapPin, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn more about the photographer behind the lens. Discover my story, approach, and passion for travel photography.",
};

export default function AboutPage() {
  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            {/* Image */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted">
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                {/* Placeholder for profile image */}
                <div className="text-center">
                  <Camera className="mx-auto h-16 w-16 opacity-50" />
                  <p className="mt-4 text-sm">Profile photo placeholder</p>
                  <p className="text-xs text-muted-foreground/70">
                    Add your photo to /public/about-photo.jpg
                  </p>
                </div>
              </div>
              {/* Uncomment when you have an actual photo:
              <Image
                src="/about-photo.jpg"
                alt="Photographer portrait"
                fill
                className="object-cover"
                priority
              />
              */}
            </div>

            {/* Bio */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Hello, I&apos;m a Travel Photographer
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                I believe that every destination has a story waiting to be told
                through images. My camera is my passport to documenting the raw
                beauty and unique moments I encounter around the world.
              </p>
              <p className="mt-4 text-muted-foreground">
                From the misty peaks of Patagonia to the bustling streets of
                Tokyo, I seek out the extraordinary in everyday moments and the
                quiet beauty in grand landscapes.
              </p>
            </div>
          </div>
        </div>

        {/* Story Section */}
        <div className="mx-auto mt-20 max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight">My Story</h2>
          <div className="mt-6 space-y-4 text-muted-foreground">
            <p>
              Photography found me during my first solo backpacking trip through
              Southeast Asia. What started as simple travel snapshots quickly
              evolved into a deep passion for capturing the essence of a place —
              its people, landscapes, and fleeting moments of beauty.
            </p>
            <p>
              Over the years, I&apos;ve developed a style that emphasizes natural
              light, authentic moments, and the raw emotions that make travel so
              transformative. I don&apos;t just want to show you where I&apos;ve been; I
              want to make you feel like you&apos;re standing right there beside me.
            </p>
            <p>
              When I&apos;m not behind the camera, you&apos;ll find me planning the next
              adventure, learning about local cultures, or processing photos
              late into the night (fueled by too much coffee).
            </p>
          </div>
        </div>

        {/* Values/Approach */}
        <div className="mx-auto mt-20 max-w-4xl">
          <h2 className="mb-10 text-center text-2xl font-bold tracking-tight">
            My Approach
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Authentic Moments</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                I capture real, unposed moments that tell genuine stories.
                Nothing staged, everything felt.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Local Perspective</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                I immerse myself in local culture to find unique angles and
                hidden gems off the beaten path.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Passion-Driven</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Every photo is taken with love and intention. I shoot what moves
                me, hoping it moves you too.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <p className="text-muted-foreground">
            Want to work together or have questions about my photos?
          </p>
          <Button asChild className="mt-4" size="lg">
            <Link href="/contact">Get in Touch</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
