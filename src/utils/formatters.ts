/**
 * Locale-aware number formatters using the native Intl API.
 * Pass i18n.language from useTranslation() as the locale.
 *
 * NOTE: We avoid Intl.NumberFormat `style: 'unit'` for physical units (watt,
 * volt, kilowatt-hour) because those unit identifiers are only present in
 * environments with full ICU data (browsers). Instead we format the number
 * and append the SI symbol manually, which works everywhere.
 */

export const formatPower = (watts: number, locale: string): string =>
  new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(watts) + ' W'

export const formatEnergy = (kwh: number, locale: string): string =>
  new Intl.NumberFormat(locale, {
    maximumFractionDigits: 3,
  }).format(kwh) + ' kWh'

export const formatVoltage = (volts: number, locale: string): string =>
  new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(volts) + ' V'

export const formatCurrent = (amps: number, locale: string): string =>
  new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(amps) + ' A'

export const formatTemperature = (
  celsius: number,
  locale: string,
  unit: 'C' | 'F' = 'C'
): string => {
  const value = unit === 'F' ? (celsius * 9) / 5 + 32 : celsius
  return (
    new Intl.NumberFormat(locale, {
      maximumFractionDigits: 1,
    }).format(value) + (unit === 'F' ? ' °F' : ' °C')
  )
}

export const formatRelativeTime = (ms: number, locale: string): string => {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const seconds = Math.round(ms / 1000)
  if (Math.abs(seconds) < 60) return rtf.format(-seconds, 'second')
  const minutes = Math.round(seconds / 60)
  if (Math.abs(minutes) < 60) return rtf.format(-minutes, 'minute')
  return rtf.format(-Math.round(minutes / 60), 'hour')
}

export const formatUptime = (seconds: number): string => {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}
