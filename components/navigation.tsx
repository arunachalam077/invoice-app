"use client"

import { Calendar, FileText, Settings, LogOut, BarChart3 } from "lucide-react"

interface NavigationProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  onLogout: () => void
}

export default function Navigation({ activeTab, setActiveTab, onLogout }: NavigationProps) {
  const tabs = [
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "invoices", label: "Invoices", icon: FileText },
    { id: "invoice-analytics", label: "Invoice Analytics", icon: BarChart3 },
    { id: "analytics", label: "Analytics", icon: Settings },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  return (
    <nav className="bg-white border-b-2 border-[#216974] sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Title - Left Side */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <img src="/sripada-logo-compact.svg" alt="Sripada Studios" className="h-16 w-auto" />
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === id ? "bg-[#216974] text-white" : "text-[#216974] hover:bg-[#f0f7f8]"
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium hidden sm:inline">{label}</span>
              </button>
            ))}
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all ml-2"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
