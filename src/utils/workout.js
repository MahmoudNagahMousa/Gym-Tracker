/** منطق التمرين — pure functions */
import { getWeekDay, weekdayIndex } from './date.js'

const MULTIPLY = '\u00d7' // ×
const EN_DASH = '\u2013' // –

export function getTodayDayIndex(date = new Date()) {
  return weekdayIndex(date)
}

export function getDayPlan(plan, dayIndex) {
  if (!plan || !Array.isArray(plan.days)) return null
  return plan.days[dayIndex] ?? null
}

export function createEmptySets(count = 0) {
  const safeCount = Math.max(0, Math.min(20, Number(count) || 0))
  return Array.from({ length: safeCount }, () => ({ weight: '', reps: '', done: false }))
}

/** log key = "2026-11-17#2" (تاريخ#فهرس اليوم) */
export function makeLogKey(dateKey, dayIndex) {
  return `${dateKey}#${dayIndex}`
}

/** اسم اليوم بالعربي من فهرس الأسبوع (السبت = 0) */
export function getDayLabel(dayIndex) {
  return getWeekDay(dayIndex).label
}

/** اسم الجلسة (Push A / راحة) مع fallback */
export function getDayName(day) {
  const name = typeof day?.name === 'string' ? day.name.trim() : ''
  if (name) return name
  return day?.exercises?.length ? 'تمرين' : 'راحة'
}

/**
 * "4 × 8–10" للتمارين بالتكرارات (ولو الأقل = الأكبر: "3 × 15")
 * و "3 × 45 ث" للتمارين بالوقت.
 */
export function formatRepsRange(exercise = {}) {
  const sets = Number(exercise.sets) || 0

  if (exercise.type === 'timed') {
    const duration = Number(exercise.durationSec) || 0
    return `${sets} ${MULTIPLY} ${duration} ث`
  }

  const min = Number(exercise.repsMin)
  const max = Number(exercise.repsMax)

  if (!Number.isFinite(min) && !Number.isFinite(max)) return `${sets} ${MULTIPLY} —`

  const low = Number.isFinite(min) ? min : max
  const high = Number.isFinite(max) ? max : min

  return low === high ? `${sets} ${MULTIPLY} ${low}` : `${sets} ${MULTIPLY} ${low}${EN_DASH}${high}`
}

/**
 * تجميع تمارين اليوم حسب group بالترتيب (مجموعات متتالية بنفس الاسم بتتدمج).
 * @returns {Array<{ key: string, title: string|null, exercises: object[] }>}
 */
export function groupExercises(exercises = []) {
  const groups = []

  ;(Array.isArray(exercises) ? exercises : []).forEach((exercise) => {
    const rawGroup = typeof exercise?.group === 'string' ? exercise.group.trim() : ''
    const title = rawGroup || null
    const last = groups[groups.length - 1]
    if (last && last.title === title) {
      last.exercises.push(exercise)
      return
    }
    groups.push({ key: `${title ?? 'ungrouped'}-${groups.length}`, title, exercises: [exercise] })
  })

  return groups
}

/**
 * آخر أداء لكل تمرين.
 * الفهرسة الأساسية بالـ exerciseId (ids ثابتة slug-style)، والاسم fallback
 * عشان الجلسات القديمة اللي ممكن تكون محفوظة باسم مختلف.
 * @returns {{ byId: Record<string, object>, byName: Record<string, object> }}
 */
export function buildLastPerformanceMap(sessions = []) {
  const byId = {}
  const byName = {}

  const ordered = [...(Array.isArray(sessions) ? sessions : [])].sort(
    (a, b) => new Date(b?.createdAt ?? b?.date ?? 0) - new Date(a?.createdAt ?? a?.date ?? 0),
  )

  ordered.forEach((session) => {
    ;(session?.exercises ?? []).forEach((exercise) => {
      if (!exercise) return

      const sets = (exercise.sets ?? []).filter(
        (set) => set && set.weight !== null && set.weight !== undefined && set.weight !== '',
      )
      if (!sets.length) return

      const best = sets.reduce(
        (acc, set) => (Number(set.weight) > Number(acc.weight) ? set : acc),
        sets[0],
      )
      const info = {
        weight: Number(best.weight),
        reps: best.reps === null || best.reps === undefined || best.reps === '' ? null : Number(best.reps),
        date: session.date ?? session.createdAt ?? null,
      }

      if (exercise.exerciseId && !byId[exercise.exerciseId]) byId[exercise.exerciseId] = info
      if (exercise.name && !byName[exercise.name]) byName[exercise.name] = info
    })
  })

  return { byId, byName }
}

/** هينت آخر مرة لتمرين: بالـ id الأول ثم بالاسم */
export function getLastPerformance(map, exercise) {
  if (!map || !exercise) return null
  return map.byId?.[exercise.id] ?? map.byName?.[exercise.name] ?? null
}

export function computeSessionVolume(session) {
  if (!session || !Array.isArray(session.exercises)) return 0
  return session.exercises.reduce((total, exercise) => {
    const sets = Array.isArray(exercise.sets) ? exercise.sets : []
    return (
      total +
      sets.reduce((sum, set) => {
        const weight = Number(set?.weight) || 0
        const reps = Number(set?.reps) || 0
        return sum + weight * reps
      }, 0)
    )
  }, 0)
}

export function countDoneSets(session) {
  if (!session || !Array.isArray(session.exercises)) return 0
  return session.exercises.reduce(
    (total, exercise) => total + (exercise.sets ?? []).filter((set) => set?.done).length,
    0,
  )
}
