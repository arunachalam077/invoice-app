import { type NextRequest, NextResponse } from "next/server"
import { clientStorage } from "@/lib/clients"
import { jwtUtils } from "@/lib/jwt"

// GET - Get all clients for the authenticated user
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

    const clients = await clientStorage.getAllByUserId(payload.userId)

    return NextResponse.json({ clients }, { status: 200 })
  } catch (error) {
    console.error("[API] Get clients error:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}

// POST - Create a new client or return existing one by email
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

    // Check if client already exists by email
    let client = await clientStorage.getByEmail(payload.userId, body.email)

    if (!client) {
      // Create new client if doesn't exist
      client = await clientStorage.create(payload.userId, body)
    }

    return NextResponse.json({ client }, { status: 201 })
  } catch (error) {
    console.error("[API] Create client error:", error)
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
  }
}

// PUT - Update a client
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
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
    }

    const client = await clientStorage.update(id, data)

    return NextResponse.json({ client }, { status: 200 })
  } catch (error) {
    console.error("[API] Update client error:", error)
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 })
  }
}

// DELETE - Delete a client
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
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
    }

    await clientStorage.delete(id)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[API] Delete client error:", error)
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 })
  }
}
