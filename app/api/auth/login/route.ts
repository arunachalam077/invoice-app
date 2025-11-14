import { type NextRequest, NextResponse } from "next/server"
import { userStorage } from "@/lib/users"
import { jwtUtils } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = await userStorage.findByEmail(email)
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const isValidPassword = await userStorage.verifyPassword(user, password)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    if (!user.emailVerified) {
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
            subject: "Verify your email - OTP",
            html: `
              <html>
                <body>
                  <h1>Email Verification Required</h1>
                  <p>Hi ${user.name},</p>
                  <p>Please verify your email address to continue. Use the following OTP:</p>
                  <h2>${otp}</h2>
                  <p>This OTP will expire in 10 minutes.</p>
                </body>
              </html>
            `,
          }),
        })
      } catch (emailError) {
        console.error("[Auth] Failed to send OTP email:", emailError)
      }

      return NextResponse.json(
        {
          requiresOTP: true,
          message: "Please verify your email. An OTP has been sent to your email address.",
        },
        { status: 200 }
      )
    }

    const token = jwtUtils.sign({
      userId: user.id,
      email: user.email,
    })

    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          studio: user.studio,
          emailVerified: user.emailVerified,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[Auth] Login error:", error)
    return NextResponse.json({ error: "An error occurred during login" }, { status: 500 })
  }
}
