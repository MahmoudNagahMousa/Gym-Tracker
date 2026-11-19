/**
 * حسابات "الالتزام" (Consistency / activity heatmap) — كلها pure functions، بدون React.
 *
 * قاعدة مهمة: كل المقارنات بالـ LOCAL calendar date (مش UTC)، عشان جلسة خلصت
 * 11:30 بالليل تتحسب على نفس اليوم اللي اتمرن فيه.
 */

import { getWeekDay, parseISODate, startOfDay, toISODate, weekdayIndex } from './date.js'

/** الحالات الخمسة الممكنة لأي يوم */
export const STATUS = Object.freeze({
  TRAINED: 'trained',
  REST: 'rest',
  MISSED: 'missed',
  TODAY: 'today',
  FUTURE: 'future',
})

/** أقصى عدد أيام بنرجع لها في حساب السلسلة (حماية من حلقة لا نهائية) */
const MAX_STREAK_LOOKBACK = 3650

const BARE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/**
 * تحويل أي قيمة لتاريخ صالح.
 * - "YYYY-MM-DD" بتتفهم كمنتصف ليل محلي (مش UTC).
 * - أي حاجة تانية بتتسلم لـ Date.
 * @returns {Date|null}
 */
function coerceDate(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value)
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null
    const fromNumber = new Date(value)
    return Number.isNaN(fromNumber.getTime()) ? null : fromNumber
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    if (BARE_DATE_PATTERN.test(trimmed)) return parseISODate(trimmed)
    const parsed = new Date(trimmed)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

/**
 * إضافة أيام على التقويم المحلي (بدون مشاكل DST).
 * بيرجع منتصف الليل المحلي لليوم المطلوب.
 * @returns {Date|null}
 */
export function addDays(date, amount) {
  const base = coerceDate(date)
  if (!base) return null
  const days = Number(amount)
  if (!Number.isFinite(days)) return null
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + Math.trunc(days))
}

/**
 * تطبيع تاريخ الجلسة إلى "YYYY-MM-DD" بالتوقيت المحلي.
 * - "YYYY-MM-DD" بترجع زي ما هي (من غير UTC shift).
 * - ISO string فيه وقت / timestamp / Date -> اليوم المحلي.
 * @returns {string|null} null لو التاريخ تالف
 */
export function normalizeSessionDate(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (BARE_DATE_PATTERN.test(trimmed)) {
      return parseISODate(trimmed) ? trimmed : null
    }
  }
  const date = coerceDate(value)
  return date ? toISODate(date) : null
}

/**
 * Set بكل الأيام اللي فيها جلسة منتهية — اليوم بيتحسب مرة واحدة بس
 * حتى لو فيه أكتر من جلسة في نفس اليوم.
 * @returns {Set<string>}
 */
export function getTrainedDates(sessions) {
  const list = Array.isArray(sessions) ? sessions : []
  const dates = new Set()
  list.forEach((session) => {
    if (!session || typeof session !== 'object') return
    const key = normalizeSessionDate(session.date)
    if (key) dates.add(key)
  })
  return dates
}

/**
 * أول جلسة محفوظة في يوم معين (أو null).
 * @param {Date|string} date
 * @param {Array<object>} sessions
 */
export function findSession(date, sessions) {
  const key = normalizeSessionDate(date)
  if (!key) return null
  const list = Array.isArray(sessions) ? sessions : []
  return (
    list.find(
      (session) =>
        session && typeof session === 'object' && normalizeSessionDate(session.date) === key,
    ) ?? null
  )
}

/**
 * يوم الخطة المقابل لتاريخ معين، باستخدام ترتيب الأسبوع الحالي
 * (index 0 = السبت ... 6 = الجمعة).
 * @returns {object|null}
 */
export function getPlanDayFor(date, plan) {
  const target = coerceDate(date)
  if (!target || !plan || !Array.isArray(plan.days)) return null
  const index = weekdayIndex(target)
  const byIndex = plan.days.find(
    (day) => day && typeof day === 'object' && Number(day.index) === index,
  )
  if (byIndex) return byIndex
  return plan.days[index] ?? null
}

/** هل اليوم ده راحة في الخطة؟ */
export function isRestDay(date, plan) {
  const day = getPlanDayFor(date, plan)
  return Boolean(day && day.isRest)
}

/**
 * حالة يوم واحد.
 * الترتيب: future -> trained -> today -> rest -> missed
 * (التمرين في يوم راحة بيتحسب trained).
 *
 * @param {Date|string} date
 * @param {Array<object>} sessions
 * @param {object|null} plan
 * @param {Date|string} today
 * @returns {'trained'|'rest'|'missed'|'today'|'future'}
 */
export function buildDayStatus(date, sessions = [], plan = null, today = new Date()) {
  const target = coerceDate(date)
  const todayDate = coerceDate(today) ?? new Date()
  // تاريخ غير صالح — مش بنعتبره "فات" عشان ما نلوّنش مربع غلط
  if (!target) return STATUS.FUTURE

  const key = toISODate(target)
  const todayKey = toISODate(todayDate)

  if (key > todayKey) return STATUS.FUTURE
  if (getTrainedDates(sessions).has(key)) return STATUS.TRAINED
  if (key === todayKey) return STATUS.TODAY
  if (isRestDay(target, plan)) return STATUS.REST
  return STATUS.MISSED
}

