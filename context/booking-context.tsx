"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface Booking {
  id: string
  date: string
  event: string
  image: string
  price: number
  client: string
  email: string
  phone: string
  description: string
  time?: string
  hours?: number
  clientGSTID?: string
  clientAddress?: string
}

interface BookingContextType {
  bookings: Booking[]
  addBooking: (booking: Omit<Booking, "id">) => Promise<void>
  deleteBooking: (id: string) => Promise<void>
  updateBooking: (id: string, booking: Booking) => Promise<void>
  duplicateBooking: (id: string) => Promise<void>
  loading: boolean
}

const BookingContext = createContext<BookingContextType | undefined>(undefined)

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken")
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  // Load bookings on mount
  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch("/api/bookings", {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        // Transform bookings from API to match UI expectations
        const transformedBookings = (data.bookings || []).map((booking: any) => ({
          id: booking.id,
          date: new Date(booking.eventDate).toISOString().split("T")[0], // Convert eventDate to YYYY-MM-DD
          event: booking.eventName,
          image: "/placeholder.svg?key=37odq",
          price: booking.amount || 0,
          client: booking.client?.name || "",
          email: booking.client?.email || "",
          phone: booking.client?.phone || "",
          description: booking.notes || "",
          time: booking.eventTime || "",
          hours: booking.duration || 0,
          clientGSTID: booking.client?.gstId || "",
          clientAddress: booking.client?.address || "",
        }))
        setBookings(transformedBookings)
      }
    } catch (error) {
      console.error("Failed to load bookings:", error)
    } finally {
      setLoading(false)
    }
  }

  const addBooking = async (booking: Omit<Booking, "id">) => {
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(booking),
      })

      if (response.ok) {
        // Reload bookings to get the transformed data with client info
        await loadBookings()
      }
    } catch (error) {
      console.error("Failed to add booking:", error)
      throw error
    }
  }

  const deleteBooking = async (id: string) => {
    try {
      const response = await fetch(`/api/bookings?id=${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        setBookings((prev) => prev.filter((b) => b.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete booking:", error)
      throw error
    }
  }

  const updateBooking = async (id: string, booking: Booking) => {
    try {
      const response = await fetch("/api/bookings", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, ...booking }),
      })

      if (response.ok) {
        setBookings((prev) => prev.map((b) => (b.id === id ? booking : b)))
      }
    } catch (error) {
      console.error("Failed to update booking:", error)
      throw error
    }
  }

  const duplicateBooking = async (id: string) => {
    const bookingToDuplicate = bookings.find((b) => b.id === id)
    if (bookingToDuplicate) {
      const { id: _, ...bookingData } = bookingToDuplicate
      await addBooking(bookingData)
    }
  }

  return (
    <BookingContext.Provider value={{ bookings, addBooking, deleteBooking, updateBooking, duplicateBooking, loading }}>
      {children}
    </BookingContext.Provider>
  )
}

export function useBookings() {
  const context = useContext(BookingContext)
  if (context === undefined) {
    throw new Error("useBookings must be used within a BookingProvider")
  }
  return context
}
