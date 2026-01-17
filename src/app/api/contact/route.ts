import { NextResponse } from "next/server";

interface ContactFormData {
  name: string;
  email: string;
  subject?: string;
  photoReference?: string;
  message: string;
}

export async function POST(request: Request) {
  try {
    const data: ContactFormData = await request.json();

    // Validate required fields
    if (!data.name || !data.email || !data.message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Here you would typically:
    // 1. Send an email using a service like Resend, SendGrid, or Nodemailer
    // 2. Or save to a database
    // 3. Or forward to a form service like Formspree

    // For now, we'll log the submission and return success
    // In production, replace this with your actual email sending logic
    console.log("Contact form submission:", {
      name: data.name,
      email: data.email,
      subject: data.subject || "No subject",
      photoReference: data.photoReference || "None",
      message: data.message,
      timestamp: new Date().toISOString(),
    });

    // Example: Using Resend (uncomment and add your API key)
    // import { Resend } from 'resend';
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'Contact Form <noreply@yourdomain.com>',
    //   to: ['your@email.com'],
    //   subject: `New Contact: ${data.subject || 'Website Inquiry'}`,
    //   text: `
    //     Name: ${data.name}
    //     Email: ${data.email}
    //     Photo Reference: ${data.photoReference || 'None'}
    //
    //     Message:
    //     ${data.message}
    //   `,
    // });

    return NextResponse.json(
      { message: "Message sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