/**
 * آخر N أسبوع (السبت أول يوم في كل أسبوع) ومنتهية بالأسبوع الحالي.
 * كل يوم: { date, status, dayName, weekdayIndex }
 *
 * @param {Date|string} today
 * @param {number} weeksCount
 * @param {Array<object>} sessions
 * @param {object|null} plan
 * @returns {Array<{ startDate: string, days: Array<object> }>} الأقدم -> الأحدث
 */
export function buildHeatmapWeeks(today = new Date(), weeksCount = 12, sessions = [], plan = null) {
  const todayDate = coerceDate(today)
  if (!todayDate) return []

  const amount = Number(weeksCount)
  const count = Number.isFinite(amount) ? Math.max(1, Math.trunc(amount)) : 12
  const todayMid = startOfDay(todayDate)
  const currentWeekStart = addDays(todayMid, -weekdayIndex(todayMid))

  const weeks = []
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const weekStart = addDays(currentWeekStart, -7 * offset)
    const days = []
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = addDays(weekStart, dayIndex)
      const isoDate = toISODate(date)
      days.push({
        date: isoDate,
        status: buildDayStatus(isoDate, sessions, plan, todayMid),
        dayName: getWeekDay(dayIndex).label,
        weekdayIndex: dayIndex,
      })
    }
    weeks.push({ startDate: toISODate(weekStart), days })
  }
  return weeks
}

/**
 * عدد الأيام اللي اتمرن فيها المستخدم خلال آخر N يوم (بما فيهم النهارده).
 * @param {Date|string} today
 * @param {number} days
 * @param {Array<object>} sessions
 */
export function countTrainedDays(today, days = 30, sessions = []) {
  const todayDate = coerceDate(today)
  if (!todayDate) return 0
  const amount = Number(days)
  const total = Number.isFinite(amount) ? Math.max(0, Math.trunc(amount)) : 30
  const trained = getTrainedDates(sessions)
  const start = startOfDay(todayDate)

  let count = 0
  for (let index = 0; index < total; index += 1) {
    const day = addDays(start, -index)
    if (day && trained.has(toISODate(day))) count += 1
  }
  return count
}

/**
 * عدد الجلسات المنتهية في الشهر الميلادي الحالي (بالتوقيت المحلي).
 * الجلسة = جلسة واحدة، فلو فيه جلسة الصبح وجلسة بالليل في نفس اليوم بيتحسبوا 2.
 * @param {Date|string} today
 * @param {Array<object>} sessions
 * @returns {number}
 */
export function countSessionsThisMonth(today = new Date(), sessions = []) {
  const todayDate = coerceDate(today)
  if (!todayDate) return 0

  const year = todayDate.getFullYear()
  const month = todayDate.getMonth()
  const list = Array.isArray(sessions) ? sessions : []

  return list.reduce((total, session) => {
    if (!session || typeof session !== 'object') return total
    const key = normalizeSessionDate(session.date)
    if (!key) return total
    const date = parseISODate(key)
    if (!date) return total
    const sameMonth = date.getFullYear() === year && date.getMonth() === month
    return sameMonth ? total + 1 : total
  }, 0)
}

/**
 * السلسلة الحالية: أيام متتالية راجعة من النهارده، وكل يوم لازم يكون
 * "تمرنت" أو "راحة" حسب الخطة. يوم تمرين فات من غير جلسة بيكسر السلسلة.
 * لو النهارده يوم تمرين ولسه مفيش جلسة: مش بنكسّر السلسلة، بنبدأ من إمبارح.
 *
 * @param {Date|string} today
 * @param {Array<object>} sessions
 * @param {object|null} plan
 * @returns {number}
 */
export function calculateStreak(today, sessions = [], plan = null) {
  const todayDate = coerceDate(today)
  if (!todayDate) return 0

  const todayMid = startOfDay(todayDate)
  const todayKey = toISODate(todayMid)
  const trained = getTrainedDates(sessions)

  let streak = 0
  let cursor = todayMid
  let steps = 0

  while (steps < MAX_STREAK_LOOKBACK) {
    const key = toISODate(cursor)
    const isToday = key === todayKey

    if (trained.has(key)) {
      streak += 1
    } else if (isRestDay(cursor, plan)) {
      streak += 1
    } else if (!isToday) {
      // يوم تمرين فات من غير جلسة -> السلسلة اتكسرت
      break
    }
    // النهارده (يوم تمرين ولسه مفيش جلسة): بنعديه من غير ما نكسّر السلسلة

    cursor = addDays(cursor, -1)
    steps += 1
  }

  return streak
}

/**
 * أطول سلسلة جوه الفترة المعروضة (اختياري في الواجهة).
 * الأيام اللي في المستقبل ومربع "النهارده" بيتم تجاهلهم.
 * @param {Array<{ days: Array<object> }>} weeks
 * @returns {number}
 */
export function calculateLongestStreak(weeks) {
  const list = Array.isArray(weeks) ? weeks : []
  const days = list.flatMap((week) => (week && Array.isArray(week.days) ? week.days : []))

  let longest = 0
  let current = 0

  days.forEach((day) => {
    if (!day) return
    if (day.status === STATUS.FUTURE) return
    if (day.status === STATUS.MISSED) {
      current = 0
      return
    }
    if (day.status === STATUS.TODAY) {
      // النهارده لسه مش محسوب ولا بيكسّر
      return
    }
    current += 1
    if (current > longest) longest = current
  })

  return longest
}
