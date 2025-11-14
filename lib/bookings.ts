import { prisma } from "./prisma"
import type { Booking } from "@prisma/client"

export const bookingStorage = {
  // Get all bookings for a user
  getAllByUserId: async (userId: string): Promise<Booking[]> => {
    return prisma.booking.findMany({
      where: { userId },
      include: {
        client: true,
        invoice: true,
      },
      orderBy: { eventDate: "desc" },
    })
  },

  // Get booking by ID
  getById: async (id: string): Promise<Booking | null> => {
    return prisma.booking.findUnique({
      where: { id },
      include: {
        client: true,
        invoice: true,
      },
    })
  },

  // Get bookings by date range
  getByDateRange: async (userId: string, startDate: Date, endDate: Date): Promise<Booking[]> => {
    return prisma.booking.findMany({
      where: {
        userId,
        eventDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        client: true,
      },
      orderBy: { eventDate: "asc" },
    })
  },

  // Get bookings for a specific date
  getByDate: async (userId: string, date: Date): Promise<Booking[]> => {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    return prisma.booking.findMany({
      where: {
        userId,
        eventDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        client: true,
      },
      orderBy: { eventDate: "asc" },
    })
  },

  // Check for booking conflicts
  checkConflict: async (userId: string, eventDate: Date, eventTime: string, duration: number): Promise<{ hasConflict: boolean; conflictingBookings: any[] }> => {
    try {
      // Parse the event time (format: HH:MM)
      const [hours, minutes] = eventTime.split(":").map(Number)
      
      // Create start time for the booking
      const bookingStart = new Date(eventDate)
      bookingStart.setHours(hours, minutes, 0, 0)
      
      // Create end time based on duration
      const bookingEnd = new Date(bookingStart)
      bookingEnd.setHours(bookingStart.getHours() + (duration || 1), bookingStart.getMinutes(), 0, 0)

      // Get all bookings for the same day
      const dayStart = new Date(eventDate)
      dayStart.setHours(0, 0, 0, 0)
      
      const dayEnd = new Date(eventDate)
      dayEnd.setHours(23, 59, 59, 999)

      const existingBookings = await prisma.booking.findMany({
        where: {
          userId,
          eventDate: {
            gte: dayStart,
            lte: dayEnd,
          },
          status: {
            in: ["pending", "confirmed"], // Only check active bookings
          },
        },
        include: {
          client: true,
        },
      })

      // Check for time conflicts
      const conflictingBookings = existingBookings.filter((booking) => {
        if (!booking.eventTime) return false

        const [existingHours, existingMinutes] = booking.eventTime.split(":").map(Number)
        const existingStart = new Date(booking.eventDate)
        existingStart.setHours(existingHours, existingMinutes, 0, 0)

        const existingEnd = new Date(existingStart)
        existingEnd.setHours(existingStart.getHours() + (booking.duration || 1), existingStart.getMinutes(), 0, 0)

        // Check if time slots overlap
        return bookingStart < existingEnd && bookingEnd > existingStart
      })

      return {
        hasConflict: conflictingBookings.length > 0,
        conflictingBookings,
      }
    } catch (error) {
      console.error("Error checking booking conflict:", error)
      return { hasConflict: false, conflictingBookings: [] }
    }
  },

  // Get available time slots for a specific date
  getAvailableSlots: async (userId: string, eventDate: Date, duration: number = 1): Promise<string[]> => {
    try {
      const dayStart = new Date(eventDate)
      dayStart.setHours(0, 0, 0, 0)
      
      const dayEnd = new Date(eventDate)
      dayEnd.setHours(23, 59, 59, 999)

      const existingBookings = await prisma.booking.findMany({
        where: {
          userId,
          eventDate: {
            gte: dayStart,
            lte: dayEnd,
          },
          status: {
            in: ["pending", "confirmed"],
          },
        },
      })

      // Generate all possible time slots (hourly from 8 AM to 10 PM)
      const allSlots: string[] = []
      for (let hour = 8; hour < 22; hour++) {
        allSlots.push(`${hour.toString().padStart(2, "0")}:00`)
      }

      // Filter out booked slots
      const availableSlots = allSlots.filter((slot) => {
        const [slotHours, slotMinutes] = slot.split(":").map(Number)
        const slotStart = new Date(eventDate)
        slotStart.setHours(slotHours, slotMinutes, 0, 0)

        const slotEnd = new Date(slotStart)
        slotEnd.setHours(slotStart.getHours() + duration, slotStart.getMinutes(), 0, 0)

        return !existingBookings.some((booking) => {
          if (!booking.eventTime) return false
          const [existingHours, existingMinutes] = booking.eventTime.split(":").map(Number)
          const existingStart = new Date(booking.eventDate)
          existingStart.setHours(existingHours, existingMinutes, 0, 0)

          const existingEnd = new Date(existingStart)
          existingEnd.setHours(existingStart.getHours() + (booking.duration || 1), existingStart.getMinutes(), 0, 0)

          return slotStart < existingEnd && slotEnd > existingStart
        })
      })

      return availableSlots
    } catch (error) {
      console.error("Error getting available slots:", error)
      return []
    }
  },

  // Create booking
  create: async (userId: string, data: any): Promise<Booking> => {
    // Map fields from old format to new schema
    const bookingData = {
      clientId: data.clientId,
      eventName: data.eventName || data.event, // Support both old and new field names
      eventDate: data.eventDate || new Date(data.date), // Convert date string to Date object
      eventTime: data.eventTime || data.time,
      duration: data.duration || data.hours,
      location: data.location,
      status: data.status || "pending",
      notes: data.notes || data.description,
      amount: data.amount || data.price,
    }

    return prisma.booking.create({
      data: {
        ...bookingData,
        userId,
      },
      include: {
        client: true,
      },
    })
  },

  // Update booking
  update: async (id: string, data: any): Promise<Booking> => {
    // Map fields from old format to new schema
    const bookingData: any = {}
    
    if (data.eventName) bookingData.eventName = data.eventName
    if (data.event) bookingData.eventName = data.event
    if (data.eventDate) bookingData.eventDate = data.eventDate
    if (data.date) bookingData.eventDate = new Date(data.date)
    if (data.eventTime) bookingData.eventTime = data.eventTime
    if (data.time) bookingData.eventTime = data.time
    if (data.duration) bookingData.duration = data.duration
    if (data.hours) bookingData.duration = data.hours
    if (data.location) bookingData.location = data.location
    if (data.status) bookingData.status = data.status
    if (data.notes) bookingData.notes = data.notes
    if (data.description) bookingData.notes = data.description
    if (data.amount) bookingData.amount = data.amount
    if (data.price) bookingData.amount = data.price

    return prisma.booking.update({
      where: { id },
      data: bookingData,
      include: {
        client: true,
      },
    })
  },

  // Update booking status
  updateStatus: async (id: string, status: string): Promise<Booking> => {
    return prisma.booking.update({
      where: { id },
      data: { status },
    })
  },

  // Delete booking
  delete: async (id: string): Promise<Booking> => {
    return prisma.booking.delete({
      where: { id },
    })
  },

  // Get upcoming bookings
  getUpcoming: async (userId: string, limit: number = 10): Promise<Booking[]> => {
    const now = new Date()

    return prisma.booking.findMany({
      where: {
        userId,
        eventDate: {
          gte: now,
        },
      },
      include: {
        client: true,
      },
      orderBy: { eventDate: "asc" },
      take: limit,
    })
  },

  // Get booking statistics
  getStats: async (userId: string) => {
    const bookings = await prisma.booking.findMany({
      where: { userId },
    })

    const totalBookings = bookings.length
    const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length
    const pendingBookings = bookings.filter((b) => b.status === "pending").length
    const completedBookings = bookings.filter((b) => b.status === "completed").length
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.amount || 0), 0)

    return {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      completedBookings,
      totalRevenue,
    }
  },
}
