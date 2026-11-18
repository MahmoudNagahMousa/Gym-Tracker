/**
 * Loader للخطة الافتراضية — بتتحمّل من JSON (Vite بيضمّنها في الـ bundle، فبتشتغل أوفلاين).
 * مفيش fetch هنا خالص.
 */
import bundledPlan from './defaultPlan.json'
import { REQUIRED_WEEKDAYS, validatePlan } from '../utils/planSchema.js'
import { createId } from '../utils/id.js'

/** خطة أمان في أسوأ حالة (لو الـ JSON نفسه تلف) — 7 أيام راحة */
function createSafePlan() {
  return {
    version: 1,
    days: REQUIRED_WEEKDAYS.map((weekday, index) => ({
      weekday,
      index,
      name: 'راحة',
      focus: '',
      isRest: true,
      exercises: [],
    })),
  }
}

const validation = validatePlan(bundledPlan)

if (!validation.valid && typeof console !== 'undefined') {
  console.error('[Gym-Tracker] defaultPlan.json غير صالح:', validation.errors)
}

/** الخطة الافتراضية (متحققة، أو خطة راحة آمنة لو الـ JSON تلف) */
export const DEFAULT_PLAN = validation.valid ? bundledPlan : createSafePlan()

/** أخطاء الـ JSON المضمّن (فاضية = سليم) — مفيدة في الاختبارات */
export const DEFAULT_PLAN_ERRORS = validation.errors

export function clonePlan(plan) {
  return JSON.parse(JSON.stringify(plan))
}

/** نسخة جديدة كل مرة (منع أي mutation مشترك) */
export function createDefaultPlan() {
  return clonePlan(DEFAULT_PLAN)
}

/** تمرين جديد جاهز للـ schema (ids slug-style وفريدة) */
export function createExercise(values = {}) {
  const type = values.type === 'timed' ? 'timed' : 'reps'
  const sets = clampInt(values.sets, 1, 20, 3)
  const repsMin = clampInt(values.repsMin, 1, 100, 8)
  const repsMax = Math.max(repsMin, clampInt(values.repsMax, 1, 100, 12))
  const durationSec = clampInt(values.durationSec, 5, 3600, 45)
  const restSec = clampInt(values.restSec, 0, 900, 60)

  const exercise = {
    id: typeof values.id === 'string' && values.id.trim() ? values.id.trim() : createId('ex'),
    name: String(values.name ?? 'تمرين جديد').trim(),
    type,
    sets,
    repsMin: type === 'timed' ? 0 : repsMin,
    repsMax: type === 'timed' ? 0 : repsMax,
    durationSec: type === 'timed' ? durationSec : 0,
    restSec,
    perSide: Boolean(values.perSide),
  }

  const group = String(values.group ?? '').trim()
  if (group) exercise.group = group

  const note = String(values.note ?? '').trim()
  if (note) exercise.note = note

  return exercise
}

function clampInt(value, min, max, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, Math.round(number)))
}
