"use client"

import { createContext, useContext, type ReactNode } from "react"

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  type: "booking" | "invoice" | "receipt" | "reminder"
}

interface EmailContextType {
  sendEmail: (to: string, subject: string, body: string) => Promise<void>
  generateReceiptTemplate: (bookingData: any) => string
  generateInvoiceTemplate: (invoiceData: any) => string
  generateReceiptEmail: (booking: any) => { subject: string; body: string }
  generateInvoiceEmail: (invoice: any) => { subject: string; body: string }
  generateMorningNotificationEmail: (booking: any) => { subject: string; body: string }
}

const EmailContext = createContext<EmailContextType | undefined>(undefined)

const STUDIO_EMAIL = "contact@sripadastudios.com"

export function EmailProvider({ children }: { children: ReactNode }) {
  const sendEmail = async (to: string, subject: string, body: string) => {
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to,
          subject,
          html: body,
          from: STUDIO_EMAIL,
        }),
      })

      // Safe response parsing: prefer JSON, fall back to text
      let result: any = null
      try {
        result = await response.json()
      } catch (err) {
        const raw = await response.text().catch(() => String(err))
        result = { error: raw }
      }

      if (!response.ok) {
        const errorMsg = result?.error || result?.message || `HTTP ${response.status}`
        console.error("[v0] Email send error:", errorMsg)
        // Provide clearer guidance for large payloads
        if (response.status === 413) {
          throw new Error("Request too large. Reduce PDF size or deploy to a host that accepts larger request bodies.")
        }
        throw new Error(errorMsg || "Failed to send email")
      }
      console.log("[v0] Email sent successfully to:", to)
    } catch (error) {
      console.error("[v0] Email sending failed:", error)
      throw error
    }
  }

  const generateReceiptTemplate = (bookingData: any): string => {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Booking Confirmation Receipt</h2>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
            
            <p><strong>Booking ID:</strong> #${bookingData.id}</p>
            <p><strong>Client:</strong> ${bookingData.client}</p>
            <p><strong>Event:</strong> ${bookingData.event}</p>
            <p><strong>Date:</strong> ${bookingData.date}</p>
            ${bookingData.time ? `<p><strong>Time:</strong> ${bookingData.time}</p>` : ""}
            <p><strong>Amount:</strong> ₹${bookingData.price?.toLocaleString("en-IN")}</p>
            ${bookingData.hours ? `<p><strong>Hours:</strong> ${bookingData.hours}</p>` : ""}
            ${bookingData.description ? `<p><strong>Details:</strong> ${bookingData.description}</p>` : ""}
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
            <p>Thank you for booking with us! We look forward to working with you.</p>
            <p style="color: #666; font-size: 12px;">
              If you have any questions, please contact us at <strong>${STUDIO_EMAIL}</strong>
            </p>
          </div>
        </body>
      </html>
    `
  }

  const generateInvoiceTemplate = (invoiceData: any): string => {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1>INVOICE</h1>
            <p><strong>Invoice #:</strong> ${invoiceData.invoiceNo}</p>
            <p><strong>Status:</strong> <span style="color: ${invoiceData.status === "paid" ? "green" : invoiceData.status === "pending" ? "orange" : "red"};">${invoiceData.status.toUpperCase()}</span></p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
            
            <h3>Bill To:</h3>
            <p><strong>${invoiceData.clientName}</strong></p>
            <p>${invoiceData.email}</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
            
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f5f5f5;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Description</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #ddd;">${invoiceData.event}</td>
                  <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">₹${invoiceData.amount?.toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>
            
            <hr style="border: none; border-top: 2px solid #333; margin: 20px 0;" />
            <div style="text-align: right; font-size: 18px; font-weight: bold;">
              Total: ₹${invoiceData.amount?.toLocaleString("en-IN")}
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">
              Thank you for your business! For inquiries, contact us at <strong>${STUDIO_EMAIL}</strong>
            </p>
          </div>
        </body>
      </html>
    `
  }

  const generateMorningNotificationEmail = (booking: any) => {
    const bookingDate = new Date(booking.date).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    return {
      subject: `Morning Reminder: Booking Today - ${booking.event}`,
      body: `
        <html>
          <body style="font-family: Arial, sans-serif; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb;">Good Morning! 🌅</h2>
              <p>You have a booking scheduled for <strong>TODAY</strong></p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
              
              <div style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #2563eb; border-radius: 4px;">
                <p><strong style="font-size: 16px;">📅 Booking Details</strong></p>
                <p><strong>Client:</strong> ${booking.client}</p>
                <p><strong>Event:</strong> ${booking.event}</p>
                <p><strong>Date:</strong> ${bookingDate}</p>
                ${booking.time ? `<p><strong>Time:</strong> ${booking.time}</p>` : "<p><strong>Time:</strong> Not specified</p>"}
                <p><strong>Duration:</strong> ${booking.hours || 1} hour(s)</p>
                <p><strong>Amount:</strong> ₹${booking.price?.toLocaleString("en-IN") || "0"}</p>
                ${booking.description ? `<p><strong>Notes:</strong> ${booking.description}</p>` : ""}
              </div>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
              <p style="color: #666;">Please prepare the studio accordingly. For any updates, contact the client directly.</p>
              <p style="color: #666; font-size: 12px;">
                Sent from Sripada Studios | <strong>${STUDIO_EMAIL}</strong>
              </p>
            </div>
          </body>
        </html>
      `,
    }
  }

  const generateReceiptEmail = (booking: any) => {
    return {
      subject: `Booking Confirmation - ${booking.event} on ${booking.date}`,
      body: generateReceiptTemplate(booking),
    }
  }

  const generateInvoiceEmail = (invoice: any) => {
    return {
      subject: `Invoice ${invoice.invoiceNo} from Sripada Studios`,
      body: generateInvoiceTemplate(invoice),
    }
  }

  return (
    <EmailContext.Provider
      value={{
        sendEmail,
        generateReceiptTemplate,
        generateInvoiceTemplate,
        generateReceiptEmail,
        generateInvoiceEmail,
        generateMorningNotificationEmail,
      }}
    >
      {children}
    </EmailContext.Provider>
  )
}

export function useEmail() {
  const context = useContext(EmailContext)
  if (context === undefined) {
    throw new Error("useEmail must be used within an EmailProvider")
  }
  return context
}
