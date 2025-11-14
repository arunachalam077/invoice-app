"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Trash2, X, Copy } from "lucide-react"
import { useBookings } from "@/context/booking-context"

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedBooking, setSelectedBooking] = useState(null)
  const { bookings, deleteBooking, duplicateBooking } = useBookings()

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const isBooked = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return bookings.find((b) => b.date === dateStr)
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" })

  const handleDuplicate = () => {
    if (selectedBooking) {
      duplicateBooking(selectedBooking.id)
      alert("Booking duplicated successfully! Check the calendar for the new booking.")
      setSelectedBooking(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#216974] to-[#1a5561] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">{monthName}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="p-2 hover:bg-[#154f5f] rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-white" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="p-2 hover:bg-[#154f5f] rounded-lg transition-colors"
            >
              <ChevronRight size={20} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center font-semibold text-[#216974] text-sm py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square"></div>
          ))}

          {days.map((day) => {
            const booking = isBooked(day)
            return (
              <div
                key={day}
                onClick={() => booking && setSelectedBooking(booking)}
                className={`aspect-square p-2 rounded-lg border-2 transition-all cursor-pointer group relative ${
                  booking
                    ? "border-[#216974] bg-[#f0f7f8] hover:shadow-lg"
                    : "border-gray-200 hover:border-[#216974] hover:bg-[#f9f9f9]"
                }`}
              >
                <div className="text-sm font-semibold text-gray-900 mb-1">{day}</div>
                {booking && (
                  <>
                    <div
                      className="w-full h-10 rounded mb-1 bg-cover bg-center"
                      style={{
                        backgroundImage: `url('${booking.image || `/placeholder.svg?height=40&width=80&query=${booking.event}`}')`,
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <div className="text-white text-xs text-center space-y-1">
                        <p className="font-semibold">{booking.event}</p>
                        <p>₹{booking.price?.toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#216974] to-[#1a5561] p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">{selectedBooking.event}</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-white hover:bg-[#154f5f] p-2 rounded transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {selectedBooking.image && (
                <img
                  src={selectedBooking.image || "/placeholder.svg"}
                  alt={selectedBooking.event}
                  className="w-full h-40 object-cover rounded-lg"
                />
              )}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 font-semibold">EVENT NAME</p>
                  <p className="text-lg font-bold text-[#216974]">{selectedBooking.event}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">DATE</p>
                  <p className="text-lg font-bold text-gray-800">{selectedBooking.date}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">PRICE</p>
                  <p className="text-lg font-bold text-[#216974]">₹{selectedBooking.price?.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">HOURS</p>
                  <p className="text-lg font-bold text-gray-800">{selectedBooking.hours || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">CLIENT</p>
                  <p className="text-lg font-bold text-gray-800">{selectedBooking.client}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={handleDuplicate}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  <Copy size={16} />
                  Duplicate
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete this booking?")) {
                      deleteBooking(selectedBooking.id)
                      setSelectedBooking(null)
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
