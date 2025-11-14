"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import CalendarView from "@/components/calendar-view"
import BookingForm from "@/components/booking-form"
import InvoiceList from "@/components/invoice-list"
import AnalyticsDashboard from "@/components/analytics-dashboard"
import InvoiceAnalytics from "@/components/invoice-analytics"
import { Mail, Lock } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const { isAuthenticated, logout, loading, login } = useAuth()
  const [activeTab, setActiveTab] = useState("calendar")
  const router = useRouter()
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields")
      return
    }

    setIsLoggingIn(true)

    const result = await login(formData.email, formData.password)

    if (result.success) {
      if (result.requiresOTP) {
        router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`)
      }
    } else {
      setError(result.message || "Login failed")
    }

    setIsLoggingIn(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#216974]"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#216974] to-[#1a5561] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <img 
                src="/sripada-logo.svg" 
                alt="Sripada Studios" 
                className="h-auto w-48"
              />
            </div>
            <h1 className="text-3xl font-bold text-[#216974] mb-2">Welcome Back</h1>
            <p className="text-gray-600">Log in to Sripada Studios</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#216974] focus:border-transparent outline-none transition"
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#216974] focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-[#216974] text-white py-3 rounded-lg font-semibold hover:bg-[#1a5561] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? "Logging in..." : "Log In"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/signup" className="text-[#216974] font-semibold hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f3a47] via-[#f8f9fa] to-slate-50">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} onLogout={logout} />

      <div className="container mx-auto px-4 py-8">
        {activeTab === "calendar" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <CalendarView />
            </div>
            <div>
              <BookingForm />
            </div>
          </div>
        )}

        {activeTab === "invoices" && <InvoiceList />}

        {activeTab === "invoice-analytics" && <InvoiceAnalytics />}

        {activeTab === "analytics" && <AnalyticsDashboard />}

        {activeTab === "settings" && <SettingsPanel />}
      </div>
    </main>
  )
}

function SettingsPanel() {
  const [studioName, setStudioName] = useState("My Studio")
  const [invoiceEmail, setInvoiceEmail] = useState("studio@example.com")
  const [invoicePrefix, setInvoicePrefix] = useState("INV-")
  const [studioAddress, setStudioAddress] = useState("123 Studio Street, City, State")
  const [studioPhone, setStudioPhone] = useState("+1 (555) 123-4567")
  const [taxRate, setTaxRate] = useState("0")
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = () => {
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
    console.log("[v0] Settings saved:", {
      studioName,
      invoiceEmail,
      invoicePrefix,
      studioAddress,
      studioPhone,
      taxRate,
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#216974] mb-2">Settings</h2>
        <p className="text-gray-600">Configure your studio billing preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Studio Name</label>
          <input
            type="text"
            value={studioName}
            onChange={(e) => setStudioName(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#216974] focus:border-transparent transition"
            placeholder="Enter studio name"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email for Invoices</label>
          <input
            type="email"
            value={invoiceEmail}
            onChange={(e) => setInvoiceEmail(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#216974] focus:border-transparent transition"
            placeholder="studio@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Invoice Prefix</label>
          <input
            type="text"
            value={invoicePrefix}
            onChange={(e) => setInvoicePrefix(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#216974] focus:border-transparent transition"
            placeholder="INV-"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Tax Rate (%)</label>
          <input
            type="number"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#216974] focus:border-transparent transition"
            placeholder="0"
            min="0"
            max="100"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Studio Address</label>
          <textarea
            value={studioAddress}
            onChange={(e) => setStudioAddress(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#216974] focus:border-transparent transition"
            placeholder="Enter studio address"
            rows={2}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
          <input
            type="tel"
            value={studioPhone}
            onChange={(e) => setStudioPhone(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#216974] focus:border-transparent transition"
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t border-gray-200">
        <button
          onClick={handleSave}
          className={`px-8 py-2.5 rounded-lg font-semibold text-white transition ${
            isSaved ? "bg-green-600" : "bg-[#216974] hover:bg-[#1a5561]"
          }`}
        >
          {isSaved ? "✓ Saved" : "Save Settings"}
        </button>
      </div>
    </div>
  )
}
