/**
 * دوال التاريخ — كلها pure functions عشان تكون قابلة للاختبار.
 */

export const DAY_MS = 24 * 60 * 60 * 1000

/** الأسبوع يبدأ السبت (زي الجيم المصري) — index 0 = السبت */
export const WEEK_DAYS = [
  { index: 0, id: 'sat', label: 'السبت', short: 'سبت' },
  { index: 1, id: 'sun', label: 'الأحد', short: 'أحد' },
  { index: 2, id: 'mon', label: 'الإثنين', short: 'إثن' },
  { index: 3, id: 'tue', label: 'الثلاثاء', short: 'ثلا' },
  { index: 4, id: 'wed', label: 'الأربعاء', short: 'أرب' },
  { index: 5, id: 'thu', label: 'الخميس', short: 'خمي' },
  { index: 6, id: 'fri', label: 'الجمعة', short: 'جمع' },
]

/** Date -> "YYYY-MM-DD" (بتوقيت الجهاز، مش UTC) */
export function toISODate(date) {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** "YYYY-MM-DD" -> Date (منتصف الليل المحلي) أو null لو غير صالح */
export function parseISODate(isoDate) {
  if (typeof isoDate !== 'string') return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(year, month, day)
  if (Number.isNaN(date.getTime())) return null
  // نتأكد إن التاريخ حقيقي (مثلاً 2025-02-30 غير صالح)
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null
  return date
}

export function startOfDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * إضافة شهور مع "clamp" لأيام الشهر:
 * 31 يناير + شهر = 28/29 فبراير (مش 2 أو 3 مارس).
 */
export function addMonths(date, months) {
  const source = date instanceof Date ? new Date(date) : new Date(date)
  if (Number.isNaN(source.getTime())) return null
  const amount = Number(months)
  if (!Number.isFinite(amount)) return null

  const originalDay = source.getDate()
  const target = new Date(source.getTime())
  target.setDate(1)
  target.setMonth(target.getMonth() + Math.trunc(amount))
  const daysInTargetMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(originalDay, daysInTargetMonth))
  return target
}

/**
 * تاريخ انتهاء الاشتراك = تاريخ البداية + عدد الشهور (وآخر يوم محسوب ضمن المدة).
 * @param {string} startISO "YYYY-MM-DD"
 * @param {number} months عدد الشهور (>= 1)
 * @returns {string|null} "YYYY-MM-DD"
 */
export function calculateEndDate(startISO, months = 1) {
  const start = parseISODate(startISO)
  const amount = Number(months)
  if (!start) return null
  if (!Number.isFinite(amount) || amount <= 0) return null
  const end = addMonths(start, amount)
  return end ? toISODate(end) : null
}

/**
 * عدد الأيام المتبقية (سالب لو انتهى).
 * 0 = ينتهي النهارده.
 */
export function daysRemaining(endISO, today = new Date()) {
  const end = parseISODate(endISO)
  if (!end) return null
  const endMid = startOfDay(end).getTime()
  const todayMid = startOfDay(today).getTime()
  return Math.round((endMid - todayMid) / DAY_MS)
}

/** فهرس اليوم الحالي في خطة الأسبوع (0 = السبت ... 6 = الجمعة) */
export function weekdayIndex(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return 0
  // getDay(): 0=الأحد .. 6=السبت  ->  السبت = 0
  return (d.getDay() + 1) % 7
}

export function getWeekDay(index) {
  return WEEK_DAYS[index] ?? WEEK_DAYS[0]
}

export function isSameDay(a, b) {
  return toISODate(a) === toISODate(b)
}

/** عرض تاريخ بالعربي: 17 نوفمبر 2026 */
export function formatDateAr(value) {
  const date = typeof value === 'string' ? parseISODate(value) ?? new Date(value) : value
  if (!date || Number.isNaN(date.getTime())) return '—'
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  } catch {
    return toISODate(date) ?? '—'
  }
}

/** عرض تاريخ+وقت قصير للجلسات: 17 نوفمبر، 7:45 م */
export function formatDateTimeAr(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      day: 'numeric',
      month: 'long',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  } catch {
    return toISODate(date) ?? '—'
  }
}
