/**
 * مفاتيح localStorage — versioned عشان نعرف نعمل migration بعدين.
 * أي تغيير في شكل البيانات = نرفع STORAGE_VERSION.
 */
export const STORAGE_VERSION = 1

export const STORAGE_PREFIX = `gym-tracker:v${STORAGE_VERSION}:`

export const STORAGE_KEYS = {
  profile: `${STORAGE_PREFIX}profile`,
  plan: `${STORAGE_PREFIX}plan`,
  sessions: `${STORAGE_PREFIX}sessions`,
  weightHistory: `${STORAGE_PREFIX}weight-history`,
  activeLogs: `${STORAGE_PREFIX}active-logs`,
  settings: `${STORAGE_PREFIX}settings`,
}
