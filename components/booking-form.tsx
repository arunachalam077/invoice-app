"use client"

import type React from "react"
import { useState } from "react"
import { useBookings } from "@/context/booking-context"
import { useInvoices } from "@/context/invoice-context"
import EmailReceiptModal from "@/components/email-receipt-modal"

export default function BookingForm() {
  const { addBooking } = useBookings()
  const { addInvoice } = useInvoices()
  const [formData, setFormData] = useState({
    clientName: "",
    email: "",
    phone: "",
    event: "",
    date: "",
    time: "",
    hours: "",
    amount: "",
    description: "",
    clientGSTID: "",
    clientAddress: "",
  })
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [lastBooking, setLastBooking] = useState<any>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, "0")
    const random = Math.floor(Math.random() * 999)
    return `INV-${year}-${month}-${String(random).padStart(3, "0")}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.clientName ||
      !formData.email ||
      !formData.event ||
      !formData.date ||
      !formData.amount ||
      !formData.hours ||
      !formData.time
    ) {
      alert("Please fill in all required fields including time and hours")
      return
    }

    try {
      const token = localStorage.getItem("authToken")

      // Check for booking conflicts
      const conflictResponse = await fetch("/api/bookings/check-conflict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventDate: new Date(formData.date).toISOString(),
          eventTime: formData.time,
          duration: Number.parseFloat(formData.hours),
        }),
      })

      if (conflictResponse.ok) {
        const conflictData = await conflictResponse.json()

        if (conflictData.hasConflict) {
          const conflictingBookings = conflictData.conflictingBookings
          let conflictMessage = "⚠️ This time slot is already booked!\n\n"
          conflictMessage += "Conflicting bookings:\n"

          conflictingBookings.forEach((booking: any) => {
            conflictMessage += `• ${booking.clientName} - ${booking.eventName} at ${booking.eventTime} (${booking.duration}hr${booking.duration > 1 ? "s" : ""})\n`
          })

          conflictMessage += "\n❌ Please choose a different time or date.\n\nWould you like to see available time slots?"

          const showSlots = confirm(conflictMessage)

          if (showSlots) {
            // Get available slots
            const slotsResponse = await fetch(
              `/api/bookings/check-conflict?date=${new Date(formData.date).toISOString()}&duration=${formData.hours}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            )

            if (slotsResponse.ok) {
              const slotsData = await slotsResponse.json()
              const availableSlots = slotsData.availableSlots

              if (availableSlots.length > 0) {
                alert(
                  `Available time slots for ${formData.date}:\n\n${availableSlots.join(
                    "\n"
                  )}\n\nPlease select one of these times.`
                )
              } else {
                alert(
                  `No available time slots for ${formData.date}. Please choose a different date.`
                )
              }
            }
          }

          return
        }
      }

      const bookingDate = new Date(formData.date).toISOString().split("T")[0]
      const today = new Date().toISOString().split("T")[0]
      const isBookingForToday = bookingDate === today

      // Create or find client first
      const clientResponse = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.clientName,
          email: formData.email,
          phone: formData.phone || "",
          address: formData.clientAddress || "",
          gstId: formData.clientGSTID || "",
        }),
      })

      if (!clientResponse.ok) {
        throw new Error("Failed to create client")
      }

      const clientData = await clientResponse.json()
      const clientId = clientData.client.id

      // Create booking with correct field names for Prisma schema
      const bookingData = {
        clientId: clientId,
        eventName: formData.event,
        eventDate: new Date(formData.date),
        eventTime: formData.time || "",
        duration: Number.parseFloat(formData.hours),
        notes: formData.description || "",
        amount: Number.parseFloat(formData.amount),
        status: "pending",
      }

      await addBooking(bookingData)

      if (isBookingForToday) {
        console.log(`[v0] Today's booking detected for ${formData.clientName}. Morning notification scheduled.`)
        // Email will be shown in the receipt modal
      }

      const newBooking = {
        id: Date.now().toString(),
        client: formData.clientName,
        email: formData.email,
        phone: formData.phone,
        event: formData.event,
        date: formData.date,
        time: formData.time,
        price: Number.parseFloat(formData.amount),
        description: formData.description,
        image: "/placeholder.svg?key=37odq",
        hours: Number.parseFloat(formData.hours),
      }

      // Now create the invoice with the correct client ID
      const invoiceNo = generateInvoiceNumber()
      const serviceDate = new Date(formData.date)

      const newInvoice = {
        invoiceNo: invoiceNo,
        clientId: clientId,
        amount: newBooking.price,
        serviceDescription: formData.event,
        servicePeriodFrom: serviceDate,
        servicePeriodTo: new Date(serviceDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        date: new Date(),
        status: "draft" as const,
        hours: formData.hours || "1",
        cgstRate: 9,
        sgstRate: 9,
        gstNumber: "29DUDPP66,66M1Z0",
        sacHsn: "999612",
        studioName: "Sripada Studios",
        studioGSTNumber: "29DUDPP66,66M1Z0",
        studioAddress: "3086/7, 1st Floor, 8th 'C' Cross, 14th 'B' Main Road Hampinagar, Bengaluru- 560 040",
        studioPhone: "9060870117",
        studioWebsite: "www.sripadastudios.com",
        studioEmail: "contact@sripadastudios.com",
        bankAccountHolder: "Sripada Studios",
        bankAccountNumber: "8447340208",
        bankName: "Kotak Bank, Vijayanagar",
        ifscCode: "KKBK0008067",
        upiId: "sripadastudios@ybl",
      }

      await addInvoice(newInvoice)

      setLastBooking(newBooking)
      alert("Booking created successfully! Invoice generated automatically.")
      setShowReceiptModal(true)

      setFormData({
        clientName: "",
        email: "",
        phone: "",
        event: "",
        date: "",
        time: "",
        hours: "",
        amount: "",
        description: "",
        clientGSTID: "",
        clientAddress: "",
      })
    } catch (error) {
      console.error("Failed to create booking/invoice:", error)
      alert("Failed to create booking. Please try again.")
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
        <div className="flex items-center gap-3 mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">New Booking</h3>
            <p className="text-xs text-gray-600">Sripada Studios</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Client Name *</label>
            <input
              type="text"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">GST ID / PAN</label>
            <input
              type="text"
              name="clientGSTID"
              value={formData.clientGSTID}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Client Address</label>
            <textarea
              name="clientAddress"
              value={formData.clientAddress}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Event Type *</label>
            <select
              name="event"
              value={formData.event}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select event type</option>
              <option value="Photography Session">Photography Session</option>
              <option value="Video Production">Video Production</option>
              <option value="Podcast Recording">Podcast Recording</option>
              <option value="Music Production">Music Production</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Hours *</label>
            <input
              type="number"
              name="hours"
              value={formData.hours}
              onChange={handleChange}
              step="0.5"
              min="0"
              placeholder="e.g., 4, 8, 24"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹) *</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Create Booking
          </button>
        </form>
      </div>

      {showReceiptModal && lastBooking && (
        <EmailReceiptModal booking={lastBooking} onClose={() => setShowReceiptModal(false)} />
      )}
    </>
  )
}
