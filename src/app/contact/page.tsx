import type { Metadata } from "next";
import { Mail, MessageSquare, Image as ImageIcon } from "lucide-react";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch for inquiries about purchasing full-resolution photos, collaborations, or just to say hello.",
};

export default function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ photo?: string }>;
}) {
  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Get in Touch
            </h1>
            <p className="mt-4 text-muted-foreground">
              Interested in purchasing a photo or have a question? I&apos;d love to
              hear from you.
            </p>
          </div>

          {/* Info Cards */}
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-4 text-center">
              <Mail className="mx-auto h-6 w-6 text-muted-foreground" />
              <h3 className="mt-2 font-medium">Email</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Direct inquiries
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <ImageIcon className="mx-auto h-6 w-6 text-muted-foreground" />
              <h3 className="mt-2 font-medium">Photo Purchases</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Full resolution available
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <MessageSquare className="mx-auto h-6 w-6 text-muted-foreground" />
              <h3 className="mt-2 font-medium">Response Time</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Within 24-48 hours
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-lg border bg-card p-6 sm:p-8">
            <ContactForm searchParamsPromise={searchParams} />
          </div>

          {/* Additional Info */}
          <div className="mt-10 text-center text-sm text-muted-foreground">
            <p>
              <strong>Regarding photo purchases:</strong> All photos displayed
              on this site are available for purchase in full resolution without
              watermarks. Pricing depends on the intended use (personal, print,
              commercial). Please include details about your intended use in
              your message.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
