import { describe, expect, it } from 'vitest'
import { STORAGE_KEYS } from './keys.js'
import { loadPlan, PLAN_WARNINGS, restoreDefaultPlan, savePlan } from './planStorage.js'
import { DEFAULT_PLAN } from '../data/defaultPlan.js'
import { WEEK_DAYS } from '../utils/date.js'

const write = (key, value) => window.localStorage.setItem(key, JSON.stringify(value))
const read = (key) => JSON.parse(window.localStorage.getItem(key))

/** خطة بالشكل القديم (reps رقم واحد) */
function createLegacyPlan() {
  return {
    version: 1,
    days: WEEK_DAYS.map((weekDay, index) => ({
      id: weekDay.id,
      label: weekDay.label,
      name: index === 0 ? 'Push (قديمة)' : 'راحة',
      exercises:
        index === 0
          ? [
              { id: 'old-bench', name: 'بنش قديم', type: 'reps', sets: 4, reps: 12, durationSec: 0, restSec: 90 },
              { id: 'old-plank', name: 'بلانك قديم', type: 'timed', sets: 3, reps: 0, durationSec: 60, restSec: 45 },
            ]
          : [],
    })),
  }
}

describe('planStorage migration', () => {
  it('migrates an old plan and never touches profile / sessions / weights', () => {
    write(STORAGE_KEYS.profile, { name: 'محمود', weight: 80 })
    write(STORAGE_KEYS.sessions, [{ id: 's1', exercises: [{ exerciseId: 'old-bench', name: 'بنش قديم' }] }])
    write(STORAGE_KEYS.weightHistory, [{ id: 'w1', weight: 80 }])
    write(STORAGE_KEYS.legacyPlan, createLegacyPlan())

    const result = loadPlan()

    expect(result.source).toBe('migrated')
    expect(result.warning).toBe(PLAN_WARNINGS.migrated)
    expect(result.plan.days[0].exercises[0]).toMatchObject({ repsMin: 12, repsMax: 12 })
    expect(result.plan.days[0].isRest).toBe(false)
    expect(result.plan.days[6].isRest).toBe(true)

    // الخطة الجديدة اتكتبت في المفتاح الجديد والقديم اتشال
    expect(read(STORAGE_KEYS.plan).days[0].name).toBe('Push (قديمة)')
    expect(window.localStorage.getItem(STORAGE_KEYS.legacyPlan)).toBeNull()

    // بيانات المستخدم زي ما هي
    expect(read(STORAGE_KEYS.profile)).toEqual({ name: 'محمود', weight: 80 })
    expect(read(STORAGE_KEYS.sessions)).toHaveLength(1)
    expect(read(STORAGE_KEYS.weightHistory)).toHaveLength(1)
  })

  it('falls back to the default plan when the legacy plan cannot be migrated', () => {
    write(STORAGE_KEYS.legacyPlan, { days: [{ name: 'مكسور' }] })
    write(STORAGE_KEYS.sessions, [{ id: 's1' }])
    write(STORAGE_KEYS.profile, { name: 'محمود' })

    const result = loadPlan()

    expect(result.source).toBe('reset')
    expect(result.warning).toBe(PLAN_WARNINGS.resetInvalidLegacy)
    expect(result.plan.days).toHaveLength(7)
    expect(read(STORAGE_KEYS.plan).days[0].name).toBe('Push A')
    expect(read(STORAGE_KEYS.sessions)).toHaveLength(1)
    expect(read(STORAGE_KEYS.profile)).toEqual({ name: 'محمود' })
  })

  it('replaces a corrupted stored plan with the default (with an Arabic warning)', () => {
    window.localStorage.setItem(STORAGE_KEYS.plan, '{"version": 1, "days": [,,,')
    write(STORAGE_KEYS.weightHistory, [{ id: 'w1', weight: 82 }])

    const result = loadPlan()

    expect(result.source).toBe('reset')
    expect(result.warning).toBe(PLAN_WARNINGS.resetInvalidStored)
    expect(read(STORAGE_KEYS.weightHistory)).toHaveLength(1)
  })

  it('replaces a structurally invalid stored plan', () => {
    write(STORAGE_KEYS.plan, { version: 1, days: [{ name: 'x' }] })
    const result = loadPlan()
    expect(result.source).toBe('reset')
    expect(result.plan.days[0].exercises.length).toBeGreaterThan(0)
  })

  it('returns a valid stored plan as-is', () => {
    write(STORAGE_KEYS.plan, DEFAULT_PLAN)
    const result = loadPlan()
    expect(result.source).toBe('stored')
    expect(result.warning).toBeNull()
    expect(result.plan.days[0].name).toBe('Push A')
  })

  it('returns the bundled default when there is nothing stored', () => {
    const result = loadPlan()
    expect(result.source).toBe('default')
    expect(result.warning).toBeNull()
    expect(result.plan.days[3].name).toBe('Push B')
  })

  it('refuses to save an invalid plan', () => {
    const result = savePlan({ version: 1, days: [] })
    expect(result.saved).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(window.localStorage.getItem(STORAGE_KEYS.plan)).toBeNull()
  })

  it('restoreDefaultPlan reloads the bundled JSON plan', () => {
    write(STORAGE_KEYS.plan, { version: 1, days: [] })

    const restored = restoreDefaultPlan()

    expect(restored.days[0].name).toBe(DEFAULT_PLAN.days[0].name)
    expect(read(STORAGE_KEYS.plan).days[5].name).toBe('Leg + بطن وكور')
  })
})
