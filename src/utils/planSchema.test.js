import { describe, expect, it } from 'vitest'
import { migrateLegacyPlan, validateExerciseSchema, validatePlan } from './planSchema.js'
import { DEFAULT_PLAN } from '../data/defaultPlan.js'
import { WEEK_DAYS } from './date.js'

const clone = (value) => JSON.parse(JSON.stringify(value))

function withBrokenExercise(index, patch) {
  const plan = clone(DEFAULT_PLAN)
  plan.days[0].exercises[index] = { ...plan.days[0].exercises[index], ...patch }
  return plan
}

describe('validatePlan', () => {
  it('accepts the bundled default plan', () => {
    const result = validatePlan(DEFAULT_PLAN)
    expect(result.errors).toEqual([])
    expect(result.valid).toBe(true)
  })

  it('rejects a plan without version', () => {
    const plan = clone(DEFAULT_PLAN)
    delete plan.version
    const result = validatePlan(plan)
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toContain('version')
  })

  it('rejects a plan with the wrong number of days', () => {
    const sixDays = clone(DEFAULT_PLAN)
    sixDays.days = sixDays.days.slice(0, 6)
    expect(validatePlan(sixDays).valid).toBe(false)
    expect(validatePlan(sixDays).errors.join(' ')).toContain('7')

    const eightDays = clone(DEFAULT_PLAN)
    eightDays.days = [...eightDays.days, { ...clone(DEFAULT_PLAN.days[6]), index: 7 }]
    expect(validatePlan(eightDays).valid).toBe(false)
  })

  it('rejects a plan when a weekday is missing or duplicated', () => {
    const duplicated = clone(DEFAULT_PLAN)
    duplicated.days[1].weekday = 'saturday'
    const result = validatePlan(duplicated)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('rejects an exercise with repsMin > repsMax', () => {
    const plan = withBrokenExercise(0, { repsMin: 12, repsMax: 8 })
    const result = validatePlan(plan)
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toContain('أكبر من أكبر تكرارات')
  })

  it('rejects a timed exercise without durationSec', () => {
    const plan = clone(DEFAULT_PLAN)
    const plankIndex = plan.days[5].exercises.findIndex((exercise) => exercise.id === 'plank')
    plan.days[5].exercises[plankIndex] = {
      id: plan.days[5].exercises[plankIndex].id,
      name: plan.days[5].exercises[plankIndex].name,
      type: 'timed',
      sets: 3,
      restSec: 45,
    }
    const result = validatePlan(plan)
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toContain('durationSec')
  })

  it('rejects an exercise missing id / name / type / sets', () => {
    const noId = withBrokenExercise(0, { id: undefined })
    expect(validatePlan(noId).valid).toBe(false)

    const noName = withBrokenExercise(0, { name: '' })
    expect(validatePlan(noName).valid).toBe(false)

    const noType = withBrokenExercise(0, { type: 'cardio' })
    expect(validatePlan(noType).valid).toBe(false)

    const noSets = withBrokenExercise(0, { sets: undefined })
    expect(validatePlan(noSets).valid).toBe(false)
  })

  it('rejects a negative restSec', () => {
    const plan = withBrokenExercise(0, { restSec: -10 })
    expect(validatePlan(plan).valid).toBe(false)
  })

  it('rejects non-slug ids and duplicated ids', () => {
    const badId = withBrokenExercise(0, { id: 'Incline Dumbbell Press!' })
    expect(validatePlan(badId).valid).toBe(false)

    const duplicated = clone(DEFAULT_PLAN)
    const firstId = duplicated.days[0].exercises[0].id
    duplicated.days[1].exercises[0].id = firstId
    expect(validatePlan(duplicated).valid).toBe(false)
  })

  it('rejects junk values without throwing', () => {
    expect(validatePlan(null).valid).toBe(false)
    expect(validatePlan(undefined).valid).toBe(false)
    expect(validatePlan('plan').valid).toBe(false)
    expect(validatePlan([]).valid).toBe(false)
    expect(validatePlan({}).valid).toBe(false)
    expect(validatePlan({ version: 1, days: 'nope' }).valid).toBe(false)
  })
})

describe('validateExerciseSchema', () => {
  it('accepts a valid reps exercise', () => {
    expect(
      validateExerciseSchema({
        id: 'bench-press',
        name: 'Bench Press',
        type: 'reps',
        sets: 4,
        repsMin: 8,
        repsMax: 10,
        restSec: 120,
        perSide: false,
        group: 'صدر',
        note: 'خفيف',
      }),
    ).toEqual([])
  })

  it('accepts repsMin === repsMax', () => {
    expect(
      validateExerciseSchema({
        id: 'face-pull',
        name: 'Face Pull',
        type: 'reps',
        sets: 3,
        repsMin: 15,
        repsMax: 15,
        restSec: 60,
      }),
    ).toEqual([])
  })
})

describe('migrateLegacyPlan', () => {
  const legacyPlan = {
    version: 1,
    days: WEEK_DAYS.map((weekDay, index) => ({
      id: weekDay.id,
      label: weekDay.label,
      name: index === 0 ? 'دفع' : 'راحة',
      exercises:
        index === 0
          ? [
              { id: 'bench-press', name: 'بنش برس', type: 'reps', sets: 4, reps: 10, durationSec: 0, restSec: 90 },
              { id: 'plank', name: 'بلانك', type: 'timed', sets: 3, reps: 0, durationSec: 60, restSec: 45 },
            ]
          : [],
    })),
  }

  it('converts the old reps number into a min/max range', () => {
    const migrated = migrateLegacyPlan(legacyPlan)
    expect(migrated).toBeTruthy()
    expect(validatePlan(migrated).valid).toBe(true)

    const first = migrated.days[0].exercises[0]
    expect(first).toMatchObject({ id: 'bench-press', type: 'reps', repsMin: 10, repsMax: 10, restSec: 90 })

    const plank = migrated.days[0].exercises[1]
    expect(plank).toMatchObject({ type: 'timed', durationSec: 60, restSec: 45 })
  })

  it('fills weekday/index/isRest for every day', () => {
    const migrated = migrateLegacyPlan(legacyPlan)
    expect(migrated.days.map((day) => day.weekday)).toEqual([
      'saturday',
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
    ])
    expect(migrated.days.map((day) => day.index)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(migrated.days.slice(1).every((day) => day.isRest)).toBe(true)
  })

  it('returns null when it cannot migrate safely', () => {
    expect(migrateLegacyPlan(null)).toBeNull()
    expect(migrateLegacyPlan('nope')).toBeNull()
    expect(migrateLegacyPlan({ days: [] })).toBeNull()
    expect(migrateLegacyPlan({ days: [1, 2, 3] })).toBeNull()
  })
})
