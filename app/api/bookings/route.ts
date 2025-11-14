import { type NextRequest, NextResponse } from "next/server"
import { bookingStorage } from "@/lib/bookings"
import { jwtUtils } from "@/lib/jwt"

// GET - Get all bookings for the authenticated user
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

    const bookings = await bookingStorage.getAllByUserId(payload.userId)

    return NextResponse.json({ bookings }, { status: 200 })
  } catch (error) {
    console.error("[API] Get bookings error:", error)
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
  }
}

// POST - Create a new booking
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

    const booking = await bookingStorage.create(payload.userId, body)

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error("[API] Create booking error:", error)
    const message = error instanceof Error ? error.message : "Failed to create booking"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PUT - Update a booking
export async function PUT(request: NextRequest) {
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
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 })
    }

    const booking = await bookingStorage.update(id, data)

    return NextResponse.json({ booking }, { status: 200 })
  } catch (error) {
    console.error("[API] Update booking error:", error)
    const message = error instanceof Error ? error.message : "Failed to update booking"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE - Delete a booking
export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 })
    }

    await bookingStorage.delete(id)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[API] Delete booking error:", error)
    const message = error instanceof Error ? error.message : "Failed to delete booking"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
