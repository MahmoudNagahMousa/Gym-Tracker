/**
 * حساب مؤشر كتلة الجسم (BMI) + التصنيف بالعربي.
 * BMI = الوزن(كجم) / (الطول(م))^2
 */

export const BMI_CATEGORIES = [
  { key: 'underweight', max: 18.5, label: 'نقص في الوزن', tone: 'warn' },
  { key: 'normal', max: 25, label: 'وزن طبيعي', tone: 'ok' },
  { key: 'overweight', max: 30, label: 'زيادة في الوزن', tone: 'warn' },
  { key: 'obese', max: Infinity, label: 'سمنة', tone: 'danger' },
]

/** @returns {number|null} مقرب لرقم عشري واحد */
export function calculateBMI(weightKg, heightCm) {
  const weight = Number(weightKg)
  const height = Number(heightCm)
  if (!Number.isFinite(weight) || !Number.isFinite(height)) return null
  if (weight <= 0 || height <= 0) return null
  const heightMeters = height / 100
  const bmi = weight / (heightMeters * heightMeters)
  if (!Number.isFinite(bmi)) return null
  return Math.round(bmi * 10) / 10
}

/** @returns {{key:string,label:string,tone:string,max:number}} */
export function getBMICategory(bmi) {
  const value = Number(bmi)
  if (!Number.isFinite(value) || value <= 0) {
    return { key: 'unknown', label: 'غير معروف', tone: 'muted', max: Infinity }
  }
  return BMI_CATEGORIES.find((category) => value < category.max) ?? BMI_CATEGORIES[BMI_CATEGORIES.length - 1]
}

/** helper واحد بيرجع الرقم + التصنيف */
export function getBMI(weightKg, heightCm) {
  const value = calculateBMI(weightKg, heightCm)
  if (value === null) return null
  return { value, category: getBMICategory(value) }
}
