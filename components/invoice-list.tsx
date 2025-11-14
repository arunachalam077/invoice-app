"use client"

import { useState } from "react"
import { Mail, Eye, Trash2, Edit2, Copy } from "lucide-react"
import { useInvoices } from "@/context/invoice-context"
import SripadaInvoice from "@/components/sripada-invoice"

export default function InvoiceList() {
  const { invoices, updateInvoiceStatus, deleteInvoice, updateInvoice, duplicateInvoice } = useInvoices()
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)

  const handleSendEmail = async (invoice: any) => {
    try {
      const response = await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNo: invoice.invoiceNo,
          clientEmail: invoice.clientEmail,
          clientName: invoice.clientName,
          invoice: invoice,
        }),
      })

      if (response.ok) {
        updateInvoiceStatus(invoice.id, "sent")
        alert(`Invoice sent successfully to ${invoice.clientEmail}`)
      }
    } catch (error) {
      console.error("[v0] Failed to send invoice:", error)
      alert("Failed to send invoice")
    }
  }

  const handleEditInvoice = (updatedInvoice: any) => {
    updateInvoice(updatedInvoice.id, updatedInvoice)
    setSelectedInvoice(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  if (selectedInvoice) {
    return (
      <SripadaInvoice
        invoice={selectedInvoice}
        onBack={() => setSelectedInvoice(null)}
        onSendEmail={(invoiceNo) => {
          updateInvoiceStatus(selectedInvoice.id, "sent")
          setSelectedInvoice(null)
        }}
        onEdit={handleEditInvoice}
      />
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-12 text-center">
        <p className="text-gray-600 mb-2">No invoices yet</p>
        <p className="text-sm text-gray-500">Create a booking to generate an invoice automatically</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-4 mb-6">
        <img src="/sripada-logo-compact.svg" alt="Sripada Studios" className="h-12 w-auto" />
      </div>
      <h2 className="text-2xl font-bold text-[#0f3a47] mb-6">Invoices</h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#0f3a47]">
              <th className="text-left py-3 px-4 font-semibold text-[#0f3a47]">Invoice No</th>
              <th className="text-left py-3 px-4 font-semibold text-[#0f3a47]">Client</th>
              <th className="text-left py-3 px-4 font-semibold text-[#0f3a47]">Service</th>
              <th className="text-left py-3 px-4 font-semibold text-[#0f3a47]">Amount</th>
              <th className="text-left py-3 px-4 font-semibold text-[#0f3a47]">Date</th>
              <th className="text-left py-3 px-4 font-semibold text-[#0f3a47]">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-[#0f3a47]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4 text-slate-900 font-medium">{invoice.invoiceNo}</td>
                <td className="py-3 px-4 text-slate-700">{invoice.clientName}</td>
                <td className="py-3 px-4 text-slate-700">{invoice.serviceDescription}</td>
                <td className="py-3 px-4 text-slate-900 font-semibold">₹{invoice.amount.toLocaleString("en-IN")}</td>
                <td className="py-3 px-4 text-slate-700">{invoice.date}</td>
                <td className="py-3 px-4">
                  <select
                    value={invoice.status}
                    onChange={(e) => updateInvoiceStatus(invoice.id, e.target.value as any)}
                    className={`px-2 py-1 rounded text-xs font-semibold border-0 cursor-pointer ${getStatusColor(invoice.status)}`}
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedInvoice(invoice)}
                      className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                      title="View"
                    >
                      <Eye size={16} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleSendEmail(invoice)}
                      className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                      title="Send Email"
                    >
                      <Mail size={16} className="text-purple-600" />
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await duplicateInvoice(invoice.id)
                          alert("Invoice duplicated successfully!")
                        } catch (error) {
                          console.error("Duplicate error:", error)
                          alert(`Failed to duplicate invoice: ${error instanceof Error ? error.message : "Unknown error"}`)
                        }
                      }}
                      className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                      title="Duplicate"
                    >
                      <Copy size={16} className="text-green-600" />
                    </button>
                    <button
                      onClick={() => setSelectedInvoice(invoice)}
                      className="p-2 hover:bg-yellow-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={16} className="text-yellow-600" />
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          if (confirm("Are you sure you want to delete this invoice?")) {
                            await deleteInvoice(invoice.id)
                            alert("Invoice deleted successfully!")
                          }
                        } catch (error) {
                          console.error("Delete error:", error)
                          alert(`Failed to delete invoice: ${error instanceof Error ? error.message : "Unknown error"}`)
                        }
                      }}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
