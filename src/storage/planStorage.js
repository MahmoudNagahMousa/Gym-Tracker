/**
 * تحميل/حفظ الخطة مع migration آمن.
 * - بنقرا المفتاح الجديد الأول، ولو تالف/ناقص بنجرّب نـmigrate القديم.
 * - لو الـ migration فشلت: بنستبدل الخطة بالافتراضية.
 * - الجلسات/البروفايل/الوزن عمرهم ما بيتلمسوا هنا.
 */
import { STORAGE_KEYS } from './keys.js'
import { readJSON, readRaw, removeKey, writeJSON } from './storage.js'
import { migrateLegacyPlan, validatePlan } from '../utils/planSchema.js'
import { createDefaultPlan } from '../data/defaultPlan.js'

export const PLAN_WARNINGS = {
  migrated: 'تم تحديث خطتك القديمة تلقائياً لشكل الخطة الجديد (مدى تكرارات + لكل جنب + مجموعات).',
  resetInvalidStored: 'الخطة المحفوظة كانت تالفة، فرجّعنا الخطة الافتراضية. تقدر تعدّلها من محرر الخطة.',
  resetInvalidLegacy: 'خطتك القديمة مش ممكن تحويلها بأمان، فاستبدلناها بالخطة الافتراضية.',
}

/**
 * @param {{ stored?: unknown, legacy?: unknown }} [override] للاختبارات
 * @returns {{ plan: object, source: 'stored'|'migrated'|'reset'|'default', warning: string|null }}
 */
export function loadPlan(override = {}) {
  const hasStoredOverride = 'stored' in override
  const stored = hasStoredOverride ? override.stored : readJSON(STORAGE_KEYS.plan, null)
  // JSON تالف = مفتاح موجود لكن مش مقروء
  const storedIsCorrupted = !hasStoredOverride && readRaw(STORAGE_KEYS.plan) !== null && stored === null

  if (stored || storedIsCorrupted) {
    const result = validatePlan(stored)
    if (result.valid) {
      return { plan: stored, source: 'stored', warning: null }
    }
    const fallback = createDefaultPlan()
    if (!hasStoredOverride) writeJSON(STORAGE_KEYS.plan, fallback)
    return { plan: fallback, source: 'reset', warning: PLAN_WARNINGS.resetInvalidStored }
  }

  const legacy = 'legacy' in override ? override.legacy : readJSON(STORAGE_KEYS.legacyPlan, null)

  if (legacy) {
    const migrated = migrateLegacyPlan(legacy)
    if (migrated) {
      if (!('legacy' in override)) {
        writeJSON(STORAGE_KEYS.plan, migrated)
        removeKey(STORAGE_KEYS.legacyPlan)
      }
      return { plan: migrated, source: 'migrated', warning: PLAN_WARNINGS.migrated }
    }
    const fallback = createDefaultPlan()
    if (!('legacy' in override)) {
      writeJSON(STORAGE_KEYS.plan, fallback)
      removeKey(STORAGE_KEYS.legacyPlan)
    }
    return { plan: fallback, source: 'reset', warning: PLAN_WARNINGS.resetInvalidLegacy }
  }

  return { plan: createDefaultPlan(), source: 'default', warning: null }
}

/** حفظ خطة (بنتحقق الأول — خطة غلط مش بتتحفظ) */
export function savePlan(plan) {
  const result = validatePlan(plan)
  if (!result.valid) return { saved: false, errors: result.errors }
  return { saved: writeJSON(STORAGE_KEYS.plan, plan), errors: [] }
}

/** استعادة الافتراضي من الـ JSON المضمّن */
export function restoreDefaultPlan() {
  const plan = createDefaultPlan()
  writeJSON(STORAGE_KEYS.plan, plan)
  return plan
}
