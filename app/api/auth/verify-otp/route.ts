import { type NextRequest, NextResponse } from "next/server"
import { userStorage } from "@/lib/users"
import { jwtUtils } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, otp } = body

    // Validate input
    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 })
    }

    // Find user
    const user = await userStorage.findByEmail(email)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify OTP
    const isValid = await userStorage.verifyOTP(user, otp)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 })
    }

    // Generate JWT token
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
    console.error("[Auth] OTP verification error:", error)
    return NextResponse.json({ error: "An error occurred during OTP verification" }, { status: 500 })
  }
}
