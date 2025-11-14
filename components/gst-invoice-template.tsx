"use client"

import { Download, Mail, ArrowLeft, Printer } from "lucide-react"
import { useState } from "react"

interface GSTInvoiceData {
  id: string
  invoiceNo: string
  gstNumber: string
  sacHsn: string
  clientId: string
  clientName: string
  clientEmail: string
  clientPhone: string
  clientGSTID: string
  clientAddress: string
  serviceDescription: string
  servicePeriodFrom: string
  servicePeriodTo: string
  date: string
  dueDate: string
  status: "draft" | "sent" | "paid" | "overdue"
  amount: number
  cgstRate: number
  sgstRate: number
  notes?: string
  studioName: string
  studioEmail: string
  studioAddress: string
  studioPhone: string
  bankAccountHolder: string
  bankAccountNumber: string
  bankName: string
  ifscCode: string
  upiId: string
  website?: string
}

interface GSTInvoiceTemplateProps {
  invoice: GSTInvoiceData
  onBack: () => void
  onSendEmail: (invoiceNo: string) => void
}

export default function GSTInvoiceTemplate({ invoice, onBack, onSendEmail }: GSTInvoiceTemplateProps) {
  const [isSending, setIsSending] = useState(false)

  const subtotal = invoice.amount
  const cgstAmount = (subtotal * invoice.cgstRate) / 100
  const sgstAmount = (subtotal * invoice.sgstRate) / 100
  const totalGST = cgstAmount + sgstAmount
  const total = subtotal + totalGST

  const handleDownload = () => {
    const element = document.getElementById("gst-invoice-content")
    if (element) {
      const printWindow = window.open("", "", "width=950,height=1200")
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>${invoice.invoiceNo}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Arial', sans-serif; color: #333; line-height: 1.5; background: white; }
              .container { max-width: 900px; margin: 0 auto; padding: 30px; background: white; }
              .header { margin-bottom: 25px; border-bottom: 2px solid #000; padding-bottom: 20px; }
              .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
              .studio-info h1 { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
              .studio-info p { font-size: 11px; margin-bottom: 2px; }
              .invoice-label { font-size: 28px; font-weight: bold; text-align: right; }
              .invoice-header-row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 12px; font-weight: bold; }
              .invoice-header-item { flex: 1; }
              .invoice-header-label { color: #666; font-size: 10px; text-transform: uppercase; margin-bottom: 3px; }
              .invoice-header-value { font-weight: bold; font-size: 12px; }
              .client-section { margin: 20px 0; }
              .client-row { display: flex; margin-bottom: 12px; font-size: 11px; }
              .client-label { width: 120px; font-weight: bold; color: #555; }
              .client-value { flex: 1; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 11px; }
              thead { background: #f0f0f0; border: 1px solid #000; }
              th { padding: 8px; text-align: left; font-weight: bold; border: 1px solid #000; }
              td { padding: 10px 8px; border: 1px solid #ddd; }
              tbody tr:nth-child(even) { background: #fafafa; }
              .amount-col { text-align: right; }
              .totals-section { margin: 20px 0; }
              .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; font-size: 11px; }
              .totals-row.total { border-bottom: 2px solid #000; border-top: 2px solid #000; padding: 10px 0; font-weight: bold; font-size: 12px; }
              .totals-row.gst-header { font-weight: bold; background: #f9f9f9; margin-top: 10px; padding: 8px; }
              .bank-section { margin: 20px 0; padding: 15px; background: #f9f9f9; border: 1px solid #ddd; font-size: 11px; }
              .bank-title { font-weight: bold; margin-bottom: 10px; }
              .bank-row { display: flex; margin-bottom: 5px; }
              .bank-label { width: 140px; font-weight: bold; }
              .bank-value { flex: 1; }
              .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #666; }
              .note { padding: 10px; background: #fffacd; border-left: 3px solid #ff9800; margin: 15px 0; font-size: 11px; }
              .status-badge { display: inline-block; padding: 4px 8px; background: #e8f5e9; color: #2e7d32; font-weight: bold; font-size: 10px; }
              @media print { body { padding: 0; margin: 0; } .container { padding: 10px; } }
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

  const getStatusBadgeClass = () => {
    switch (invoice.status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-lg shadow p-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition"
          >
            <ArrowLeft size={20} />
            Back
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
              Download
            </button>
            <button
              onClick={handleSendEmail}
              disabled={isSending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-semibold disabled:opacity-50"
            >
              <Mail size={16} />
              {isSending ? "Sending..." : "Send Email"}
            </button>
          </div>
        </div>

        {/* GST Invoice */}
        <div id="gst-invoice-content" className="bg-white rounded-lg shadow-lg p-10">
          {/* Header */}
          <div className="mb-6 pb-4 border-b-2 border-black">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <img src="/sripada-logo-compact.svg" alt="Sripada Studios" className="h-14 w-auto" />
                <div>
                  <h1 className="text-2xl font-bold mb-1">{invoice.studioName}</h1>
                  <p className="text-xs text-gray-700">{invoice.studioAddress}</p>
                  <p className="text-xs text-gray-700">
                    {invoice.studioEmail} | {invoice.studioPhone}
                  </p>
                  {invoice.website && <p className="text-xs text-gray-700">{invoice.website}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold mb-2">INVOICE</p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${getStatusBadgeClass()}`}>
                  {invoice.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* GST & Invoice Details */}
          <div className="grid grid-cols-4 gap-4 mb-8 text-xs">
            <div>
              <p className="font-bold text-gray-600 mb-1">GST NUMBER</p>
              <p className="font-semibold">{invoice.gstNumber}</p>
            </div>
            <div>
              <p className="font-bold text-gray-600 mb-1">SAC/HSN</p>
              <p className="font-semibold">{invoice.sacHsn}</p>
            </div>
            <div>
              <p className="font-bold text-gray-600 mb-1">CLIENT ID</p>
              <p className="font-semibold">{invoice.clientId}</p>
            </div>
            <div>
              <p className="font-bold text-gray-600 mb-1">INVOICE NO</p>
              <p className="font-semibold">{invoice.invoiceNo}</p>
            </div>
          </div>

          {/* Client Details */}
          <div className="grid grid-cols-3 gap-4 mb-8 text-xs">
            <div>
              <p className="font-bold text-gray-600 mb-1">CLIENT NAME</p>
              <p className="font-semibold">{invoice.clientName}</p>
            </div>
            <div>
              <p className="font-bold text-gray-600 mb-1">EMAIL ID</p>
              <p className="font-semibold">{invoice.clientEmail}</p>
            </div>
            <div>
              <p className="font-bold text-gray-600 mb-1">GST ID / PAN</p>
              <p className="font-semibold">{invoice.clientGSTID}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8 text-xs">
            <div>
              <p className="font-bold text-gray-600 mb-1">ADDRESS</p>
              <p className="font-semibold">{invoice.clientAddress}</p>
            </div>
            <div>
              <p className="font-bold text-gray-600 mb-1">MOBILE NUMBER</p>
              <p className="font-semibold">{invoice.clientPhone}</p>
            </div>
            <div>
              <p className="font-bold text-gray-600 mb-1">DATE</p>
              <p className="font-semibold">{invoice.date}</p>
            </div>
          </div>

          {/* Service Details Table */}
          <table className="w-full mb-8 border border-black">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-black p-2 text-left text-xs font-bold">DESCRIPTION</th>
                <th className="border border-black p-2 text-right text-xs font-bold w-20">QTY/HR</th>
                <th className="border border-black p-2 text-right text-xs font-bold w-24">RATE</th>
                <th className="border border-black p-2 text-right text-xs font-bold w-24">AMOUNT IN RUPEES</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-2 text-xs">
                  {invoice.serviceDescription}
                  <div className="text-xs text-gray-600 mt-1">
                    ({invoice.servicePeriodFrom} to {invoice.servicePeriodTo})
                  </div>
                </td>
                <td className="border border-black p-2 text-right text-xs">1</td>
                <td className="border border-black p-2 text-right text-xs font-semibold">
                  ₹{subtotal.toLocaleString()}
                </td>
                <td className="border border-black p-2 text-right text-xs font-semibold">
                  ₹{subtotal.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Tax Section */}
          <div className="mb-6 border border-black p-4">
            <div className="grid grid-cols-2 gap-8 mb-4">
              <div>
                <p className="text-xs font-bold mb-2">CGST</p>
                <p className="text-sm font-semibold">{invoice.cgstRate}%</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold mb-2">₹{cgstAmount.toLocaleString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-bold mb-2">SGST</p>
                <p className="text-sm font-semibold">{invoice.sgstRate}%</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold mb-2">₹{sgstAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Total GST */}
          <div className="mb-6 border-b-2 border-black pb-4">
            <div className="flex justify-between text-sm">
              <span className="font-bold">Total GST</span>
              <span className="font-bold">₹{totalGST.toLocaleString()}</span>
            </div>
          </div>

          {/* Total Amount */}
          <div className="mb-8 p-4 bg-gray-100 border-2 border-black">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Total Advance Amount</span>
              <span className="text-2xl font-bold text-blue-600">₹{total.toLocaleString()}</span>
            </div>
          </div>

          {/* Bank Details */}
          <div className="mb-8 p-4 bg-gray-50 border border-gray-300">
            <p className="font-bold mb-3 text-sm">BANK ACCOUNT DETAILS</p>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-600 font-semibold">Account Holder:</p>
                <p>{invoice.bankAccountHolder}</p>
              </div>
              <div>
                <p className="text-gray-600 font-semibold">Account Number:</p>
                <p>{invoice.bankAccountNumber}</p>
              </div>
              <div>
                <p className="text-gray-600 font-semibold">Bank:</p>
                <p>{invoice.bankName}</p>
              </div>
              <div>
                <p className="text-gray-600 font-semibold">IFSC Code:</p>
                <p>{invoice.ifscCode}</p>
              </div>
              <div>
                <p className="text-gray-600 font-semibold">UPI ID:</p>
                <p>{invoice.upiId}</p>
              </div>
              <div>
                <p className="text-gray-600 font-semibold">Phone:</p>
                <p>{invoice.studioPhone}</p>
              </div>
            </div>
          </div>

          {/* Footer Notes */}
          {invoice.notes && (
            <div className="mb-8 p-4 bg-yellow-50 border-l-4 border-yellow-400">
              <p className="text-xs font-bold text-gray-600 mb-2">NOTES</p>
              <p className="text-xs text-gray-700">{invoice.notes}</p>
            </div>
          )}

          {/* Thank You Message */}
          <div className="border-t border-black pt-6 text-center">
            <p className="text-sm font-bold mb-2">THANK YOU FOR YOUR BUSINESS</p>
            <p className="text-xs text-gray-600">
              If you have any enquiries concerning this invoice, please contact us.
            </p>
            <p className="text-xs text-gray-600 mt-1">This is an E-Bill and doesn't require any signature.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
