"use client"
import { useInvoices } from "@/context/invoice-context"
import { useBookings } from "@/context/booking-context"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { FileText, CheckCircle, Clock, DollarSign } from "lucide-react"

export default function InvoiceAnalytics() {
  const { invoices } = useInvoices()
  const { bookings } = useBookings()

  // Calculate invoice analytics
  const totalInvoices = invoices.length
  const invoicesSent = invoices.filter((i) => i.status === "sent").length
  const invoicesPaid = invoices.filter((i) => i.status === "paid").length
  const invoicesOverdue = invoices.filter((i) => i.status === "overdue").length

  const totalAmount = invoices.reduce((sum, i) => sum + (i.amount || 0), 0)
  const paidAmount = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + (i.amount || 0), 0)
  const pendingAmount = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((sum, i) => sum + (i.amount || 0), 0)

  const invoiceStatusData = [
    { name: "Draft", value: invoices.filter((i) => i.status === "draft").length, color: "#CBD5E1" },
    { name: "Sent", value: invoicesSent, color: "#3B82F6" },
    { name: "Paid", value: invoicesPaid, color: "#10B981" },
    { name: "Overdue", value: invoicesOverdue, color: "#EF4444" },
  ].filter((d) => d.value > 0)

  // Monthly invoice data
  const monthlyInvoiceData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(2025, i, 1).toLocaleString("default", { month: "short" })
    const monthStr = String(i + 1).padStart(2, "0")
    const monthInvoices = invoices.filter((inv) => inv.createdDate?.includes(`2025-${monthStr}`))
    return {
      month,
      invoices: monthInvoices.length,
      amount: monthInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
    }
  }).filter((d) => d.invoices > 0 || d.amount > 0)

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header with Logo on Left */}
      <div className="bg-white rounded-lg shadow-md p-6 border-b-4 border-[#216974]">
        <div className="flex items-center gap-4 mb-4">
          <img src="/sripada-logo-compact.svg" alt="Sripada Studios" className="h-16 w-auto" />
          <div>
            <h2 className="text-3xl font-bold text-[#216974]">Invoice Analytics</h2>
            <p className="text-gray-600">Track your invoicing performance and revenue insights</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#216974]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Invoices</p>
              <p className="text-3xl font-bold text-[#216974]">{totalInvoices}</p>
            </div>
            <FileText size={32} className="text-[#216974]" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Invoices Sent</p>
              <p className="text-3xl font-bold text-[#216974]">{invoicesSent}</p>
            </div>
            <CheckCircle size={32} className="text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Paid Amount</p>
              <p className="text-3xl font-bold text-[#216974]">₹{paidAmount.toLocaleString("en-IN")}</p>
            </div>
            <DollarSign size={32} className="text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Pending Amount</p>
              <p className="text-3xl font-bold text-[#216974]">₹{pendingAmount.toLocaleString("en-IN")}</p>
            </div>
            <Clock size={32} className="text-orange-500" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Invoice Trend */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Invoice Trend</h3>
          {monthlyInvoiceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyInvoiceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value.toLocaleString("en-IN")}`} />
                <Bar dataKey="amount" fill="#216974" name="Amount" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-600 text-center py-8">No invoice data available</p>
          )}
        </div>

        {/* Invoice Status Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Invoice Status Distribution</h3>
          {invoiceStatusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={invoiceStatusData}
                    cx="45%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    fill="#8884d8"
                  >
                    {invoiceStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {invoiceStatusData.map((status) => (
                  <p key={status.name} className="text-sm text-gray-600">
                    <span
                      className="inline-block w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: status.color }}
                    ></span>
                    <span className="font-medium">{status.name}:</span> {status.value} invoices
                  </p>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-600 text-center py-8">No invoice data</p>
          )}
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Invoices</h3>
        {invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#216974]">
                  <th className="text-left py-3 px-4 font-semibold text-[#216974] text-sm">Invoice No</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#216974] text-sm">Client</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#216974] text-sm">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#216974] text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#216974] text-sm">Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices
                  .slice(-10)
                  .reverse()
                  .map((invoice) => (
                    <tr key={invoice.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900 font-medium">{invoice.invoiceNo}</td>
                      <td className="py-3 px-4 text-gray-700">{invoice.clientName}</td>
                      <td className="py-3 px-4 text-gray-900 font-semibold">
                        ₹{invoice.amount?.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            invoice.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : invoice.status === "sent"
                                ? "bg-blue-100 text-blue-800"
                                : invoice.status === "overdue"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{invoice.createdDate}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">No invoices yet</p>
        )}
      </div>
    </div>
  )
}
