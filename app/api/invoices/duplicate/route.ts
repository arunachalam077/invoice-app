import { type NextRequest, NextResponse } from "next/server"
import { invoiceStorage } from "@/lib/invoices"
import { jwtUtils } from "@/lib/jwt"

// POST - Duplicate an invoice
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
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    const duplicatedInvoice = await invoiceStorage.duplicate(id)

    return NextResponse.json({ invoice: duplicatedInvoice }, { status: 201 })
  } catch (error) {
    console.error("[API] Duplicate invoice error:", error)
    const message = error instanceof Error ? error.message : "Failed to duplicate invoice"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
