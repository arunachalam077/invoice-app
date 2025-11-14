"use client"
import { useBookings } from "@/context/booking-context"
import { useInvoices } from "@/context/invoice-context"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function AnalyticsDashboard() {
  const { bookings } = useBookings()
  const { invoices } = useInvoices()

  // Calculate analytics
  const totalBookings = bookings.length
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0)
  const totalInvoices = invoices.length
  const paidAmount = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + (i.amount || 0), 0)

  // Group bookings by month for chart
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(2025, i, 1).toLocaleString("default", { month: "short" })
    const monthStr = String(i + 1).padStart(2, "0")
    const monthBookings = bookings.filter((b) => b.date?.includes(`2025-${monthStr}`))
    return {
      month,
      bookings: monthBookings.length,
      revenue: monthBookings.reduce((sum, b) => sum + (b.price || 0), 0),
    }
  }).filter((d) => d.bookings > 0 || d.revenue > 0)

  const invoiceStatusData = [
    { name: "Draft", value: invoices.filter((i) => i.status === "draft").length, color: "#CBD5E1" },
    { name: "Sent", value: invoices.filter((i) => i.status === "sent").length, color: "#3B82F6" },
    { name: "Paid", value: invoices.filter((i) => i.status === "paid").length, color: "#10B981" },
    { name: "Overdue", value: invoices.filter((i) => i.status === "overdue").length, color: "#EF4444" },
  ].filter((d) => d.value > 0)

  const pendingAmount = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((sum, i) => sum + (i.amount || 0), 0)
  const conversionRate = totalInvoices > 0 ? ((paidAmount / totalRevenue) * 100).toFixed(1) : 0

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header with Logo on Left */}
      <div className="bg-white rounded-lg shadow-md p-6 border-b-4 border-[#216974]">
        <div className="flex items-center gap-4 mb-4">
          <img src="/sripada-logo-compact.svg" alt="Sripada Studios" className="h-16 w-auto" />
          <div>
            <h2 className="text-3xl font-bold text-[#216974]">Analytics Dashboard</h2>
            <p className="text-gray-600">View your bookings and revenue performance</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-[#216974]">₹{totalRevenue.toLocaleString("en-IN")}</p>
            </div>
            <div className="text-4xl text-blue-500">💵</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Bookings</p>
              <p className="text-3xl font-bold text-[#216974]">{totalBookings}</p>
            </div>
            <div className="text-4xl text-purple-500">📅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Unique Clients</p>
              <p className="text-3xl font-bold text-[#216974]">{new Set(bookings.map((b) => b.client)).size}</p>
            </div>
            <div className="text-4xl text-green-500">👥</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Avg Booking Value</p>
              <p className="text-3xl font-bold text-[#216974]">
                ₹
                {totalBookings > 0
                  ? (totalRevenue / totalBookings).toLocaleString("en-IN", { maximumFractionDigits: 2 })
                  : 0}
              </p>
            </div>
            <div className="text-4xl text-orange-500">📈</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Revenue Trend</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value.toLocaleString("en-IN")}`} />
                <Bar dataKey="revenue" fill="#7C5FA8" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-600 text-center py-8">No data available</p>
          )}
        </div>

        {/* Revenue by Event Type */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue by Event Type</h3>
          {bookings.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={Object.values(
                      bookings.reduce(
                        (acc, booking) => {
                          if (!acc[booking.event]) {
                            acc[booking.event] = { name: booking.event, value: 0 }
                          }
                          acc[booking.event].value += booking.price || 0
                          return acc
                        },
                        {} as Record<string, { name: string; value: number }>,
                      ),
                    )}
                    cx="45%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    fill="#8884d8"
                  >
                    {Object.values(
                      bookings.reduce(
                        (acc, booking) => {
                          if (!acc[booking.event]) {
                            acc[booking.event] = { name: booking.event, value: 0 }
                          }
                          acc[booking.event].value += booking.price || 0
                          return acc
                        },
                        {} as Record<string, { name: string; value: number }>,
                      ),
                    ).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={["#7C5FA8", "#9B8BC7", "#B5A3D8"][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value.toLocaleString("en-IN")}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {Object.entries(
                  bookings.reduce(
                    (acc, booking) => {
                      if (!acc[booking.event]) {
                        acc[booking.event] = 0
                      }
                      acc[booking.event] += booking.price || 0
                      return acc
                    },
                    {} as Record<string, number>,
                  ),
                ).map(([event, amount]) => (
                  <p key={event} className="text-sm text-gray-600">
                    <span className="font-medium">{event}:</span> ₹{amount.toLocaleString("en-IN")}
                  </p>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-600 text-center py-8">No booking data</p>
          )}
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Bookings</h3>
        {bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Client</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Event</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Date</th>
                </tr>
              </thead>
              <tbody>
                {bookings
                  .slice(-5)
                  .reverse()
                  .map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900 font-medium">{booking.client}</td>
                      <td className="py-3 px-4 text-gray-700">{booking.event}</td>
                      <td className="py-3 px-4 text-gray-900 font-semibold">
                        ₹{booking.price?.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{booking.date}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">No bookings yet</p>
        )}
      </div>
    </div>
  )
}
