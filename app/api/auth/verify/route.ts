import { type NextRequest, NextResponse } from "next/server"
import { jwtUtils } from "@/lib/jwt"
import { userStorage } from "@/lib/users"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = jwtUtils.verify(token)

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const user = await userStorage.findById(payload.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(
      {
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
    console.error("[Auth] Token verification error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
