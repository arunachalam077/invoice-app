"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Mail, Shield } from "lucide-react"

function VerifyOTPContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { verifyOTP, resendOTP } = useAuth()
  const [otp, setOtp] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    const emailParam = searchParams.get("email")
    if (emailParam) {
      setEmail(emailParam)
    } else {
      router.push("/login")
    }
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }

    setLoading(true)

    const result = await verifyOTP(email, otp)

    if (result.success) {
      setSuccess("Email verified successfully! Redirecting...")
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } else {
      setError(result.message || "OTP verification failed")
    }

    setLoading(false)
  }

  const handleResendOTP = async () => {
    setResending(true)
    setError("")
    setSuccess("")

    const result = await resendOTP(email)

    if (result.success) {
      setSuccess(result.message || "OTP sent successfully!")
    } else {
      setError(result.message || "Failed to resend OTP")
    }

    setResending(false)
  }

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6)
    setOtp(value)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#216974] to-[#1a5561] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#216974] rounded-full mb-4">
            <Shield className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-[#216974] mb-2">Verify Your Email</h1>
          <p className="text-gray-600">
            We sent a 6-digit code to <span className="font-semibold">{email}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Enter 6-Digit Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={handleOTPChange}
              className="w-full px-4 py-4 text-center text-2xl font-bold tracking-widest border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#216974] focus:border-transparent outline-none transition"
              placeholder="000000"
              maxLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-[#216974] text-white py-3 rounded-lg font-semibold hover:bg-[#1a5561] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
          <button
            onClick={handleResendOTP}
            disabled={resending}
            className="text-[#216974] font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? "Resending..." : "Resend OTP"}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <Mail className="inline mr-2" size={16} />
          Check your spam folder if you don't see the email
        </div>
      </div>
    </div>
  )
}

export default function VerifyOTPPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#216974] to-[#1a5561] flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      }
    >
      <VerifyOTPContent />
    </Suspense>
  )
}
