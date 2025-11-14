import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { invoiceNo, clientEmail, clientName, invoice, pdfBase64 } = body

    const apiKey = process.env.RESEND_API_KEY || "re_Kpt5i8k4_65bPLnPqra7uSzgAQf3uHh8L"

    if (!apiKey) {
      const setupMessage =
        "Email service not configured. Please add RESEND_API_KEY to your project's environment variables. Visit https://resend.com to get your API key."
      console.error("[v0] RESEND_API_KEY is missing:", setupMessage)
      return NextResponse.json(
        {
          success: false,
          error: "Email service not configured",
          message: setupMessage,
        },
        { status: 400 },
      )
    }

    console.log("[v0] Attempting to send invoice email via Resend:", {
      to: clientEmail,
      invoiceNo,
      from: "contact@sripadastudios.com",
      hasAttachment: !!pdfBase64,
      pdfBase64Length: pdfBase64?.length || 0,
    })

    const emailContent = generateInvoiceEmail(invoice)

    const requestBody: any = {
      from: "contact@sripadastudios.com",
      to: clientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    }

    // Only add attachment if PDF base64 is provided
    if (pdfBase64) {
      requestBody.attachments = [
        {
          filename: `${invoiceNo}.pdf`,
          content: pdfBase64, // Send base64 directly - Resend will handle it
        },
      ]
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    // Try to parse JSON response from Resend; if parsing fails, fallback to text
    let result: any = null
    let rawText: string | null = null
    try {
      result = await response.json()
    } catch (parseError) {
      try {
        rawText = await response.text()
      } catch (textError) {
        rawText = String(textError)
      }
      result = { message: rawText }
    }

    console.log("[v0] Resend API response status:", response.status)
    console.log("[v0] Resend API response (parsed):", result)
    if (rawText) console.log("[v0] Resend API raw text response:", rawText)

    if (!response.ok) {
      console.error("[v0] Resend API error:", result)
      const errorMessage = result?.message || rawText || "Failed to send invoice email"
      return NextResponse.json(
        { success: false, error: errorMessage, details: result },
        { status: response.status },
      )
    }

    console.log("[v0] Invoice email sent successfully:", {
      to: clientEmail,
      invoiceNo,
      messageId: result.id,
      attachmentCount: pdfBase64 ? 1 : 0,
    })

    return NextResponse.json(
      {
        success: true,
        message: `Invoice ${invoiceNo} sent to ${clientEmail}`,
        messageId: result.id,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Invoice email send error:", error)
    return NextResponse.json({ success: false, error: "Failed to send invoice email" }, { status: 500 })
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
