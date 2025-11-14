"use client"

import { Download, Mail, ArrowLeft, Printer } from "lucide-react"
import { useState } from "react"

interface InvoiceData {
  id: string
  invoiceNo: string
  clientName: string
  clientEmail: string
  clientPhone: string
  clientAddress: string
  event: string
  date: string
  dueDate: string
  status: "draft" | "sent" | "paid" | "overdue"
  amount: number
  tax: number
  discount: number
  notes: string
  terms: string
  studioName: string
  studioEmail: string
  studioAddress: string
  studioPhone: string
}

interface ClassicInvoiceTemplateProps {
  invoice: InvoiceData
  onBack: () => void
  onSendEmail: (invoiceNo: string) => void
}

export default function ClassicInvoiceTemplate({ invoice, onBack, onSendEmail }: ClassicInvoiceTemplateProps) {
  const [isSending, setIsSending] = useState(false)

  const subtotal = invoice.amount
  const taxAmount = (subtotal * invoice.tax) / 100
  const discountAmount = invoice.discount
  const total = subtotal + taxAmount - discountAmount

  const handleDownload = () => {
    const element = document.getElementById("classic-invoice-content")
    if (element) {
      const printWindow = window.open("", "", "width=900,height=1000")
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${invoice.invoiceNo}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Georgia', 'Times New Roman', serif; color: #333; line-height: 1.6; }
              .container { max-width: 850px; margin: 0 auto; padding: 40px; background: white; }
              .header { margin-bottom: 40px; border-bottom: 3px solid #216974; padding-bottom: 20px; }
              .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
              .studio-info h1 { font-size: 28px; color: #216974; margin-bottom: 8px; }
              .studio-info p { font-size: 13px; color: #666; margin-bottom: 4px; }
              .invoice-label { font-size: 36px; font-weight: bold; color: #216974; text-align: right; }
              .invoice-details { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px; }
              .detail-box { }
              .detail-label { font-size: 11px; font-weight: bold; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
              .detail-value { font-size: 14px; color: #333; font-weight: 600; }
              .bill-to { margin-bottom: 30px; }
              .bill-to-label { font-size: 11px; font-weight: bold; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
              .bill-to-name { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 6px; }
              .bill-to-details { font-size: 13px; color: #666; line-height: 1.8; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              thead { background: #f5f5f5; border: 1px solid #e0e0e0; }
              th { padding: 12px 15px; text-align: left; font-size: 12px; font-weight: bold; color: #216974; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #e0e0e0; }
              td { padding: 15px; font-size: 13px; color: #333; border-bottom: 1px solid #e0e0e0; }
              tbody tr:hover { background: #fafafa; }
              .amount-col { text-align: right; font-weight: 600; }
              .summary { width: 100%; margin-bottom: 30px; }
              .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-size: 13px; }
              .summary-label { color: #666; }
              .summary-value { font-weight: 600; color: #333; }
              .total-row { border-bottom: 3px solid #216974; padding: 15px 0; margin-bottom: 10px; font-size: 16px; }
              .total-row .summary-label { font-weight: bold; color: #216974; text-transform: uppercase; font-size: 14px; }
              .total-row .summary-value { font-weight: bold; color: #216974; font-size: 20px; }
              .notes-section { margin: 30px 0; padding: 15px; background: #f9f9f9; border-left: 3px solid #216974; }
              .notes-label { font-size: 11px; font-weight: bold; color: #999; text-transform: uppercase; margin-bottom: 8px; }
              .notes-text { font-size: 13px; color: #333; line-height: 1.6; }
              .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999; }
              .status-badge { display: inline-block; padding: 6px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
              .status-paid { background: #d1fae5; color: #065f46; }
              .status-pending { background: #fef3c7; color: #92400e; }
              .status-overdue { background: #fee2e2; color: #991b1b; }
              .status-draft { background: #f0f0f0; color: #333; }
              @media print {
                body { padding: 0; }
                .container { padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              ${element.innerHTML}
            </div>
          </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const handleSendEmail = async () => {
    setIsSending(true)
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
        console.log("[v0] Email sent successfully to", invoice.clientEmail)
        onSendEmail(invoice.invoiceNo)
        alert(`Invoice sent to ${invoice.clientEmail}`)
      } else {
        throw new Error("Failed to send email")
      }
    } catch (error) {
      console.error("[v0] Email send failed:", error)
      alert("Failed to send email. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  const getStatusClass = () => {
    switch (invoice.status) {
      case "paid":
        return "status-paid"
      case "pending":
        return "status-pending"
      case "overdue":
        return "status-overdue"
      default:
        return "status-draft"
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-lg shadow-sm p-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#216974] hover:text-[#1a5561] font-semibold transition"
          >
            <ArrowLeft size={20} />
            Back to Invoices
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm font-semibold"
            >
              <Printer size={16} />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition text-sm font-semibold"
            >
              <Download size={16} />
              Download PDF
            </button>
            <button
              onClick={handleSendEmail}
              disabled={isSending}
              className="flex items-center gap-2 px-4 py-2 bg-[#216974] text-white rounded hover:bg-[#1a5561] transition text-sm font-semibold disabled:opacity-50"
            >
              <Mail size={16} />
              {isSending ? "Sending..." : "Send Email"}
            </button>
          </div>
        </div>

        {/* Invoice */}
        <div id="classic-invoice-content" className="bg-white rounded-lg shadow-lg p-12">
          {/* Header */}
          <div className="mb-12 pb-6 border-b-4 border-[#216974]">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <img src="/sripada-logo-compact.svg" alt="Sripada Studios" className="h-16 w-auto" />
                <div>
                  <h1 className="text-4xl font-bold text-[#216974] mb-2">{invoice.studioName}</h1>
                  <p className="text-gray-600 text-sm">{invoice.studioAddress}</p>
                  <p className="text-gray-600 text-sm">
                    {invoice.studioEmail} | {invoice.studioPhone}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-5xl font-bold text-[#216974] mb-3">INVOICE</p>
                <span className={`inline-block px-3 py-1 rounded text-xs font-bold text-white ${getStatusClass()}`}>
                  {invoice.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="grid grid-cols-3 gap-8 mb-12">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Invoice #</p>
              <p className="text-lg font-bold text-gray-900">{invoice.invoiceNo}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Invoice Date</p>
              <p className="text-gray-900">{invoice.date}</p>
              <p className="text-xs font-bold text-gray-500 uppercase mb-1 mt-3">Due Date</p>
              <p className="text-gray-900">{invoice.dueDate}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Amount Due</p>
              <p className="text-3xl font-bold text-[#216974]">${total.toFixed(2)}</p>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-8 pb-8 border-b border-gray-300">
            <p className="text-xs font-bold text-gray-500 uppercase mb-3">Bill To</p>
            <p className="text-lg font-bold text-gray-900">{invoice.clientName}</p>
            <p className="text-gray-600 text-sm mt-1">{invoice.clientAddress}</p>
            <p className="text-gray-600 text-sm">{invoice.clientEmail}</p>
            <p className="text-gray-600 text-sm">{invoice.clientPhone}</p>
          </div>

          {/* Items Table */}
          <table className="w-full mb-8">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-[#216974]">
                <th className="text-left px-4 py-3 text-xs font-bold text-[#216974] uppercase">Description</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-[#216974] uppercase">Qty</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-[#216974] uppercase">Rate</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-[#216974] uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="px-4 py-4 text-gray-900 font-semibold">{invoice.event}</td>
                <td className="text-center px-4 py-4 text-gray-700">1</td>
                <td className="text-right px-4 py-4 text-gray-700">${invoice.amount.toFixed(2)}</td>
                <td className="text-right px-4 py-4 text-gray-900 font-semibold">${invoice.amount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="flex justify-between py-3 border-b border-gray-300">
                <span className="text-gray-700">Subtotal</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between py-3 border-b border-gray-300 text-green-600">
                  <span>Discount</span>
                  <span className="font-semibold">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              {invoice.tax > 0 && (
                <div className="flex justify-between py-3 border-b border-gray-300">
                  <span className="text-gray-700">Tax ({invoice.tax}%)</span>
                  <span className="font-semibold">${taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-4 border-t-4 border-[#216974] bg-gray-50 px-4">
                <span className="font-bold text-[#216974]">TOTAL</span>
                <span className="font-bold text-2xl text-[#216974]">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="grid grid-cols-2 gap-6 mb-8 py-8 border-t border-gray-300">
              {invoice.notes && (
                <div className="bg-gray-50 p-4 rounded border-l-4 border-[#216974]">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Notes</p>
                  <p className="text-sm text-gray-700">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div className="bg-gray-50 p-4 rounded border-l-4 border-[#216974]">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Payment Terms</p>
                  <p className="text-sm text-gray-700">{invoice.terms}</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-300 pt-6 text-center">
            <p className="text-sm text-gray-600">Thank you for your business!</p>
            <p className="text-xs text-gray-500 mt-2">
              This is a computer-generated invoice. No signature is required.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
