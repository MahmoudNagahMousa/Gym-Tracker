/**
 * مفاتيح localStorage — versioned عشان نعرف نعمل migration بعدين.
 *
 * ملاحظة مهمة: رفعنا نسخة مفتاح الخطة بس (v2) لأن شكل التمرين اتغيّر
 * (repsMin/repsMax/perSide/group/note). مفاتيح البروفايل/الجلسات/الوزن
 * زي ما هي — عشان مانلمسش بيانات المستخدم.
 */
export const STORAGE_VERSION = 1

export const STORAGE_PREFIX = `gym-tracker:v${STORAGE_VERSION}:`

/** نسخة شكل الخطة الحالية */
export const PLAN_STORAGE_VERSION = 2

export const STORAGE_KEYS = {
  profile: `${STORAGE_PREFIX}profile`,
  plan: `${STORAGE_PREFIX}plan:v${PLAN_STORAGE_VERSION}`,
  /** خطة النسخة القديمة (reps رقم واحد) — بنقراها مرة واحدة ونعمل migration */
  legacyPlan: `${STORAGE_PREFIX}plan`,
  sessions: `${STORAGE_PREFIX}sessions`,
  weightHistory: `${STORAGE_PREFIX}weight-history`,
  activeLogs: `${STORAGE_PREFIX}active-logs`,
  settings: `${STORAGE_PREFIX}settings`,
}
