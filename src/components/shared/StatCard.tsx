'use client'

import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  subtitle?: string
  color?: 'brand' | 'blue' | 'amber' | 'purple' | 'emerald' | 'red'
}

const COLOR_STYLES = {
  brand: { bg: 'from-brand-100 to-brand-50', icon: 'text-brand-600', border: 'border-brand-100/50' },
  blue: { bg: 'from-blue-100 to-blue-50', icon: 'text-blue-600', border: 'border-blue-100/50' },
  amber: { bg: 'from-amber-100 to-amber-50', icon: 'text-amber-600', border: 'border-amber-100/50' },
  purple: { bg: 'from-purple-100 to-purple-50', icon: 'text-purple-600', border: 'border-purple-100/50' },
  emerald: { bg: 'from-emerald-100 to-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100/50' },
  red: { bg: 'from-red-100 to-red-50', icon: 'text-red-600', border: 'border-red-100/50' },
}

export function StatCard({ icon: Icon, label, value, subtitle, color = 'brand' }: StatCardProps) {
  const style = COLOR_STYLES[color]

  return (
    <div className="card stat-card">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`w-10 h-10 bg-gradient-to-br ${style.bg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner border ${style.border}`}>
            <Icon className={`h-5 w-5 ${style.icon}`} />
          </div>
        </div>
      </div>
    </div>
  )
}
