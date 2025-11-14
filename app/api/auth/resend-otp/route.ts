import { type NextRequest, NextResponse } from "next/server"
import { userStorage } from "@/lib/users"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const user = await userStorage.findByEmail(email)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const otp = await userStorage.generateOTP(user)

    try {
      const apiKey = process.env.RESEND_API_KEY || "re_Kpt5i8k4_65bPLnPqra7uSzgAQf3uHh8L"

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: "contact@sripadastudios.com",
          to: email,
          subject: "Your new OTP",
          html: `
            <html>
              <body>
                <h1>Your New OTP</h1>
                <p>Hi ${user.name},</p>
                <p>Here is your new OTP for email verification:</p>
                <h2>${otp}</h2>
                <p>This OTP will expire in 10 minutes.</p>
              </body>
            </html>
          `,
        }),
      })

      console.log("[Auth] OTP resent to:", email)
    } catch (emailError) {
      console.error("[Auth] Failed to resend OTP email:", emailError)
      return NextResponse.json({ error: "Failed to send OTP email" }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        message: "A new OTP has been sent to your email address.",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[Auth] Resend OTP error:", error)
    return NextResponse.json({ error: "An error occurred while resending OTP" }, { status: 500 })
  }
}
