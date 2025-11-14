"use client"

import { Download, Mail, ArrowLeft, Printer } from "lucide-react"
import { useState } from "react"

export interface GSTInvoiceData {
  id: string
  invoiceNo: string
  gstNumber: string
  sacHsn: string
  clientId: string
  clientName: string
  clientEmail: string
  clientPhone: string
  clientGSTID?: string
  clientAddress: string
  serviceDescription: string
  servicePeriodFrom: string
  servicePeriodTo: string
  date: string
  status: "draft" | "sent" | "paid" | "overdue"
  amount: number
  cgstRate: number
  sgstRate: number
  studioName: string
  studioGSTNumber: string
  studioAddress: string
  studioPhone: string
  studioWebsite: string
  studioEmail: string
  bankAccountHolder: string
  bankAccountNumber: string
  bankName: string
  ifscCode: string
  upiId: string
}

interface ProfessionalGSTInvoiceProps {
  invoice: GSTInvoiceData
  onBack: () => void
  onSendEmail: (invoiceNo: string) => void
}

export default function ProfessionalGSTInvoice({ invoice, onBack, onSendEmail }: ProfessionalGSTInvoiceProps) {
  const [isSending, setIsSending] = useState(false)

  const cgstAmount = (invoice.amount * invoice.cgstRate) / 100
  const sgstAmount = (invoice.amount * invoice.sgstRate) / 100
  const totalGST = cgstAmount + sgstAmount
  const totalAmount = invoice.amount + totalGST

  const handleDownload = async () => {
    try {
      const element = document.getElementById("gst-invoice-content")
      if (!element) {
        alert("Invoice element not found")
        return
      }

      // Dynamically import html2pdf.js to avoid SSR issues
      const html2pdf = (await import("html2pdf.js")).default

      const pdfWorker = html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `${invoice.invoiceNo}.pdf`,
          image: { type: "jpeg", quality: 0.85 },
          html2canvas: {
            scale: 1.3,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: "#ffffff"
          },
          jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
        })
        .from(element)
        .save()

      console.log("[v0] PDF downloaded successfully")
    } catch (error) {
      console.error("[v0] PDF download failed:", error)
      alert("Failed to generate PDF. Please try again.")
    }
  }

  const handleSendEmail = async () => {
    setIsSending(true)
    try {
      const element = document.getElementById("gst-invoice-content")
      if (!element) {
        alert("Invoice element not found")
        setIsSending(false)
        return
      }

      // Dynamically import html2pdf.js to avoid SSR issues
      const html2pdf = (await import("html2pdf.js")).default

      const pdfWorker = html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `${invoice.invoiceNo}.pdf`,
          image: { type: "jpeg", quality: 0.85 },
          html2canvas: {
            scale: 1.3,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: "#ffffff"
          },
          jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
        })
        .from(element)

      // Generate PDF as blob
      const pdfBlob = await pdfWorker.output("blob")

      // Convert blob to base64
      const reader = new FileReader()
      const pdfBase64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64data = reader.result as string
          // Remove the data:application/pdf;base64, prefix
          const base64 = base64data.split(",")[1]
          resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(pdfBlob)
      })

      console.log("[v0] PDF generated successfully, sending email with attachment...")
      console.log("[v0] PDF base64 length:", pdfBase64.length)

      const response = await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNo: invoice.invoiceNo,
          clientEmail: invoice.clientEmail,
          clientName: invoice.clientName,
          invoice: invoice,
          pdfBase64,
        }),
      })

      console.log("[v0] API response status:", response.status, response.statusText)
      let result: any = null
      try {
        result = await response.json()
      } catch (err) {
        const raw = await response.text().catch(() => String(err))
        result = { error: raw }
      }
      console.log("[v0] API response body:", result)

      if (response.ok) {
        console.log("[v0] Email sent successfully!")
        console.log("[v0] Full API response:", result)
        onSendEmail(invoice.invoiceNo)
        alert(`✓ Invoice sent successfully to ${invoice.clientEmail}`)
      } else {
        const errorMsg = result.error || result.message || JSON.stringify(result) || "Unknown error"
        console.error("[v0] Email send failed:", result)
        alert(`Failed: ${errorMsg}`)
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error("[v0] Email send error:", error, msg)
      alert(`Error: ${msg}`)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-lg shadow p-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#0f3a47] hover:text-[#1a5561] font-semibold transition"
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
              className="flex items-center gap-2 px-4 py-2 bg-[#0f3a47] text-white rounded hover:bg-[#1a5561] transition text-sm font-semibold disabled:opacity-50"
            >
              <Mail size={16} />
              {isSending ? "Sending..." : "Send Email"}
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div id="gst-invoice-content" className="bg-white rounded-lg shadow-lg p-12">
          {/* Header */}
          <div className="border-b-4 border-[#0f3a47] pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <img src="/sripada-logo-compact.svg" alt="Sripada Studios" className="h-16 w-auto" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    GST NUMBER: <span className="font-bold text-gray-900">{invoice.gstNumber}</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    SAC/HSN: <span className="font-bold text-gray-900">{invoice.sacHsn}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-[#0f3a47] mb-2">INVOICE</p>
                <p className="text-xs text-gray-600">
                  NO <span className="font-bold text-gray-900">{invoice.invoiceNo}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Client Info Grid */}
          <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-300">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Client ID</p>
              <p className="text-sm font-semibold text-gray-900 mb-4">{invoice.clientId}</p>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Client Name</p>
              <p className="text-sm font-semibold text-gray-900">{invoice.clientName}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Date</p>
              <p className="text-sm font-semibold text-gray-900 mb-4">{invoice.date}</p>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">GST ID / PAN</p>
              <p className="text-sm font-semibold text-gray-900">{invoice.clientGSTID || "N/A"}</p>
            </div>
          </div>

          {/* Contact Info Grid */}
          <div className="grid grid-cols-2 gap-6 mb-8 pb-8 border-b border-gray-300">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Email ID</p>
              <p className="text-sm text-gray-900 mb-4">{invoice.clientEmail}</p>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Address</p>
              <p className="text-sm text-gray-900">{invoice.clientAddress}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Mobile Number</p>
              <p className="text-sm text-gray-900 mb-4">{invoice.clientPhone}</p>
            </div>
          </div>

          {/* Service Details */}
          <div className="mb-8">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Date</p>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-[#0f3a47]">
                  <th className="text-left px-4 py-3 text-xs font-bold text-[#0f3a47] uppercase">Description</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-[#0f3a47] uppercase">Qty/Hr</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-[#0f3a47] uppercase">Rate</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-[#0f3a47] uppercase">Amount in Rupees</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <span className="font-semibold">{invoice.serviceDescription}</span>
                    <br />
                    <span className="text-xs text-gray-600">
                      ({invoice.servicePeriodFrom} to {invoice.servicePeriodTo})
                    </span>
                  </td>
                  <td className="text-right px-4 py-4 text-sm text-gray-900">-</td>
                  <td className="text-right px-4 py-4 text-sm text-gray-900">-</td>
                  <td className="text-right px-4 py-4 text-sm font-semibold text-gray-900">
                    ₹{invoice.amount.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Details */}
          <div className="mb-8 flex justify-end">
            <div className="w-96">
              <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-300">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">CGST</p>
                  <p className="text-sm font-semibold text-gray-900">{invoice.cgstRate}%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Amount</p>
                  <p className="text-sm font-semibold text-gray-900">₹{cgstAmount.toLocaleString("en-IN")}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-300">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">SGST</p>
                  <p className="text-sm font-semibold text-gray-900">{invoice.sgstRate}%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Amount</p>
                  <p className="text-sm font-semibold text-gray-900">₹{sgstAmount.toLocaleString("en-IN")}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b-2 border-[#0f3a47]">
                <p className="text-xs font-bold text-gray-500 uppercase">Total GST</p>
                <p className="text-right text-sm font-semibold text-gray-900">₹{totalGST.toLocaleString("en-IN")}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                <p className="text-sm font-bold text-[#0f3a47] uppercase">Total Advance Amount</p>
                <p className="text-right text-lg font-bold text-[#0f3a47]">₹{totalAmount.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>

          {/* Thank You Message */}
          <div className="text-center mb-8 py-6 border-t border-gray-300">
            <p className="text-sm font-semibold text-gray-900 mb-2">THANK YOU FOR YOUR BUSINESS</p>
            <p className="text-xs text-gray-600">
              If you have any enquiries concerning this invoice, please contact us. This is an E-Bill and doesn't
              require any signature.
            </p>
          </div>

          {/* Bank Details */}
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <p className="text-sm font-bold text-gray-900 uppercase mb-4">Bank Account Details</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Account Holder</p>
                <p className="text-gray-900">{invoice.bankAccountHolder}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Account Number</p>
                <p className="text-gray-900">{invoice.bankAccountNumber}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Bank</p>
                <p className="text-gray-900">{invoice.bankName}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">IFSC Code</p>
                <p className="text-gray-900">{invoice.ifscCode}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">UPI ID</p>
                <p className="text-gray-900">{invoice.upiId}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-600 border-t border-gray-300 pt-6">
            <p className="mb-1">
              <span className="font-semibold">Ph No:</span> {invoice.studioPhone}
            </p>
            <p className="mb-2">
              <span className="font-semibold">Address:</span> {invoice.studioAddress}
            </p>
            <p>
              {invoice.studioWebsite} | {invoice.studioEmail} | Phone: +91 {invoice.studioPhone}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
