export type SmsType = 'otp' | 'offer' | 'recharge' | 'transfer' | 'info'

export function classifySms(sender: string, content: string): SmsType {
  const c = content.toLowerCase()
  if (c.includes('code') || c.includes('otp') || c.includes('verification') || c.includes('pin') || c.includes('password') || c.includes('verify')) return 'otp'
  if (c.includes('offer') || c.includes('discount') || c.includes('promo') || c.includes('sale') || c.includes('win') || c.includes('free')) return 'offer'
  if (c.includes('recharge') || c.includes('recharg') || c.includes('solde') || c.includes('credit') || c.includes('top-up')) return 'recharge'
  if (c.includes('transfer') || c.includes('transfert') || c.includes('envoi') || c.includes('sent') || c.includes('received') || c.includes('recu')) return 'transfer'
  return 'info'
}

export const SMS_TYPE_KEYS: Record<SmsType, string> = {
  otp: 'sms.types.otp',
  offer: 'sms.types.offer',
  recharge: 'sms.types.recharge',
  transfer: 'sms.types.transfer',
  info: 'sms.types.info',
}

export function smsTypeLabel(type: SmsType): string {
  return SMS_TYPE_KEYS[type] ?? 'sms.types.info'
}
