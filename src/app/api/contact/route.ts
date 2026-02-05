import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface ContactFormData {
  name: string
  email: string
  subject?: string
  photoReference?: string
  message: string
}

export async function POST(request: Request) {
  try {
    const data: ContactFormData = await request.json()

    if (!data.name || !data.email || !data.message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    const { error } = await resend.emails.send({
      from: "Contact Form <noreply@profidev.sk>",
      to: ["info@profidev.sk"],
      replyTo: data.email,
      subject: `Contact: ${data.subject || "Website Inquiry"}`,
      text: `Name: ${data.name}
Email: ${data.email}
Photo Reference: ${data.photoReference || "None"}

Message:
${data.message}`,
    })

    if (error) {
      console.error("Resend error:", error)
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "Message sent successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}
