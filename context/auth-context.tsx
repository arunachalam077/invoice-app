"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  name: string
  studio?: string
  emailVerified: boolean
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; requiresOTP?: boolean }>
  logout: () => void
  register: (email: string, password: string, name: string, studio: string) => Promise<{ success: boolean; message?: string }>
  verifyOTP: (email: string, otp: string) => Promise<{ success: boolean; message?: string }>
  resendOTP: (email: string) => Promise<{ success: boolean; message?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        localStorage.removeItem("authToken")
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      localStorage.removeItem("authToken")
    } finally {
      setLoading(false)
    }
  }

  const register = async (email: string, password: string, name: string, studio: string) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, studio }),
      })

      const data = await response.json()

      if (response.ok) {
        return { success: true, message: data.message }
      } else {
        return { success: false, message: data.error || "Signup failed" }
      }
    } catch (error) {
      return { success: false, message: "Network error. Please try again." }
    }
  }

  const verifyOTP = async (email: string, otp: string) => {
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("authToken", data.token)
        setUser(data.user)
        return { success: true, message: "Email verified successfully" }
      } else {
        return { success: false, message: data.error || "OTP verification failed" }
      }
    } catch (error) {
      return { success: false, message: "Network error. Please try again." }
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.requiresOTP) {
          return { success: true, requiresOTP: true, message: data.message }
        } else {
          localStorage.setItem("authToken", data.token)
          setUser(data.user)
          return { success: true, message: "Login successful" }
        }
      } else {
        return { success: false, message: data.error || "Login failed" }
      }
    } catch (error) {
      return { success: false, message: "Network error. Please try again." }
    }
  }

  const resendOTP = async (email: string) => {
    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        return { success: true, message: data.message }
      } else {
        return { success: false, message: data.error || "Failed to resend OTP" }
      }
    } catch (error) {
      return { success: false, message: "Network error. Please try again." }
    }
  }

  const logout = () => {
    localStorage.removeItem("authToken")
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout, register, verifyOTP, resendOTP }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
