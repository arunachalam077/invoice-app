"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { GSTInvoiceData } from "@/components/professional-gst-invoice"

interface InvoiceContextType {
  invoices: GSTInvoiceData[]
  addInvoice: (invoice: GSTInvoiceData) => Promise<void>
  updateInvoiceStatus: (id: string, status: "draft" | "sent" | "paid" | "overdue") => Promise<void>
  deleteInvoice: (id: string) => Promise<void>
  updateInvoice: (id: string, invoice: GSTInvoiceData) => Promise<void>
  duplicateInvoice: (id: string) => Promise<void>
  loading: boolean
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined)

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken")
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }
}

export function InvoiceProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<GSTInvoiceData[]>([])
  const [loading, setLoading] = useState(true)

  // Load invoices on mount
  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch("/api/invoices", {
        headers: getAuthHeaders(),
      })

      // Safe parse
      if (response.ok) {
        let data: any = null
        try {
          data = await response.json()
        } catch (err) {
          const raw = await response.text().catch(() => String(err))
          console.warn('[v0] loadInvoices: non-JSON response:', raw)
          data = { invoices: [] }
        }
        setInvoices(data.invoices || [])
      }
    } catch (error) {
      console.error("Failed to load invoices:", error)
    } finally {
      setLoading(false)
    }
  }

  const addInvoice = async (invoice: GSTInvoiceData) => {
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(invoice),
      })

      if (response.ok) {
        let data: any = null
        try {
          data = await response.json()
        } catch (err) {
          const raw = await response.text().catch(() => String(err))
          console.warn('[v0] addInvoice: non-JSON response:', raw)
          return
        }
        setInvoices((prev) => [...prev, data.invoice])
      }
    } catch (error) {
      console.error("Failed to add invoice:", error)
      throw error
    }
  }

  const updateInvoiceStatus = async (id: string, status: "draft" | "sent" | "paid" | "overdue") => {
    try {
      const response = await fetch("/api/invoices", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, status }),
      })

      if (response.ok) {
        setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status } : inv)))
      }
    } catch (error) {
      console.error("Failed to update invoice status:", error)
      throw error
    }
  }

  const deleteInvoice = async (id: string) => {
    try {
      const response = await fetch(`/api/invoices?id=${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        let errorData: any = null
        try {
          errorData = await response.json()
        } catch (err) {
          const raw = await response.text().catch(() => String(err))
          throw new Error(raw || `HTTP ${response.status}`)
        }
        throw new Error(errorData.error || "Failed to delete invoice")
      }

      setInvoices((prev) => prev.filter((inv) => inv.id !== id))
    } catch (error) {
      console.error("Failed to delete invoice:", error)
      throw error
    }
  }

  const updateInvoice = async (id: string, updatedInvoice: GSTInvoiceData) => {
    try {
      const response = await fetch("/api/invoices", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, ...updatedInvoice }),
      })

      if (!response.ok) {
        let errorData: any = null
        try {
          errorData = await response.json()
        } catch (err) {
          const raw = await response.text().catch(() => String(err))
          throw new Error(raw || `HTTP ${response.status}`)
        }
        throw new Error(errorData.error || "Failed to update invoice")
      }

      let data: any = null
      try {
        data = await response.json()
      } catch (err) {
        const raw = await response.text().catch(() => String(err))
        console.warn('[v0] updateInvoice: non-JSON response:', raw)
        return
      }
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? data.invoice : inv)))
    } catch (error) {
      console.error("Failed to update invoice:", error)
      throw error
    }
  }

  const duplicateInvoice = async (id: string) => {
    try {
      const response = await fetch("/api/invoices/duplicate", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        let errorData: any = null
        try {
          errorData = await response.json()
        } catch (err) {
          const raw = await response.text().catch(() => String(err))
          throw new Error(raw || `HTTP ${response.status}`)
        }
        throw new Error(errorData.error || "Failed to duplicate invoice")
      }

      let data: any = null
      try {
        data = await response.json()
      } catch (err) {
        const raw = await response.text().catch(() => String(err))
        console.warn('[v0] duplicateInvoice: non-JSON response:', raw)
        return
      }
      setInvoices((prev) => [...prev, data.invoice])
    } catch (error) {
      console.error("Failed to duplicate invoice:", error)
      throw error
    }
  }

  return (
    <InvoiceContext.Provider
      value={{ invoices, addInvoice, updateInvoiceStatus, deleteInvoice, updateInvoice, duplicateInvoice, loading }}
    >
      {children}
    </InvoiceContext.Provider>
  )
}

export function useInvoices() {
  const context = useContext(InvoiceContext)
  if (context === undefined) {
    throw new Error("useInvoices must be used within an InvoiceProvider")
  }
  return context
}
