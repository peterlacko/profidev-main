import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getFeaturedPhotos } from "@/lib/trips";
import { PhotoGrid } from "@/components/photos/photo-grid";
import { Button } from "@/components/ui/button";

export default function Home() {
  const featuredPhotos = getFeaturedPhotos();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Capturing the World,
              <br />
              <span className="text-muted-foreground">One Frame at a Time</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Travel photography that tells stories. From the peaks of Patagonia
              to the streets of Tokyo, explore the beauty of our world through
              my lens.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link href="/gallery">
                  Browse Gallery
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/about">About Me</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Photos Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Featured Work
              </h2>
              <p className="mt-2 text-muted-foreground">
                A selection of my favorite captures from recent travels
              </p>
            </div>
            <Link
              href="/gallery"
              className="hidden text-sm font-medium hover:underline sm:block"
            >
              View all photos &rarr;
            </Link>
          </div>

          <PhotoGrid photos={featuredPhotos} columns={3} />

          <div className="mt-8 text-center sm:hidden">
            <Button asChild variant="outline">
              <Link href="/gallery">View All Photos</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Interested in a Photo?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            All displayed photos are available for purchase in full resolution
            without watermarks. Perfect for prints, personal use, or commercial
            projects.
          </p>
          <Button asChild className="mt-8" size="lg">
            <Link href="/contact">Get in Touch</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
