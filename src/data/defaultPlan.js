/**
 * الخطة الافتراضية: Push / Pull / Legs + راحة
 * الأسبوع يبدأ السبت (index 0) وينتهي الجمعة (index 6).
 */
import { createId } from '../utils/id.js'

const ex = (name, options = {}) => ({
  id: createId('ex'),
  name,
  type: options.type === 'timed' ? 'timed' : 'reps',
  sets: options.sets ?? 3,
  reps: options.type === 'timed' ? 0 : options.reps ?? 10,
  durationSec: options.type === 'timed' ? options.durationSec ?? 60 : 0,
  restSec: options.restSec ?? 90,
})

export const DEFAULT_PLAN = {
  version: 1,
  days: [
    {
      id: 'sat',
      label: 'السبت',
      name: 'دفع (Push)',
      exercises: [
        ex('بنش برس بار', { sets: 4, reps: 10, restSec: 120 }),
        ex('كتف أمامي بالدمبل', { sets: 3, reps: 12, restSec: 90 }),
        ex('تفتيح بالكابل', { sets: 3, reps: 15, restSec: 60 }),
        ex('ترايسبس بوش داون', { sets: 3, reps: 12, restSec: 60 }),
        ex('بلانك', { type: 'timed', sets: 3, durationSec: 60, restSec: 45 }),
      ],
    },
    {
      id: 'sun',
      label: 'الأحد',
      name: 'سحب (Pull)',
      exercises: [
        ex('عقلة', { sets: 4, reps: 8, restSec: 120 }),
        ex('سحب أرضي (Row)', { sets: 4, reps: 10, restSec: 90 }),
        ex('سحب علوي بالكابل', { sets: 3, reps: 12, restSec: 75 }),
        ex('بايسبس بار', { sets: 3, reps: 12, restSec: 60 }),
        ex('هيبر إكستنشن', { type: 'timed', sets: 3, durationSec: 45, restSec: 45 }),
      ],
    },
    {
      id: 'mon',
      label: 'الإثنين',
      name: 'أرجل (Legs)',
      exercises: [
        ex('سكوات بار', { sets: 4, reps: 10, restSec: 150 }),
        ex('رفعة روماني', { sets: 4, reps: 10, restSec: 120 }),
        ex('دفع بالرجل (Leg Press)', { sets: 3, reps: 12, restSec: 90 }),
        ex('سمانة واقف', { sets: 4, reps: 15, restSec: 60 }),
        ex('وول سِت', { type: 'timed', sets: 2, durationSec: 60, restSec: 60 }),
      ],
    },
    {
      id: 'tue',
      label: 'الثلاثاء',
      name: 'راحة',
      exercises: [],
    },
    {
      id: 'wed',
      label: 'الأربعاء',
      name: 'دفع (Push) — تنويع',
      exercises: [
        ex('بنش برس دمبل', { sets: 4, reps: 10, restSec: 120 }),
        ex('كتف جانبي', { sets: 3, reps: 15, restSec: 60 }),
        ex('ضغط أرضي', { sets: 3, reps: 15, restSec: 60 }),
        ex('ترايسبس دمبل', { sets: 3, reps: 12, restSec: 60 }),
      ],
    },
    {
      id: 'thu',
      label: 'الخميس',
      name: 'سحب (Pull) — تنويع',
      exercises: [
        ex('سحب أرضي بالدمبل', { sets: 4, reps: 10, restSec: 90 }),
        ex('فيسبول', { sets: 3, reps: 15, restSec: 60 }),
        ex('بايسبس دمبل', { sets: 3, reps: 12, restSec: 60 }),
        ex('كارديو', { type: 'timed', sets: 1, durationSec: 300, restSec: 0 }),
      ],
    },
    {
      id: 'fri',
      label: 'الجمعة',
      name: 'راحة',
      exercises: [],
    },
  ],
}

/** نسخة جديدة كل مرة (منع أي mutation مشترك) */
export function createDefaultPlan() {
  return JSON.parse(JSON.stringify(DEFAULT_PLAN))
}

/** بيتأكد إن الشكل صالح، وإلا يرجع الخطة الافتراضية */
export function normalizePlan(value) {
  if (!value || !Array.isArray(value.days) || value.days.length !== 7) {
    return createDefaultPlan()
  }
  const days = value.days.map((day, index) => ({
    id: day?.id ?? `day-${index}`,
    label: day?.label ?? '',
    name: day?.name ?? 'راحة',
    exercises: Array.isArray(day?.exercises)
      ? day.exercises.map((exercise, exIndex) => ({
          id: exercise?.id ?? `ex-${index}-${exIndex}`,
          name: exercise?.name ?? 'تمرين',
          type: exercise?.type === 'timed' ? 'timed' : 'reps',
          sets: Number(exercise?.sets) > 0 ? Number(exercise.sets) : 3,
          reps: Number(exercise?.reps) >= 0 ? Number(exercise.reps) : 10,
          durationSec: Number(exercise?.durationSec) >= 0 ? Number(exercise.durationSec) : 60,
          restSec: Number(exercise?.restSec) >= 0 ? Number(exercise.restSec) : 60,
        }))
      : [],
  }))
  return { version: value.version ?? 1, days }
}

export function createExercise(values = {}) {
  return {
    id: createId('ex'),
    name: values.name ?? 'تمرين جديد',
    type: values.type === 'timed' ? 'timed' : 'reps',
    sets: Number(values.sets) > 0 ? Number(values.sets) : 3,
    reps: values.type === 'timed' ? 0 : Number(values.reps) || 10,
    durationSec: values.type === 'timed' ? Number(values.durationSec) || 60 : 0,
    restSec: Number.isFinite(Number(values.restSec)) ? Number(values.restSec) : 60,
  }
}
