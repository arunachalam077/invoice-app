import { type NextRequest, NextResponse } from "next/server"
import { userStorage } from "@/lib/users"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, studio } = body

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await userStorage.findByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Create user
    const user = await userStorage.create(email, password, name, studio)

    // Generate OTP
    const otp = await userStorage.generateOTP(user)

    // Send OTP via email
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
          subject: "Verify your email - OTP",
          html: `
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: #216974; color: white; padding: 20px; text-align: center; }
                  .content { padding: 30px 20px; background: #f9f9f9; }
                  .otp { font-size: 32px; font-weight: bold; color: #216974; text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; letter-spacing: 5px; }
                  .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Welcome to Sripada Studios!</h1>
                  </div>
                  <div class="content">
                    <p>Hi ${name},</p>
                    <p>Thank you for signing up! Please use the following OTP to verify your email address:</p>
                    <div class="otp">${otp}</div>
                    <p>This OTP will expire in 10 minutes.</p>
                    <p>If you did not create an account, please ignore this email.</p>
                  </div>
                  <div class="footer">
                    <p>Copyright ${new Date().getFullYear()} Sripada Studios. All rights reserved.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        }),
      })

      console.log("[Auth] OTP sent to:", email)
    } catch (emailError) {
      console.error("[Auth] Failed to send OTP email:", emailError)
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account created! Please check your email for the OTP to verify your account.",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[Auth] Signup error:", error)
    return NextResponse.json({ error: "An error occurred during signup" }, { status: 500 })
  }
}
