import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { invoiceNo, clientEmail, clientName, invoice, pdfBase64 } = body

    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey) {
      console.error("[v0] RESEND_API_KEY is missing")
      return NextResponse.json(
        {
          success: false,
          error: "Email service not configured. Please add RESEND_API_KEY to your environment variables.",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Starting invoice email send:", {
      to: clientEmail,
      invoiceNo,
      hasAttachment: !!pdfBase64,
    })

    const emailContent = generateInvoiceEmail(invoice)

    // Convert base64 PDF to Buffer only for size logging
    let cleanBase64 = pdfBase64
    if (pdfBase64) {
      // Remove data URI prefix if present
      cleanBase64 = pdfBase64.includes(",") ? pdfBase64.split(",")[1] : pdfBase64
      console.log("[v0] Cleaned base64 length:", cleanBase64.length)
    }

    // Build request body for Resend
    const requestBody: any = {
      from: "contact@sripadastudios.com",
      to: clientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    }

    // Add attachment if PDF base64 is provided
    if (cleanBase64) {
      requestBody.attachments = [
        {
          filename: `${invoiceNo}.pdf`,
          content: cleanBase64,
        },
      ]
      console.log("[v0] PDF attachment added to request body")
    }

    console.log("[v0] Sending to Resend API with JSON body...")

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    console.log("[v0] Resend response status:", response.status, response.statusText)

    let result: any = null
    let rawText: string | null = null

    try {
      result = await response.json()
      console.log("[v0] Resend JSON response:", result)
    } catch (parseError) {
      try {
        rawText = await response.text()
        console.log("[v0] Resend text response:", rawText)
      } catch (textError) {
        rawText = "Could not read response"
      }
      result = { error: rawText }
    }

    if (!response.ok) {
      const errorMsg = result?.error?.message || result?.error || rawText || "Failed to send email"
      console.error("[v0] Resend API error:", errorMsg)
      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
          status: response.status,
        },
        { status: response.status },
      )
    }

    // Resend returns { id: "..." } on success
    const messageId = result?.id || "sent"
    console.log("[v0] Email sent successfully! Full response:", result)
    console.log("[v0] Message ID:", messageId)

    return NextResponse.json(
      {
        success: true,
        message: `Invoice ${invoiceNo} sent to ${clientEmail}`,
        messageId: messageId,
        fullResponse: result,
      },
      { status: 200 },
    )
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error("[v0] Invoice email error:", errorMsg)
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 },
    )
  }
}

function generateInvoiceEmail(invoice: any) {
  return {
    subject: `Invoice ${invoice.invoiceNo} from ${invoice.studioName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { border-bottom: 3px solid #216974; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { color: #216974; margin: 0; }
          .content { line-height: 1.6; color: #555; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${invoice.studioName}</h1>
            <p>${invoice.studioEmail}</p>
          </div>

          <div class="content">
            <p>Dear ${invoice.clientName},</p>
            <p>Your invoice #${invoice.invoiceNo} is ready. Please find the detailed invoice PDF attached to this email.</p>
            <p><strong>Invoice Details:</strong></p>
            <ul>
              <li>Invoice #: ${invoice.invoiceNo}</li>
              <li>Date: ${invoice.date}</li>
              <li>Amount: ₹${invoice.amount.toLocaleString("en-IN")}</li>
            </ul>
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>© ${new Date().getFullYear()} ${invoice.studioName}. All rights reserved.</p>
            <p>${invoice.studioWebsite}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }
}
