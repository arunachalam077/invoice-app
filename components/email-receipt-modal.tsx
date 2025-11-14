"use client"

import { useState } from "react"
import { Mail, X, Copy, Check, AlertCircle } from "lucide-react"
import { useEmail } from "@/context/email-context"

interface EmailReceiptModalProps {
  booking?: any
  invoice?: any
  onClose: () => void
}

export default function EmailReceiptModal({ booking, invoice, onClose }: EmailReceiptModalProps) {
  const { generateReceiptEmail, generateInvoiceEmail, sendEmail } = useEmail()
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isReceipt = !!booking
  const data = booking || invoice
  const email = isReceipt ? generateReceiptEmail(booking) : generateInvoiceEmail(invoice)

  const handleCopy = () => {
    navigator.clipboard.writeText(email.body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSend = async () => {
    setSending(true)
    setError(null)
    try {
      await sendEmail(data.email, email.subject, email.body)
      alert(`Email sent to ${data.email}!`)
      onClose()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to send email"
      console.error("[v0] Send email error:", errorMsg)

      if (
        errorMsg.includes("not configured") ||
        errorMsg.includes("RESEND_API_KEY") ||
        errorMsg.includes("Email service")
      ) {
        setError(
          "Email service not configured. To enable email sending:\n\n1. Go to https://resend.com and create a free account\n2. Get your API key from the Resend dashboard\n3. Add it to your project's Vars section with key: RESEND_API_KEY",
        )
      } else {
        setError(errorMsg)
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Mail className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold text-slate-900">{isReceipt ? "Send Booking Receipt" : "Send Invoice"}</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <X size={24} />
          </button>
        </div>

        {/* Email Details */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">To:</label>
            <input
              type="email"
              value={data.email}
              disabled
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Subject:</label>
            <input
              type="text"
              value={email.subject}
              disabled
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Message Preview:</label>
            <div
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 text-sm max-h-48 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: email.body }}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <div>
              <p className="text-sm font-semibold text-red-900">Setup Required</p>
              <p className="text-sm text-red-700 mt-1 whitespace-pre-wrap">{error}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {copied ? (
              <>
                <Check size={18} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={18} />
                Copy HTML
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg transition-colors font-medium"
          >
            {sending ? "Sending..." : "Send Email"}
          </button>
        </div>
      </div>
    </div>
  )
}
