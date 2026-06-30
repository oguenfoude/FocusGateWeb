export const MODEM_BRANDS: Record<number, string> = {
  1: 'Huawei',
  2: 'ZTE',
  3: 'Sierra Wireless',
  4: 'TP-Link',
  5: 'Netgear',
  6: 'D-Link',
  7: 'Qualcomm',
  8: 'MediaTek',
  9: 'Samsung',
}

export function getModemBrand(brand: number | null | undefined): string {
  if (brand === null || brand === undefined) return 'Unknown'
  return MODEM_BRANDS[brand] ?? `Brand ${brand}`
}
