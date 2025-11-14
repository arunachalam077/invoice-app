"use client"

import type React from "react"
import { useBookings } from "@/context/booking-context"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Calendar, DollarSign, Users, TrendingUp } from "lucide-react"

export default function AdminDashboard() {
  const { bookings } = useBookings()

  const totalBookings = bookings.length
  const totalRevenue = bookings.reduce((sum, b) => sum + b.price, 0)
  const averageBookingValue = totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : 0
  const uniqueClients = new Set(bookings.map((b) => b.client)).size

  const revenueByEventType = bookings.reduce(
    (acc, booking) => {
      const existing = acc.find((item) => item.name === booking.event)
      if (existing) {
        existing.value += booking.price
      } else {
        acc.push({ name: booking.event, value: booking.price })
      }
      return acc
    },
    [] as { name: string; value: number }[],
  )

  const monthlyRevenue = bookings.reduce(
    (acc, booking) => {
      const month = new Date(booking.date).toLocaleString("default", { month: "short" })
      const existing = acc.find((item) => item.month === month)
      if (existing) {
        existing.revenue += booking.price
      } else {
        acc.push({ month, revenue: booking.price })
      }
      return acc
    },
    [] as { month: string; revenue: number }[],
  )

  const COLORS = ["#3b82f6", "#f97316", "#10b981", "#f43f5e", "#8b5cf6"]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="bg-blue-100 text-blue-600"
        />
        <MetricCard
          title="Total Bookings"
          value={totalBookings}
          icon={Calendar}
          color="bg-purple-100 text-purple-600"
        />
        <MetricCard title="Unique Clients" value={uniqueClients} icon={Users} color="bg-green-100 text-green-600" />
        <MetricCard
          title="Avg Booking Value"
          value={`$${averageBookingValue}`}
          icon={TrendingUp}
          color="bg-orange-100 text-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Monthly Revenue Trend</h3>
          {monthlyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-600 text-center py-8">No data available</p>
          )}
        </div>

        {/* Revenue by Event Type */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Revenue by Event Type</h3>
          {revenueByEventType.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueByEventType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: $${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueByEventType.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-600 text-center py-8">No data available</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Bookings</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Client</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Event</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {bookings
                .slice(-5)
                .reverse()
                .map((booking) => (
                  <tr key={booking.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-900 font-medium">{booking.client}</td>
                    <td className="py-3 px-4 text-slate-700">{booking.event}</td>
                    <td className="py-3 px-4 text-slate-900 font-semibold">${booking.price}</td>
                    <td className="py-3 px-4 text-slate-700">{booking.date}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {bookings.length === 0 && <p className="text-slate-600 text-center py-8">No bookings yet</p>}
        </div>
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ size: number; className: string }>
  color: string
}

function MetricCard({ title, value, icon: Icon, color }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 flex items-start gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-slate-600 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  )
}
