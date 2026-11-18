/**
 * مخطط الخطة (Plan schema) — دوال pure لتحقق ومigration.
 * الهدف: أي خطة تالفة (من localStorage أو JSON) مانكمّلش بيها، ونرجع للخطة الافتراضية.
 */

/** ترتيب الأسبوع: السبت (0) → الجمعة (6) */
export const REQUIRED_WEEKDAYS = [
  'saturday',
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
]

export const EXERCISE_TYPES = ['reps', 'timed']

/** ids بصيغة slug: حروف إنجليزي صغيرة/أرقام مفصولة بشرطة */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0
const isPositiveInt = (value) => Number.isInteger(value) && value > 0
const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value)

/**
 * تحقق من تمرين واحد.
 * @returns {string[]} رسائل الخطأ (فاضية = صالح)
 */
export function validateExerciseSchema(exercise, label = 'تمرين') {
  const errors = []

  if (!exercise || typeof exercise !== 'object' || Array.isArray(exercise)) {
    return [`${label}: بيانات التمرين غير صالحة`]
  }

  if (!isNonEmptyString(exercise.id)) {
    errors.push(`${label}: كل تمرين لازم يكون له id`)
  } else if (!SLUG_PATTERN.test(exercise.id)) {
    errors.push(`${label}: الـ id لازم يكون slug (حروف إنجليزي صغيرة وأرقام و- فقط) — "${exercise.id}"`)
  }

  if (!isNonEmptyString(exercise.name)) {
    errors.push(`${label}: اسم التمرين مطلوب`)
  }

  if (!EXERCISE_TYPES.includes(exercise.type)) {
    errors.push(`${label}: نوع التمرين لازم يكون "reps" أو "timed"`)
  }

  if (!isPositiveInt(exercise.sets)) {
    errors.push(`${label}: عدد المجموعات (sets) لازم يكون رقم صحيح أكبر من صفر`)
  }

  if (!isFiniteNumber(exercise.restSec) || exercise.restSec < 0) {
    errors.push(`${label}: الراحة (restSec) لازم تكون رقم أكبر من أو يساوي صفر`)
  }

  if (exercise.perSide !== undefined && typeof exercise.perSide !== 'boolean') {
    errors.push(`${label}: perSide لازم تكون true أو false`)
  }

  if (exercise.group !== undefined && typeof exercise.group !== 'string') {
    errors.push(`${label}: group لازم يكون نص`)
  }

  if (exercise.note !== undefined && typeof exercise.note !== 'string') {
    errors.push(`${label}: note لازم يكون نص`)
  }

  if (exercise.type === 'reps') {
    if (!isPositiveInt(exercise.repsMin)) {
      errors.push(`${label}: repsMin مطلوب لتمارين التكرارات (${exercise.name ?? '?'})`)
    }
    if (!isPositiveInt(exercise.repsMax)) {
      errors.push(`${label}: repsMax مطلوب لتمارين التكرارات (${exercise.name ?? '?'})`)
    }
    if (isPositiveInt(exercise.repsMin) && isPositiveInt(exercise.repsMax) && exercise.repsMin > exercise.repsMax) {
      errors.push(
        `${label}: أقل تكرارات (${exercise.repsMin}) أكبر من أكبر تكرارات (${exercise.repsMax}) في "${exercise.name ?? '?'}"`,
      )
    }
  }

  if (exercise.type === 'timed') {
    if (!isFiniteNumber(exercise.durationSec) || exercise.durationSec <= 0) {
      errors.push(`${label}: durationSec مطلوب لتمارين الوقت (${exercise.name ?? '?'})`)
    }
  }

  return errors
}

