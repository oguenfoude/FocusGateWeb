export function classifySms(sender: string, content: string): 'otp' | 'offer' | 'info' {
  const c = content.toLowerCase();
  if (c.includes('code') || c.includes('otp') || c.includes('verification') || c.includes('pin') || c.includes('password') || c.includes('verify')) return 'otp';
  if (c.includes('offer') || c.includes('discount') || c.includes('promo') || c.includes('sale') || c.includes('win') || c.includes('free')) return 'offer';
  return 'info';
}

export function smsTypeLabel(type: 'otp' | 'offer' | 'info'): string {
  switch (type) {
    case 'otp': return 'OTP / Code';
    case 'offer': return 'Promo / Offer';
    case 'info': return 'General Info';
  }
}
