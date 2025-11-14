import { prisma } from "./prisma"
import type { Invoice, Client } from "@prisma/client"

export const invoiceStorage = {
  // Get all invoices for a user with client data
  getAllByUserId: async (userId: string): Promise<any[]> => {
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      include: {
        client: true,
      },
      orderBy: { createdAt: "desc" },
    })

    // Transform to include client fields at the invoice level for backwards compatibility
    return invoices.map((invoice) => ({
      ...invoice,
      clientName: invoice.client.name,
      clientEmail: invoice.client.email,
      clientPhone: invoice.client.phone || "",
      clientAddress: invoice.client.address || "",
      clientGSTID: invoice.client.gstId || "",
      date: invoice.date.toISOString().split("T")[0],
      servicePeriodFrom:
        invoice.servicePeriodFrom?.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) || "",
      servicePeriodTo: invoice.servicePeriodTo?.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) || "",
    }))
  },

  // Get invoice by ID
  getById: async (id: string): Promise<Invoice | null> => {
    return prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        booking: true,
      },
    })
  },

  // Get invoice by invoice number
  getByInvoiceNo: async (invoiceNo: string): Promise<Invoice | null> => {
    return prisma.invoice.findUnique({
      where: { invoiceNo },
      include: {
        client: true,
      },
    })
  },

  // Create invoice
  create: async (userId: string, data: any): Promise<any> => {
    const invoice = await prisma.invoice.create({
      data: {
        ...data,
        userId,
      },
      include: {
        client: true,
      },
    })

    // Transform to include client fields at the invoice level for backwards compatibility
    return {
      ...invoice,
      clientName: invoice.client.name,
      clientEmail: invoice.client.email,
      clientPhone: invoice.client.phone || "",
      clientAddress: invoice.client.address || "",
      clientGSTID: invoice.client.gstId || "",
      date: invoice.date.toISOString().split("T")[0],
      servicePeriodFrom:
        invoice.servicePeriodFrom?.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) || "",
      servicePeriodTo: invoice.servicePeriodTo?.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) || "",
    }
  },

  // Update invoice
  update: async (id: string, data: any): Promise<any> => {
    // Extract only valid invoice fields and exclude client object and system fields
    const {
      id: _,
      client,
      clientName,
      clientEmail,
      clientPhone,
      clientAddress,
      clientGSTID,
      createdAt,
      updatedAt,
      ...validData
    } = data

    // Convert date string to Date object if needed
    if (validData.date && typeof validData.date === "string") {
      validData.date = new Date(validData.date)
    }
    if (validData.dueDate && typeof validData.dueDate === "string") {
      validData.dueDate = new Date(validData.dueDate)
    }
    if (validData.servicePeriodFrom && typeof validData.servicePeriodFrom === "string") {
      validData.servicePeriodFrom = new Date(validData.servicePeriodFrom)
    }
    if (validData.servicePeriodTo && typeof validData.servicePeriodTo === "string") {
      validData.servicePeriodTo = new Date(validData.servicePeriodTo)
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: validData,
      include: { client: true },
    })

    // Transform to include client fields at the invoice level for backwards compatibility
    return {
      ...updated,
      clientName: updated.client.name,
      clientEmail: updated.client.email,
      clientPhone: updated.client.phone || "",
      clientAddress: updated.client.address || "",
      clientGSTID: updated.client.gstId || "",
      date: updated.date.toISOString().split("T")[0],
      servicePeriodFrom:
        updated.servicePeriodFrom?.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) || "",
      servicePeriodTo:
        updated.servicePeriodTo?.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) || "",
    }
  },

  // Update invoice status
  updateStatus: async (id: string, status: string): Promise<Invoice> => {
    return prisma.invoice.update({
      where: { id },
      data: { status },
    })
  },

  // Delete invoice
  delete: async (id: string): Promise<Invoice> => {
    return prisma.invoice.delete({
      where: { id },
    })
  },

  // Duplicate invoice
  duplicate: async (id: string): Promise<any> => {
    const original = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
      },
    })

    if (!original) {
      throw new Error("Invoice not found")
    }

    // Get only the invoice fields we need (exclude id, client, invoiceNo, createdAt, updatedAt, bookingId)
    const invoiceDataToCopy = {
      clientId: original.clientId,
      date: original.date,
      dueDate: original.dueDate,
      amount: original.amount,
      taxRate: original.taxRate,
      discount: original.discount,
      cgstRate: original.cgstRate,
      sgstRate: original.sgstRate,
      serviceDescription: original.serviceDescription,
      servicePeriodFrom: original.servicePeriodFrom,
      servicePeriodTo: original.servicePeriodTo,
      hours: original.hours,
      gstNumber: original.gstNumber,
      sacHsn: original.sacHsn,
      studioName: original.studioName,
      studioEmail: original.studioEmail,
      studioAddress: original.studioAddress,
      studioPhone: original.studioPhone,
      studioWebsite: original.studioWebsite,
      studioGSTNumber: original.studioGSTNumber,
      bankAccountHolder: original.bankAccountHolder,
      bankAccountNumber: original.bankAccountNumber,
      bankName: original.bankName,
      ifscCode: original.ifscCode,
      upiId: original.upiId,
      notes: original.notes,
      terms: original.terms,
      userId: original.userId,
    }

    // Generate new invoice number with timestamp to ensure uniqueness
    const timestamp = Date.now()
    const newInvoiceNo = `INV-${timestamp}-COPY`

    const duplicated = await prisma.invoice.create({
      data: {
        ...invoiceDataToCopy,
        invoiceNo: newInvoiceNo,
        status: "draft",
      },
      include: {
        client: true,
      },
    })

    // Transform to include client fields at the invoice level for backwards compatibility
    return {
      ...duplicated,
      clientName: duplicated.client.name,
      clientEmail: duplicated.client.email,
      clientPhone: duplicated.client.phone || "",
      clientAddress: duplicated.client.address || "",
      clientGSTID: duplicated.client.gstId || "",
      date: duplicated.date.toISOString().split("T")[0],
      servicePeriodFrom:
        duplicated.servicePeriodFrom?.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) || "",
      servicePeriodTo: duplicated.servicePeriodTo?.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) || "",
    }
  },

  // Get invoice statistics
  getStats: async (userId: string) => {
    const invoices = await prisma.invoice.findMany({
      where: { userId },
    })

    const totalRevenue = invoices.reduce((sum, inv) => {
      const cgst = (inv.amount * (inv.cgstRate || 0)) / 100
      const sgst = (inv.amount * (inv.sgstRate || 0)) / 100
      return sum + inv.amount + cgst + sgst - (inv.discount || 0)
    }, 0)

    const paidInvoices = invoices.filter((inv) => inv.status === "paid")
    const pendingInvoices = invoices.filter((inv) => inv.status === "draft" || inv.status === "sent")
    const overdueInvoices = invoices.filter((inv) => inv.status === "overdue")

    return {
      totalRevenue,
      totalInvoices: invoices.length,
      paidCount: paidInvoices.length,
      pendingCount: pendingInvoices.length,
      overdueCount: overdueInvoices.length,
    }
  },
}
