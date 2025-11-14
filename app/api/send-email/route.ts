import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, html, from } = body

    const apiKey = process.env.RESEND_API_KEY || "re_Kpt5i8k4_65bPLnPqra7uSzgAQf3uHh8L"

    if (!apiKey) {
      const setupMessage =
        "Email service not configured. Please add RESEND_API_KEY to your project's environment variables. Visit https://resend.com to get your API key."
      console.error("[v0] RESEND_API_KEY is missing:", setupMessage)
      return NextResponse.json(
        {
          success: false,
          error: "Email service not configured",
          message: setupMessage,
        },
        { status: 400 },
      )
    }

    const fromEmail = from || "contact@sripadastudios.com"

    console.log("[v0] Attempting to send email via Resend:", { to, subject, from: fromEmail })

    // Send email via Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: to,
        subject: subject,
        html: html,
      }),
    })

    const result = await response.json()

    console.log("[v0] Resend API response status:", response.status)
    console.log("[v0] Resend API response:", result)

    if (!response.ok) {
      console.error("[v0] Resend API error:", result)
      return NextResponse.json(
        { success: false, error: result.message || "Failed to send email" },
        { status: response.status },
      )
    }

    console.log("[v0] Email sent successfully:", {
      to,
      subject,
      messageId: result.id,
    })

    return NextResponse.json(
      {
        success: true,
        message: `Email sent to ${to}`,
        messageId: result.id,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Email API error:", error)
    return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 })
  }
}
