import { type NextRequest, NextResponse } from "next/server"
import { invoiceStorage } from "@/lib/invoices"
import { jwtUtils } from "@/lib/jwt"

// GET - Get all invoices for the authenticated user
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

    const invoices = await invoiceStorage.getAllByUserId(payload.userId)

    return NextResponse.json({ invoices }, { status: 200 })
  } catch (error) {
    console.error("[API] Get invoices error:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}

// POST - Create a new invoice
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

    const invoice = await invoiceStorage.create(payload.userId, body)

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error) {
    console.error("[API] Create invoice error:", error)
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
  }
}

// PUT - Update an invoice
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
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    const invoice = await invoiceStorage.update(id, data)

    return NextResponse.json({ invoice }, { status: 200 })
  } catch (error) {
    console.error("[API] Update invoice error:", error)
    const message = error instanceof Error ? error.message : "Failed to update invoice"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE - Delete an invoice
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
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    await invoiceStorage.delete(id)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[API] Delete invoice error:", error)
    const message = error instanceof Error ? error.message : "Failed to delete invoice"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
