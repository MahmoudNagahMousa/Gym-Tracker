import { parseISODate } from './date.js'

/**
 * تحقق من بيانات البروفايل — رسائل عربية.
 * @returns {Object} أخطاء لكل حقل (فاضي = صالح)
 */
export function validateProfile(values = {}) {
  const errors = {}

  const name = String(values.name ?? '').trim()
  if (name.length < 2) errors.name = 'من فضلك اكتب الاسم (حرفين على الأقل)'
  else if (name.length > 40) errors.name = 'الاسم طويل جداً (40 حرف كحد أقصى)'

  const age = Number(values.age)
  if (values.age === '' || values.age === null || values.age === undefined || !Number.isFinite(age)) {
    errors.age = 'العمر مطلوب'
  } else if (age < 10 || age > 100) {
    errors.age = 'العمر يجب أن يكون بين 10 و 100 سنة'
  }

  const weight = Number(values.weight)
  if (values.weight === '' || values.weight === null || values.weight === undefined || !Number.isFinite(weight)) {
    errors.weight = 'الوزن مطلوب'
  } else if (weight < 25 || weight > 300) {
    errors.weight = 'الوزن يجب أن يكون بين 25 و 300 كجم'
  }

  const height = Number(values.height)
  if (values.height === '' || values.height === null || values.height === undefined || !Number.isFinite(height)) {
    errors.height = 'الطول مطلوب'
  } else if (height < 100 || height > 250) {
    errors.height = 'الطول يجب أن يكون بين 100 و 250 سم'
  }

  if (!values.startDate || !parseISODate(values.startDate)) {
    errors.startDate = 'تاريخ بداية الاشتراك مطلوب (سنة-شهر-يوم)'
  }

  const months = Number(values.durationMonths)
  if (
    values.durationMonths === '' ||
    values.durationMonths === null ||
    values.durationMonths === undefined ||
    !Number.isFinite(months)
  ) {
    errors.durationMonths = 'مدة الاشتراك مطلوبة'
  } else if (months < 1 || months > 36) {
    errors.durationMonths = 'مدة الاشتراك من شهر إلى 36 شهر'
  }

  return errors
}

export function hasErrors(errors) {
  return Object.keys(errors ?? {}).some((key) => Boolean(errors[key]))
}

/**
 * تحقق من تمرين في محرر الخطة (شكل الفورم: قيم نصية).
 * @returns {Object} أخطاء لكل حقل
 */
export function validateExercise(values = {}) {
  const errors = {}

  const name = String(values.name ?? '').trim()
  if (name.length < 2) errors.name = 'اكتب اسم التمرين'

  const sets = Number(values.sets)
  if (!Number.isInteger(sets) || sets < 1 || sets > 20) {
    errors.sets = 'عدد المجموعات من 1 إلى 20'
  }

  const type = values.type === 'timed' ? 'timed' : 'reps'

  if (type === 'reps') {
    const repsMin = Number(values.repsMin)
    const repsMax = Number(values.repsMax)

    if (!Number.isInteger(repsMin) || repsMin < 1 || repsMin > 100) {
      errors.repsMin = 'أقل تكرارات من 1 إلى 100'
    }
    if (!Number.isInteger(repsMax) || repsMax < 1 || repsMax > 100) {
      errors.repsMax = 'أكبر تكرارات من 1 إلى 100'
    }
    if (!errors.repsMin && !errors.repsMax && repsMin > repsMax) {
      errors.repsMax = 'أكبر تكرارات لازم تكون أكبر من أو تساوي أقل تكرارات'
    }
  } else {
    const duration = Number(values.durationSec)
    if (!Number.isFinite(duration) || duration < 5 || duration > 3600) {
      errors.durationSec = 'مدة التمرين من 5 إلى 3600 ثانية'
    }
  }

  const rest = Number(values.restSec)
  if (!Number.isFinite(rest) || rest < 0 || rest > 900) {
    errors.restSec = 'الراحة من 0 إلى 900 ثانية'
  }

  const group = String(values.group ?? '').trim()
  if (group.length > 40) errors.group = 'اسم المجموعة طويل (40 حرف كحد أقصى)'

  const note = String(values.note ?? '').trim()
  if (note.length > 120) errors.note = 'الملاحظة طويلة (120 حرف كحد أقصى)'

  return errors
}
