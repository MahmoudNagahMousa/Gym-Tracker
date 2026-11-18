/** منطق التمرين — pure functions */
import { getWeekDay, weekdayIndex } from './date.js'

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

/**
 * آخر وزن مسجّل لكل تمرين (بالاسم، عشان تعديل الخطة مايضيعش الهيستوري).
 * @returns {Record<string, {weight:number, reps:number|null, date:string}>}
 */
export function buildLastPerformanceMap(sessions = []) {
  const map = {}
  const ordered = [...sessions].sort((a, b) => new Date(b.createdAt ?? b.date) - new Date(a.createdAt ?? a.date))
  ordered.forEach((session) => {
    ;(session.exercises ?? []).forEach((exercise) => {
      const key = exercise.name
      if (!key || map[key]) return
      const sets = (exercise.sets ?? []).filter((set) => set && set.weight !== null && set.weight !== '')
      if (!sets.length) return
      const best = sets.reduce((acc, set) => (Number(set.weight) > Number(acc.weight) ? set : acc), sets[0])
      map[key] = {
        weight: Number(best.weight),
        reps: best.reps === null || best.reps === '' ? null : Number(best.reps),
        date: session.date ?? session.createdAt,
      }
    })
  })
  return map
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

export function getDayLabel(plan, dayIndex) {
  const day = getDayPlan(plan, dayIndex)
  return day?.label ?? getWeekDay(dayIndex).label
}
