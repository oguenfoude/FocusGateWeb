export const MODEM_BRANDS: Record<number, string> = {
  0: 'Unknown',
  1: 'ZTE',
  2: 'Huawei',
  3: 'Quectel',
  4: 'SIMCom',
  5: 'Sierra Wireless',
  6: 'Ericsson',
  7: 'MediaTek',
  99: 'Other',
}

export function getModemBrand(brand: number | null | undefined): string {
  if (brand === null || brand === undefined) return 'Unknown'
  return MODEM_BRANDS[brand] ?? `Brand ${brand}`
}
