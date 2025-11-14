import { type NextRequest, NextResponse } from "next/server"
import { bookingStorage } from "@/lib/bookings"
import { jwtUtils } from "@/lib/jwt"

// POST - Check for booking conflicts
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { eventDate, eventTime, duration } = body

    if (!eventDate || !eventTime || !duration) {
      return NextResponse.json(
        { error: "eventDate, eventTime, and duration are required" },
        { status: 400 }
      )
    }

    const { hasConflict, conflictingBookings } = await bookingStorage.checkConflict(
      payload.userId,
      new Date(eventDate),
      eventTime,
      duration
    )

    return NextResponse.json(
      {
        hasConflict,
        conflictingBookings: conflictingBookings.map((b) => ({
          id: b.id,
          eventName: b.eventName,
          eventTime: b.eventTime,
          duration: b.duration,
          clientName: b.client?.name || "Unknown",
        })),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[API] Check booking conflict error:", error)
    const message = error instanceof Error ? error.message : "Failed to check booking conflict"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET - Get available time slots for a date
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

    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const duration = searchParams.get("duration") || "1"

    if (!date) {
      return NextResponse.json({ error: "date parameter is required" }, { status: 400 })
    }

    const availableSlots = await bookingStorage.getAvailableSlots(
      payload.userId,
      new Date(date),
      Number.parseInt(duration)
    )

    return NextResponse.json({ availableSlots }, { status: 200 })
  } catch (error) {
    console.error("[API] Get available slots error:", error)
    const message = error instanceof Error ? error.message : "Failed to get available slots"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
