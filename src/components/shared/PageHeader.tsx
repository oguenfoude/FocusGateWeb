'use client'

import { useLanguage } from '@/components/language-provider'
import {
  Router, Users, MessageSquare, Banknote, AlertTriangle,
  Smartphone, History, LucideIcon
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Router, Users, MessageSquare, Banknote, AlertTriangle, Smartphone, History,
}

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  red: { bg: 'bg-red-50', text: 'text-red-600' },
}

interface PageHeaderProps {
  titleKey: string
  subtitleKey: string
  iconName: string
  color?: string
}

export function PageHeader({ titleKey, subtitleKey, iconName, color = 'emerald' }: PageHeaderProps) {
  const { t } = useLanguage()
  const colors = COLOR_MAP[color] || COLOR_MAP.emerald
  const Icon = ICON_MAP[iconName] || Router

  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 ${colors.bg} rounded-lg`}>
        <Icon className={`h-5 w-5 ${colors.text}`} />
      </div>
      <div>
        <h1 className="text-xl font-bold text-gray-900">{t(titleKey)}</h1>
        <p className="text-sm text-gray-500">{t(subtitleKey)}</p>
      </div>
    </div>
  )
}
