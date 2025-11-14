"use client"

import { Download, Mail, ArrowLeft } from "lucide-react"
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
}

interface AdvancedInvoiceTemplateProps {
  invoice: InvoiceData
  onBack: () => void
  onSendEmail: (invoiceNo: string) => void
}

export default function AdvancedInvoiceTemplate({ invoice, onBack, onSendEmail }: AdvancedInvoiceTemplateProps) {
  const [isSending, setIsSending] = useState(false)

  const subtotal = invoice.amount
  const taxAmount = (subtotal * invoice.tax) / 100
  const discountAmount = invoice.discount
  const total = subtotal + taxAmount - discountAmount

  const handleDownload = async () => {
    try {
      const element = document.getElementById("invoice-content")
      if (!element) {
        alert("Invoice element not found")
        return
      }

      // Helper: inline same-origin images before PDF capture
      const inlineImages = async (rootEl: HTMLElement) => {
        const imgs = Array.from(rootEl.querySelectorAll("img")) as HTMLImageElement[]
        await Promise.all(
          imgs.map(async (img) => {
            try {
              const src = img.getAttribute("src") || ""
              if (!src || src.startsWith("data:")) return
              const absUrl = src.startsWith("/") ? `${window.location.origin}${src}` : src
              const res = await fetch(absUrl)
              if (!res.ok) return
              const blob = await res.blob()
              const reader = new FileReader()
              const dataUrl: string = await new Promise((resolve, reject) => {
                reader.onloadend = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(blob)
              })
              try { img.removeAttribute("crossOrigin") } catch (e) {}
              img.src = dataUrl
            } catch (err) {
              console.warn("[v0] inlineImages failed for", img.src, err)
            }
          })
        )
      }

      // Dynamically import html2pdf.js to avoid SSR issues
      const html2pdf = (await import("html2pdf.js")).default

      // Inline images before generating PDF so logos are embedded
      await inlineImages(element)

      // Temporarily force the element width to A4 dimensions to avoid cropping in capture
      const prevWidth = element.style.width || ""
      const prevMaxWidth = element.style.maxWidth || ""
      element.style.width = "794px"
      element.style.maxWidth = "794px"

      try {
        const pdfWorker = html2pdf()
          .set({
          margin: [8, 8, 8, 8],
          filename: `${invoice.invoiceNo}.pdf`,
          image: { type: "png", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: "#ffffff",
            windowHeight: 1400,
            windowWidth: 900
          },
          jsPDF: {
            orientation: "portrait",
            unit: "mm",
            format: "a4",
            compress: false
          },
        })
          .from(element)
          .save()

        console.log("[v0] PDF downloaded successfully")
      } finally {
        // restore previous sizing so UI is unaffected
        element.style.width = prevWidth
        element.style.maxWidth = prevMaxWidth
      }
    } catch (error) {
      console.error("[v0] PDF download failed:", error)
      alert("Failed to generate PDF. Please try again.")
    }
  }

  const handleSendEmail = async () => {
    setIsSending(true)
    try {
      console.log("Starting PDF generation...")

      const element = document.getElementById("invoice-content")
      if (!element) {
        console.error("Invoice content element not found")
        alert("Invoice element not found")
        setIsSending(false)
        return
      }

      console.log("Found invoice element, generating PDF...")

      // Dynamically import html2pdf.js to avoid SSR issues
      const html2pdf = (await import("html2pdf.js")).default

      // Inline images before generating PDF so logo is embedded
      const inlineImages = async (rootEl: HTMLElement) => {
        const imgs = Array.from(rootEl.querySelectorAll("img")) as HTMLImageElement[]
        await Promise.all(
          imgs.map(async (img) => {
            try {
              const src = img.getAttribute("src") || ""
              if (!src || src.startsWith("data:")) return
              const absUrl = src.startsWith("/") ? `${window.location.origin}${src}` : src
              const res = await fetch(absUrl)
              if (!res.ok) return
              const blob = await res.blob()
              const reader = new FileReader()
              const dataUrl: string = await new Promise((resolve, reject) => {
                reader.onloadend = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(blob)
              })
              try { img.removeAttribute("crossOrigin") } catch (e) {}
              img.src = dataUrl
            } catch (err) {
              console.warn("[v0] inlineImages failed for", img.src, err)
            }
          })
        )
      }

      await inlineImages(element)

      // Temporarily force the element width to A4 dimensions to avoid cropping in capture
      const prevWidth = element.style.width || ""
      const prevMaxWidth = element.style.maxWidth || ""
      element.style.width = "794px"
      element.style.maxWidth = "794px"

      // We'll restore width in a finally after generation attempts

      const pdfWorker = html2pdf()
        .set({
          margin: [6, 6, 6, 6],
          filename: `${invoice.invoiceNo}.pdf`,
          image: { type: "png", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: "#ffffff",
            windowHeight: 1122,
            windowWidth: 794,
            imageTimeout: 5000
          },
          jsPDF: {
            orientation: "portrait",
            unit: "mm",
            format: "a4",
            compress: false
          },
        })
        .from(element)

      console.log("Generating PDF output...")

      // Generate PDF base64 with retries to keep payload small when possible
      const blobToBase64 = (blob: Blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })

      const MAX_BASE64 = 6_000_000 // target safe size
      const qualities = [0.98, 0.9, 0.85, 0.8, 0.7]
      const scales = [2, 1.75, 1.5, 1.25, 1]

      let pdfBase64: string | null = null
      let lastError: any = null
      try {
        for (const quality of qualities) {
        for (const scale of scales) {
          try {
            const worker = html2pdf()
              .set({
                margin: [6, 6, 6, 6],
                filename: `${invoice.invoiceNo}.pdf`,
                image: { type: "png", quality },
                html2canvas: {
                  scale,
                  useCORS: true,
                  allowTaint: true,
                  logging: false,
                  backgroundColor: "#ffffff",
                  windowHeight: 1122,
                  windowWidth: 794,
                  imageTimeout: 5000,
                },
                jsPDF: { orientation: "portrait", unit: "mm", format: "a4", compress: false },
              })
              .from(element)

            const blob = await worker.output("blob")
            const dataUrl = await blobToBase64(blob)
            const base64 = dataUrl.split(",")[1]
            console.log("Attempt with quality", quality, "scale", scale, "-> base64 length", base64.length)
            if (base64.length <= MAX_BASE64) {
              pdfBase64 = base64
              break
            }
            // keep last produced base64 as fallback
            if (!pdfBase64) pdfBase64 = base64
          } catch (e) {
            lastError = e
            console.warn("PDF attempt failed for quality", quality, "scale", scale, e)
            continue
          }
        }
        if (pdfBase64 && pdfBase64.length <= MAX_BASE64) break
      }
      finally {
        // restore previous sizing so UI is unaffected
        element.style.width = prevWidth
        element.style.maxWidth = prevMaxWidth
      }

      if (!pdfBase64) {
        console.error("All PDF generation attempts failed", lastError)
        throw new Error("Failed to generate PDF after multiple attempts")
      }

      console.log("Final PDF base64 length:", pdfBase64.length)

      console.log("PDF generated successfully, sending email with attachment...")
      console.log("Email details:", {
        invoiceNo: invoice.invoiceNo,
        clientEmail: invoice.clientEmail,
        clientName: invoice.clientName,
        pdfBase64Length: pdfBase64.length
      })

      // Send email with PDF attachment
      const response = await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNo: invoice.invoiceNo,
          clientEmail: invoice.clientEmail,
          clientName: invoice.clientName,
          invoice: invoice,
          pdfBase64: pdfBase64,
        }),
      })

      console.log("Response status:", response.status, response.statusText)

      let result: any = null
      try {
        result = await response.json()
      } catch (err) {
        const raw = await response.text().catch(() => String(err))
        result = { error: raw }
      }
      console.log("API response:", result)

      if (!response.ok) {
        const errorMessage = result?.message || result?.error || JSON.stringify(result) || "Failed to send email"
        console.error("Email send failed:", errorMessage)
        throw new Error(errorMessage)
      }

      console.log("Email sent successfully!")
      console.log("Full API response:", result)
      alert(`✓ Invoice sent successfully to ${invoice.clientEmail}`)
      onSendEmail(invoice.invoiceNo)
    } catch (error) {
      console.error("Failed to send invoice - Full error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      alert(`Failed to send invoice: ${errorMessage}`)
    } finally {
      setIsSending(false)
    }
  }

  const getStatusColor = () => {
    switch (invoice.status) {
      case "paid":
        return "bg-emerald-100 text-emerald-800 border-emerald-300"
      case "overdue":
        return "bg-red-100 text-red-800 border-red-300"
      case "sent":
        return "bg-blue-100 text-blue-800 border-blue-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
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
              className="flex items-center gap-2 px-4 py-2.5 bg-[#216974] text-white rounded-lg hover:bg-[#1a5561] transition font-semibold"
            >
              <Download size={18} />
              Download PDF
            </button>
            <button
              onClick={handleSendEmail}
              disabled={isSending}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#216974] to-[#1a5561] text-white rounded-lg hover:shadow-lg transition font-semibold disabled:opacity-50"
            >
              <Mail size={18} />
              {isSending ? "Sending..." : "Send Email"}
            </button>
          </div>
        </div>

        {/* Invoice Container */}
        <div id="invoice-content" className="bg-white rounded-2xl shadow-xl p-12">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-12 pb-8 border-b-2 border-gray-200">
              <div className="flex items-start gap-4">
                <img
                  src="/sripada-logo.png"
                  alt="Sripada Studios"
                  className="object-contain"
                  style={{ width: 160, height: "auto" }}
                />
                <div>
                  <h1 className="text-4xl font-bold text-[#216974] mb-2">{invoice.studioName}</h1>
                  <p className="text-gray-600 text-sm">{invoice.studioAddress}</p>
                  <p className="text-gray-600 text-sm">{invoice.studioEmail}</p>
                </div>
              </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">INVOICE</h2>
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor()}`}>
                {invoice.status.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-3 gap-8 mb-12">
            {/* Invoice Info */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Invoice Number</p>
              <p className="text-lg font-bold text-gray-900">{invoice.invoiceNo}</p>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1 mt-4">Invoice Date</p>
              <p className="text-gray-700">{invoice.date}</p>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1 mt-4">Due Date</p>
              <p className="text-gray-700">{invoice.dueDate}</p>
            </div>

            {/* Bill To */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Bill To</p>
              <p className="text-lg font-bold text-gray-900">{invoice.clientName}</p>
              <p className="text-sm text-gray-600 mt-1">{invoice.clientAddress}</p>
              <p className="text-sm text-gray-600">{invoice.clientEmail}</p>
              <p className="text-sm text-gray-600">{invoice.clientPhone}</p>
            </div>

            {/* Quick Summary */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Amount Due</p>
              <p className="text-3xl font-bold text-[#216974]">${total.toFixed(2)}</p>
              <p className="text-xs text-gray-600 mt-2">
                Payment Status: <span className="font-semibold capitalize">{invoice.status}</span>
              </p>
            </div>
          </div>

          {/* Service/Event Section */}
          <div className="mb-12">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Service Description</p>
            <div className="bg-[#f0f7fa] border-l-4 border-[#216974] p-4 rounded">
              <p className="text-gray-900 font-semibold">{invoice.event}</p>
            </div>
          </div>

          <table className="w-full mb-8">
            <thead>
              <tr className="bg-[#f0f7fa] border-b-2 border-[#216974]">
                <th className="px-6 py-3 text-left text-sm font-bold text-[#216974]">Description</th>
                <th className="px-6 py-3 text-right text-sm font-bold text-[#216974]">Quantity</th>
                <th className="px-6 py-3 text-right text-sm font-bold text-[#216974]">Rate</th>
                <th className="px-6 py-3 text-right text-sm font-bold text-[#216974]">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-900 font-semibold">{invoice.event}</td>
                <td className="px-6 py-4 text-right text-gray-700">1</td>
                <td className="px-6 py-4 text-right text-gray-700">${invoice.amount.toFixed(2)}</td>
                <td className="px-6 py-4 text-right text-gray-900 font-semibold">${invoice.amount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* Calculations */}
          <div className="flex justify-end mb-12">
            <div className="w-96">
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between py-3 border-b border-gray-200 text-green-600">
                  <span>Discount:</span>
                  <span className="font-semibold">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              {invoice.tax > 0 && (
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-700">Tax ({invoice.tax}%):</span>
                  <span className="font-semibold text-gray-900">${taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-4 bg-[#f0f7fa] px-4 rounded-lg border-2 border-[#216974]">
                <span className="font-bold text-[#216974]">Total Amount Due:</span>
                <span className="font-bold text-2xl text-[#216974]">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes and Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="grid grid-cols-2 gap-8 mb-8 py-8 border-t border-gray-200">
              {invoice.notes && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Notes</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Payment Terms</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{invoice.terms}</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="border-t-2 border-gray-200 pt-8 mt-8 text-center">
            <p className="text-gray-600 text-sm mb-2">Thank you for your business!</p>
            <p className="text-gray-500 text-xs">This is a computer-generated invoice. No signature is required.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