/**
 * تحقق من الخطة كاملة.
 * @param {unknown} plan
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePlan(plan) {
  const errors = []

  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) {
    return { valid: false, errors: ['الخطة غير صالحة: لازم تكون كائن (object)'] }
  }

  if (!isFiniteNumber(Number(plan.version)) || Number(plan.version) < 1) {
    errors.push('نسخة الخطة (version) مفقودة أو غير صالحة')
  }

  if (!Array.isArray(plan.days)) {
    return { valid: false, errors: [...errors, 'أيام الخطة (days) لازم تكون مصفوفة'] }
  }

  if (plan.days.length !== 7) {
    errors.push(`الخطة لازم تحتوي على 7 أيام بالظبط (المتاح حالياً: ${plan.days.length})`)
  }

  const seenWeekdays = new Set()
  const seenIds = new Set()

  plan.days.forEach((day, dayIndex) => {
    const label = `اليوم ${dayIndex + 1}`

    if (!day || typeof day !== 'object' || Array.isArray(day)) {
      errors.push(`${label}: بيانات اليوم غير صالحة`)
      return
    }

    if (!REQUIRED_WEEKDAYS.includes(day.weekday)) {
      errors.push(`${label}: weekday لازم يكون واحد من (${REQUIRED_WEEKDAYS.join(', ')})`)
    } else if (seenWeekdays.has(day.weekday)) {
      errors.push(`${label}: يوم "${day.weekday}" مكرر`)
    } else {
      seenWeekdays.add(day.weekday)
    }

    if (!Number.isInteger(day.index) || day.index < 0 || day.index > 6) {
      errors.push(`${label}: index لازم يكون رقم صحيح من 0 إلى 6`)
    } else if (day.index !== dayIndex) {
      errors.push(`${label}: index لازم يطابق ترتيب اليوم في المصفوفة (${dayIndex})`)
    }

    if (typeof day.name !== 'string') {
      errors.push(`${label}: اسم اليوم لازم يكون نص`)
    }

    if (day.focus !== undefined && typeof day.focus !== 'string') {
      errors.push(`${label}: focus لازم يكون نص`)
    }

    if (typeof day.isRest !== 'boolean') {
      errors.push(`${label}: isRest لازم تكون true أو false`)
    }

    if (!Array.isArray(day.exercises)) {
      errors.push(`${label}: تمارين اليوم (exercises) لازم تكون مصفوفة`)
      return
    }

    day.exercises.forEach((exercise, exerciseIndex) => {
      const exerciseLabel = `${label} — تمرين ${exerciseIndex + 1}`
      errors.push(...validateExerciseSchema(exercise, exerciseLabel))

      if (exercise && typeof exercise === 'object' && isNonEmptyString(exercise.id)) {
        if (seenIds.has(exercise.id)) {
          errors.push(`${exerciseLabel}: الـ id مكرر ("${exercise.id}") — كل تمرين لازم يكون له id فريد`)
        } else {
          seenIds.add(exercise.id)
        }
      }
    })
  })

  REQUIRED_WEEKDAYS.forEach((weekday) => {
    if (!seenWeekdays.has(weekday)) errors.push(`اليوم "${weekday}" ناقص من الخطة`)
  })

  return { valid: errors.length === 0, errors }
}

export function isValidPlan(plan) {
  return validatePlan(plan).valid
}

/**
 * تحويل خطة قديمة (الشكل القديم: reps رقم واحد + label بدل weekday) للشكل الجديد.
 * @returns {object|null} null لو مش ممكن التحويل بأمان
 */
export function migrateLegacyPlan(legacyPlan) {
  if (!legacyPlan || typeof legacyPlan !== 'object' || Array.isArray(legacyPlan)) return null
  if (!Array.isArray(legacyPlan.days)) return null
  if (legacyPlan.days.length !== 7) return null

  const seenIds = new Set()

  const days = legacyPlan.days.map((day, dayIndex) => {
    const rawExercises = Array.isArray(day?.exercises) ? day.exercises : []

    const exercises = rawExercises
      .map((exercise, exerciseIndex) => migrateLegacyExercise(exercise, dayIndex, exerciseIndex, seenIds))
      .filter(Boolean)

    return {
      weekday: REQUIRED_WEEKDAYS[dayIndex],
      index: dayIndex,
      name: isNonEmptyString(day?.name) ? day.name.trim() : exercises.length ? 'تمرين' : 'راحة',
      focus: isNonEmptyString(day?.focus) ? day.focus.trim() : '',
      isRest: exercises.length === 0,
      exercises,
    }
  })

  const migrated = { version: 1, days }
  return validatePlan(migrated).valid ? migrated : null
}

function migrateLegacyExercise(exercise, dayIndex, exerciseIndex, seenIds) {
  if (!exercise || typeof exercise !== 'object' || Array.isArray(exercise)) return null
  if (!isNonEmptyString(exercise.name)) return null

  const type = exercise.type === 'timed' ? 'timed' : 'reps'
  const baseId =
    isNonEmptyString(exercise.id) && SLUG_PATTERN.test(exercise.id)
      ? exercise.id
      : `ex-${dayIndex}-${exerciseIndex}`

  // نضمن إن الـ ids فريدة (الهينت بيتم عن طريق الـ id)
  let id = baseId
  let counter = 2
  while (seenIds.has(id)) {
    id = `${baseId}-${counter}`
    counter += 1
  }
  seenIds.add(id)

  const sets = Number.isInteger(Number(exercise.sets)) && Number(exercise.sets) > 0 ? Number(exercise.sets) : 3
  const restSecRaw = Number(exercise.restSec)
  const restSec = Number.isFinite(restSecRaw) && restSecRaw >= 0 ? restSecRaw : 60

  if (type === 'timed') {
    const durationRaw = Number(exercise.durationSec)
    const durationSec = Number.isFinite(durationRaw) && durationRaw > 0 ? durationRaw : 45
    return { id, name: String(exercise.name).trim(), type, sets, repsMin: 0, repsMax: 0, durationSec, restSec }
  }

  const repsRaw = Number(exercise.reps)
  const reps = Number.isFinite(repsRaw) && repsRaw > 0 ? Math.round(repsRaw) : 10
  return {
    id,
    name: String(exercise.name).trim(),
    type: 'reps',
    sets,
    repsMin: reps,
    repsMax: reps,
    durationSec: 0,
    restSec,
  }
}
