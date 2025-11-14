import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { BookingProvider } from "@/context/booking-context"
import { EmailProvider } from "@/context/email-context"
import { AuthProvider } from "@/context/auth-context"
import { InvoiceProvider } from "@/context/invoice-context"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Studio Pro - Billing & Booking Management",
  description: "Professional booking and billing software for studios",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          <BookingProvider>
            <InvoiceProvider>
              <EmailProvider>{children}</EmailProvider>
            </InvoiceProvider>
          </BookingProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
