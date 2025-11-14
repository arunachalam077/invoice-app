"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Mail, Lock, Building2, User } from "lucide-react"

interface LoginPageProps {
  onLoginSuccess: () => void
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { login, register } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    studio: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        await register(formData.email, formData.password, formData.name, formData.studio)
      } else {
        await login(formData.email, formData.password)
      }
      onLoginSuccess()
    } catch (error) {
      console.error("Auth error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f3a47] via-[#1a5561] to-[#216974] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#216974] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-[#1a5561] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#216974] to-[#1a5561] px-8 py-12 text-white text-center">
            <h1 className="text-3xl font-bold mb-2">Sripada Studios</h1>
            <p className="text-[#a8d5e0] text-sm">Booking & Billing Management</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">{isSignUp ? "Create Account" : "Welcome Back"}</h2>
            <p className="text-gray-600 text-sm mb-6">
              {isSignUp ? "Set up your studio billing system" : "Access your studio dashboard"}
            </p>

            {/* Email Input */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-[#216974] w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#216974] focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            {/* Name Input (Sign Up) */}
            {isSignUp && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-[#216974] w-5 h-5" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#216974] focus:border-transparent transition"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            {/* Studio Name Input (Sign Up) */}
            {isSignUp && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Studio Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 text-[#216974] w-5 h-5" />
                  <input
                    type="text"
                    name="studio"
                    value={formData.studio}
                    onChange={handleChange}
                    placeholder="My Photography Studio"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#216974] focus:border-transparent transition"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            {/* Password Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-[#216974] w-5 h-5" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#216974] focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#216974] to-[#1a5561] text-white font-semibold py-2.5 rounded-lg hover:shadow-lg transition transform hover:scale-105 disabled:opacity-50"
            >
              {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
            </button>

            {/* Toggle Sign Up/Login */}
            <div className="mt-6 text-center border-t border-gray-200 pt-6">
              <p className="text-gray-600 text-sm mb-3">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}
              </p>
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[#216974] font-semibold hover:underline text-sm"
              >
                {isSignUp ? "Sign In" : "Create Account"}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-200">
            <p className="text-gray-600 text-xs">Secure login • Your data is encrypted and protected</p>
          </div>
        </div>
      </div>
    </div>
  )
}
