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
  hours?: string
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

interface SripadaInvoiceProps {
  invoice: GSTInvoiceData
  onBack: () => void
  onSendEmail: (invoiceNo: string) => void
  onEdit?: (invoice: GSTInvoiceData) => void
}

export default function SripadaInvoice({ invoice, onBack, onSendEmail, onEdit }: SripadaInvoiceProps) {
  const [isSending, setIsSending] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<GSTInvoiceData>(invoice)

  const cgstAmount = (editData.amount * editData.cgstRate) / 100
  const sgstAmount = (editData.amount * editData.sgstRate) / 100
  const totalGST = cgstAmount + sgstAmount
  const totalAmount = editData.amount + totalGST

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
  }

  const handleDownloadPDF = async () => {
    try {
      const element = document.getElementById("invoice-print")
      if (!element) {
        alert("Invoice element not found")
        return
      }

      // Dynamically import html2pdf.js to avoid SSR issues
      const html2pdf = (await import("html2pdf.js")).default

      const pdfWorker = html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `${editData.invoiceNo}.pdf`,
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

  const handlePrint = () => {
    window.print()
  }

  const handleSendEmail = async () => {
    setIsSending(true)
    try {
      const element = document.getElementById("invoice-print")
      if (!element) {
        alert("Invoice element not found")
        setIsSending(false)
        return
      }

      // Dynamically import html2pdf.js to avoid SSR issues
      const html2pdf = (await import("html2pdf.js")).default

      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 500))

      const pdfWorker = html2pdf()
        .set({
          margin: [6, 6, 6, 6],
          filename: `${editData.invoiceNo}.pdf`,
          image: { type: "png", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: "#ffffff",
            windowHeight: 1122,
            windowWidth: 794
          },
          jsPDF: {
            orientation: "portrait",
            unit: "mm",
            format: "a4",
            compress: false
          },
        })
        .from(element)      // Generate PDF as blob
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
      console.log("[v0] Sending to:", editData.clientEmail)

      try {
        const response = await fetch("/api/send-invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceNo: editData.invoiceNo,
            clientEmail: editData.clientEmail,
            clientName: editData.clientName,
            invoice: editData,
            pdfBase64, // Now properly encoded base64 PDF
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
          onSendEmail(editData.invoiceNo)
          alert(`✓ Invoice sent successfully to ${editData.clientEmail}`)
        } else {
          const errorMsg = result.error || result.message || JSON.stringify(result) || "Unknown error"
          console.error("[v0] Email send failed:", result)
          alert(`Failed: ${errorMsg}`)
        }
      } catch (error) {
        console.error("[v0] Email send failed:", error)
        alert(`Failed to send email: ${error instanceof Error ? error.message : "Network error"}`)
      } finally {
        setIsSending(false)
      }
    } catch (error) {
      console.error("[v0] PDF generation failed:", error)
      alert("Failed to generate PDF")
      setIsSending(false)
    }
  }

  const handleSaveEdit = () => {
    onEdit?.(editData)
    setIsEditing(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-lg shadow p-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#216974] hover:text-[#154f5f] font-semibold transition"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          <div className="flex gap-3">
            {!isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition text-sm font-semibold"
                >
                  Edit
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm font-semibold"
                >
                  <Printer size={16} />
                  Print
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition text-sm font-semibold"
                >
                  <Download size={16} />
                  Download PDF
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={isSending}
                  className="flex items-center gap-2 px-4 py-2 bg-[#216974] text-white rounded hover:bg-[#154f5f] transition text-sm font-semibold disabled:opacity-50"
                >
                  <Mail size={16} />
                  {isSending ? "Sending..." : "Send Email"}
                </button>
              </>
            )}
            {isEditing && (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-semibold"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditData(invoice)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm font-semibold"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Edit Form Modal */}
        {isEditing && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-[#216974] mb-4">Edit Invoice</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Client Name</label>
                <input
                  type="text"
                  value={editData.clientName}
                  onChange={(e) => setEditData({ ...editData, clientName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#216974]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Amount (₹)</label>
                <input
                  type="number"
                  value={editData.amount}
                  onChange={(e) => setEditData({ ...editData, amount: Number.parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#216974]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Service Description</label>
                <input
                  type="text"
                  value={editData.serviceDescription}
                  onChange={(e) => setEditData({ ...editData, serviceDescription: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#216974]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Hours</label>
                <input
                  type="text"
                  value={editData.hours || ""}
                  onChange={(e) => setEditData({ ...editData, hours: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#216974]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">CGST Rate (%)</label>
                <input
                  type="number"
                  value={editData.cgstRate}
                  onChange={(e) => setEditData({ ...editData, cgstRate: Number.parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#216974]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">SGST Rate (%)</label>
                <input
                  type="number"
                  value={editData.sgstRate}
                  onChange={(e) => setEditData({ ...editData, sgstRate: Number.parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#216974]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Invoice - A4 Single Page */}
        <div id="invoice-print" className="bg-white shadow-lg p-0" style={{ width: "210mm", margin: "0 auto" }}>
          <div style={{ padding: "15mm", fontFamily: "Arial, sans-serif", color: "#333", fontSize: "10px" }}>
            {/* Header - Logo and GST */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
                paddingBottom: "10px",
                borderBottom: "2px solid #216974",
              }}
            >
              {/* Logo and Company Info Section */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                {/* Sripada Logo */}
                <svg viewBox="0 0 200 100" style={{ height: "60px", width: "auto" }} xmlns="http://www.w3.org/2000/svg">
                  {/* Left decorative element with circles and curves */}
                  <g>
                    {/* Orange/brown arc */}
                    <path d="M 25 30 Q 15 30 15 40 Q 15 50 25 50" fill="none" stroke="#C85A28" strokeWidth="8" strokeLinecap="round" />
                    {/* Teal arc */}
                    <path d="M 20 25 Q 10 25 10 35 Q 10 55 30 65" fill="none" stroke="#1B7F8C" strokeWidth="8" strokeLinecap="round" />
                    {/* Brown circles */}
                    <circle cx="35" cy="35" r="5" fill="#C85A28" />
                    <circle cx="30" cy="55" r="4" fill="#C85A28" />
                    {/* Teal circles */}
                    <circle cx="20" cy="20" r="4" fill="#1B7F8C" />
                    <circle cx="40" cy="60" r="5" fill="#1B7F8C" />
                  </g>
                  {/* Sripada Text */}
                  <text x="65" y="55" fontSize="32" fontWeight="bold" fill="#1B7F8C" fontFamily="Arial, sans-serif">
                    Sripada
                  </text>
                  {/* Studios Text */}
                  <text x="65" y="85" fontSize="18" fontWeight="bold" fill="#C85A28" fontFamily="Arial, sans-serif">
                    STUDIOS
                  </text>
                </svg>
              </div>

              {/* Invoice Title and GST Info */}
              <div style={{ textAlign: "right" }}>
                <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#216974", margin: "0 0 6px 0" }}>INVOICE</h1>
                <div style={{ fontSize: "9px", color: "#666", lineHeight: "1.4" }}>
                  <div style={{ fontWeight: "bold" }}>GST NUMBER</div>
                  <div style={{ color: "#216974", fontWeight: "bold", fontSize: "10px" }}>{editData.gstNumber}</div>
                  <div style={{ fontWeight: "bold", marginTop: "3px" }}>SAC/HSN</div>
                  <div style={{ color: "#216974", fontWeight: "bold", fontSize: "10px" }}>{editData.sacHsn}</div>
                </div>
              </div>
            </div>

            {/* Client Details Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "12px", fontSize: "10px" }}>
              <tbody>
                <tr>
                  <td
                    style={{
                      border: "1px solid #216974",
                      backgroundColor: "#f5f5f5",
                      padding: "8px",
                      fontWeight: "bold",
                      color: "#216974",
                      width: "25%",
                    }}
                  >
                    CLIENT ID
                  </td>
                  <td style={{ border: "1px solid #216974", padding: "8px" }}>{editData.clientId}</td>
                  <td
                    style={{
                      border: "1px solid #216974",
                      backgroundColor: "#f5f5f5",
                      padding: "8px",
                      fontWeight: "bold",
                      color: "#216974",
                      width: "25%",
                    }}
                  >
                    INVOICE NO
                  </td>
                  <td style={{ border: "1px solid #216974", padding: "8px" }}>{editData.invoiceNo}</td>
                </tr>
                <tr>
                  <td
                    style={{
                      border: "1px solid #216974",
                      backgroundColor: "#f5f5f5",
                      padding: "8px",
                      fontWeight: "bold",
                      color: "#216974",
                    }}
                  >
                    CLIENT NAME
                  </td>
                  <td style={{ border: "1px solid #216974", padding: "8px" }}>{editData.clientName}</td>
                  <td
                    style={{
                      border: "1px solid #216974",
                      backgroundColor: "#f5f5f5",
                      padding: "8px",
                      fontWeight: "bold",
                      color: "#216974",
                    }}
                  >
                    DATE
                  </td>
                  <td style={{ border: "1px solid #216974", padding: "8px" }}>{editData.date}</td>
                </tr>
                <tr>
                  <td
                    style={{
                      border: "1px solid #216974",
                      backgroundColor: "#f5f5f5",
                      padding: "8px",
                      fontWeight: "bold",
                      color: "#216974",
                    }}
                  >
                    EMAIL ID
                  </td>
                  <td style={{ border: "1px solid #216974", padding: "8px" }}>{editData.clientEmail}</td>
                  <td
                    style={{
                      border: "1px solid #216974",
                      backgroundColor: "#f5f5f5",
                      padding: "8px",
                      fontWeight: "bold",
                      color: "#216974",
                    }}
                  >
                    GST ID / PAN
                  </td>
                  <td style={{ border: "1px solid #216974", padding: "8px" }}>{editData.clientGSTID || "N/A"}</td>
                </tr>
                <tr>
                  <td
                    style={{
                      border: "1px solid #216974",
                      backgroundColor: "#f5f5f5",
                      padding: "8px",
                      fontWeight: "bold",
                      color: "#216974",
                    }}
                  >
                    ADDRESS
                  </td>
                  <td style={{ border: "1px solid #216974", padding: "8px" }}>{editData.clientAddress}</td>
                  <td
                    style={{
                      border: "1px solid #216974",
                      backgroundColor: "#f5f5f5",
                      padding: "8px",
                      fontWeight: "bold",
                      color: "#216974",
                    }}
                  >
                    MOBILE NUMBER
                  </td>
                  <td style={{ border: "1px solid #216974", padding: "8px" }}>{editData.clientPhone}</td>
                </tr>
              </tbody>
            </table>

            {/* Service Details Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px", fontSize: "10px" }}>
              <thead>
                <tr style={{ backgroundColor: "#216974", color: "white" }}>
                  <th style={{ border: "1px solid #216974", padding: "8px", textAlign: "left", fontWeight: "bold" }}>
                    DATE
                  </th>
                  <th style={{ border: "1px solid #216974", padding: "8px", textAlign: "left", fontWeight: "bold" }}>
                    DESCRIPTION
                  </th>
                  <th style={{ border: "1px solid #216974", padding: "8px", textAlign: "center", fontWeight: "bold" }}>
                    QTY/HR
                  </th>
                  <th style={{ border: "1px solid #216974", padding: "8px", textAlign: "center", fontWeight: "bold" }}>
                    RATE
                  </th>
                  <th style={{ border: "1px solid #216974", padding: "8px", textAlign: "right", fontWeight: "bold" }}>
                    AMOUNT IN RUPEES
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: "1px solid #216974", padding: "8px" }}>{editData.servicePeriodFrom}</td>
                  <td style={{ border: "1px solid #216974", padding: "8px" }}>
                    <div style={{ fontWeight: "bold" }}>{editData.serviceDescription}</div>
                    <div style={{ fontSize: "9px", color: "#666" }}>
                      ({editData.servicePeriodFrom} to {editData.servicePeriodTo})
                    </div>
                  </td>
                  <td style={{ border: "1px solid #216974", padding: "8px", textAlign: "center" }}>
                    {editData.hours || "-"}
                  </td>
                  <td style={{ border: "1px solid #216974", padding: "8px", textAlign: "center" }}>-</td>
                  <td style={{ border: "1px solid #216974", padding: "8px", textAlign: "right", fontWeight: "bold" }}>
                    {formatCurrency(editData.amount)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Tax Calculation Table */}
            <table
              style={{
                width: "45%",
                borderCollapse: "collapse",
                marginBottom: "20px",
                fontSize: "10px",
                marginLeft: "55%",
              }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      border: "1px solid #216974",
                      backgroundColor: "#f5f5f5",
                      padding: "8px",
                      fontWeight: "bold",
                      color: "#216974",
                    }}
                  >
                    Subtotal
                  </td>
                  <td style={{ border: "1px solid #216974", padding: "8px", textAlign: "right", fontWeight: "bold" }}>
                    {formatCurrency(editData.amount)}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      border: "1px solid #216974",
                      backgroundColor: "#f5f5f5",
                      padding: "8px",
                      fontWeight: "bold",
                      color: "#216974",
                    }}
                  >
                    CGST
                  </td>
                  <td style={{ border: "1px solid #216974", padding: "8px", textAlign: "right" }}>
                    {editData.cgstRate}%
                  </td>
                  <td style={{ border: "1px solid #216974", padding: "8px", textAlign: "right", fontWeight: "bold" }}>
                    {formatCurrency(cgstAmount)}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      border: "1px solid #216974",
                      backgroundColor: "#f5f5f5",
                      padding: "8px",
                      fontWeight: "bold",
                      color: "#216974",
                    }}
                  >
                    SGST
                  </td>
                  <td style={{ border: "1px solid #216974", padding: "8px", textAlign: "right" }}>
                    {editData.sgstRate}%
                  </td>
                  <td style={{ border: "1px solid #216974", padding: "8px", textAlign: "right", fontWeight: "bold" }}>
                    {formatCurrency(sgstAmount)}
                  </td>
                </tr>
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      border: "1px solid #216974",
                      backgroundColor: "#f5f5f5",
                      padding: "8px",
                      fontWeight: "bold",
                      color: "#216974",
                      textAlign: "right",
                    }}
                  >
                    Total GST: {formatCurrency(totalGST)}
                  </td>
                </tr>
                <tr style={{ backgroundColor: "#216974", color: "white" }}>
                  <td
                    colSpan={3}
                    style={{ border: "1px solid #216974", padding: "8px", fontWeight: "bold", textAlign: "right" }}
                  >
                    Total Amount: {formatCurrency(totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ clear: "both" }} />

            {/* Thank You Message */}
            <div
              style={{
                textAlign: "center",
                padding: "15px 0",
                borderTop: "1px solid #ddd",
                borderBottom: "1px solid #ddd",
                margin: "20px 0",
                fontSize: "10px",
              }}
            >
              <div style={{ fontWeight: "bold", color: "#216974", marginBottom: "4px", fontSize: "11px" }}>
                THANK YOU FOR YOUR BUSINESS
              </div>
              <div style={{ color: "#666", fontSize: "9px", lineHeight: "1.4" }}>
                If you have any enquiries concerning this invoice, please contact us. This is an E-Bill and doesn't
                require any signature.
              </div>
            </div>

            {/* Bank Details */}
            <div
              style={{
                border: "1px solid #216974",
                padding: "12px",
                marginBottom: "15px",
                backgroundColor: "#f5f5f5",
                fontSize: "9px",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  color: "#216974",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  fontSize: "10px",
                }}
              >
                BANK ACCOUNT DETAILS
              </div>
              <div style={{ marginBottom: "3px" }}>
                <span style={{ fontWeight: "bold", color: "#216974" }}>Account Holder:</span>{" "}
                {editData.bankAccountHolder}
              </div>
              <div style={{ marginBottom: "3px" }}>
                <span style={{ fontWeight: "bold", color: "#216974" }}>Account Number:</span>{" "}
                {editData.bankAccountNumber}
              </div>
              <div style={{ marginBottom: "3px" }}>
                <span style={{ fontWeight: "bold", color: "#216974" }}>Bank:</span> {editData.bankName}
              </div>
              <div style={{ marginBottom: "3px" }}>
                <span style={{ fontWeight: "bold", color: "#216974" }}>IFSC Code:</span> {editData.ifscCode}
              </div>
              <div>
                <span style={{ fontWeight: "bold", color: "#216974" }}>UPI ID:</span> {editData.upiId}
              </div>
            </div>

            {/* Footer - Address */}
            <div
              style={{
                textAlign: "center",
                fontSize: "8px",
                color: "#666",
                borderTop: "1px solid #ddd",
                paddingTop: "8px",
                lineHeight: "1.4",
              }}
            >
              <div style={{ marginBottom: "3px" }}>
                <span style={{ fontWeight: "bold" }}>Address:</span> {editData.studioAddress}
              </div>
              <div>
                {editData.studioWebsite} | {editData.studioEmail} | Phone: +91 {editData.studioPhone}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          .min-h-screen {
            margin: 0;
            padding: 0;
            background: white;
          }
          #invoice-print {
            box-shadow: none;
            margin: 0;
            padding: 0;
            page-break-after: avoid;
          }
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
