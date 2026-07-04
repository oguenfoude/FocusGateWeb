'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/components/language-provider'

const schema = z.object({
  amount: z.number().positive().max(1000000),
  note: z.string().max(500).optional(),
})

type FormData = z.infer<typeof schema>

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function WithdrawForm({ userId }: { userId: string }) {
  const { t } = useLanguage()
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `/api/dashboard/withdraw?userId=${userId}` : null,
    fetcher,
    { refreshInterval: 30000 }
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (formData: FormData) => {
    if (formData.amount > data.balance) {
      toast.error(t('withdraw.amountExceeds'))
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/dashboard/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId })
      })
      
      const json = await res.json()
      
      if (!res.ok) {
        throw new Error(json.error || 'Failed to submit request')
      }
      
      toast.success(t('withdraw.requestSubmitted'))
      reset()
      mutate()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('common.error')
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">{t('withdraw.loadingWallet')}</div>
  if (error || data?.error) return <div className="p-8 text-center text-destructive">{t('withdraw.failedToLoadWallet')}</div>

  return (
    <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
      <div className="card border-emerald-500/20 bg-emerald-50/50 page-enter relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
        <div className="card-header pb-4 relative z-10">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">{t('withdraw.availableBalance')}</h3>
          <p className="text-sm text-gray-500">{t('withdraw.yourFunds')}</p>
        </div>
        <div className="card-body relative z-10">
          <div className="text-4xl font-bold text-emerald-600 drop-shadow-sm">
            {data.balance.toLocaleString()} DA
          </div>
        </div>
      </div>

      <div className="card page-enter delay-100">
        <div className="card-header pb-4">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">{t('withdraw.requestWithdrawal')}</h3>
          <p className="text-sm text-gray-500">{t('withdraw.submitDescription')}</p>
        </div>
        <div className="card-body">
          {data.hasPending ? (
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-500/5 text-amber-700 border border-amber-500/20 text-sm font-medium shadow-sm">
                {t('withdraw.pendingWarning1')} <span className="font-bold">{data.pendingAmount.toLocaleString()} DA</span>. 
                {t('withdraw.pendingWarning2')}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium text-gray-700">{t('withdraw.amountLabel')}</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  placeholder={t('withdraw.amountPlaceholder')}
                  className="input"
                  {...register('amount', { valueAsNumber: true })}
                />
                {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="note" className="text-sm font-medium text-gray-700">{t('withdraw.noteLabel')}</Label>
                <Textarea 
                  id="note" 
                  placeholder={t('withdraw.notePlaceholder')}
                  className="input min-h-[100px]"
                  {...register('note')}
                />
                {errors.note && <p className="text-sm text-red-500">{errors.note.message}</p>}
              </div>
              
              <button type="submit" className="btn btn-primary w-full justify-center" disabled={isSubmitting}>
                {isSubmitting ? t('withdraw.submitting') : t('withdraw.submitRequest')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
