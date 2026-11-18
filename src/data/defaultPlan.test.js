import { describe, expect, it } from 'vitest'
import { createDefaultPlan, createExercise, DEFAULT_PLAN, DEFAULT_PLAN_ERRORS } from './defaultPlan.js'
import { validateExerciseSchema, validatePlan } from '../utils/planSchema.js'
import { formatRepsRange } from '../utils/workout.js'

const thursday = DEFAULT_PLAN.days[5]

describe('bundled defaultPlan.json', () => {
  it('passes schema validation (no loader errors)', () => {
    expect(DEFAULT_PLAN_ERRORS).toEqual([])
    expect(validatePlan(DEFAULT_PLAN).valid).toBe(true)
  })

  it('has the real schedule: Push A / Pull A / rest / Push B / Pull B / Leg+abs / rest', () => {
    expect(DEFAULT_PLAN.days.map((day) => day.name)).toEqual([
      'Push A',
      'Pull A',
      'راحة',
      'Push B',
      'Pull B',
      'Leg + بطن وكور',
      'راحة',
    ])
    expect(DEFAULT_PLAN.days.map((day) => day.weekday)).toEqual([
      'saturday',
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
    ])
  })

  it('has rest on Monday and Friday', () => {
    expect(DEFAULT_PLAN.days[2]).toMatchObject({ name: 'راحة', isRest: true, exercises: [] })
    expect(DEFAULT_PLAN.days[6]).toMatchObject({ name: 'راحة', isRest: true, exercises: [] })
  })

  it('keeps stable slug-style ids', () => {
    expect(DEFAULT_PLAN.days[0].exercises[0]).toMatchObject({
      id: 'incline-dumbbell-press',
      sets: 4,
      repsMin: 8,
      repsMax: 10,
    })
    expect(DEFAULT_PLAN.days[1].exercises[0].id).toBe('wide-pull-ups')
    expect(DEFAULT_PLAN.days[3].exercises[0].id).toBe('machine-incline-press')
    expect(DEFAULT_PLAN.days[4].exercises[0].id).toBe('single-arm-cable-pulldown')
    expect(thursday.exercises.at(-1).id).toBe('pallof-press')
  })

  it('Thursday is split into "رجل" then "بطن وكور" groups', () => {
    const groups = thursday.exercises.map((exercise) => exercise.group)
    expect([...new Set(groups)]).toEqual(['رجل', 'بطن وكور'])
    expect(groups.indexOf('بطن وكور')).toBeGreaterThan(groups.lastIndexOf('رجل'))
  })

  it('has the plank as a 45s timed exercise and Pallof Press as perSide', () => {
    const plank = thursday.exercises.find((exercise) => exercise.id === 'plank')
    expect(plank).toMatchObject({ type: 'timed', sets: 3, durationSec: 45, restSec: 45 })
    expect(formatRepsRange(plank)).toBe('3 \u00d7 45 ث')

    const pallof = thursday.exercises.find((exercise) => exercise.id === 'pallof-press')
    expect(pallof.perSide).toBe(true)
    expect(formatRepsRange(pallof)).toBe('3 \u00d7 10')
  })

  it('renders ranges like "4 × 8–10" and single values like "3 × 15"', () => {
    const incline = DEFAULT_PLAN.days[0].exercises[0]
    expect(formatRepsRange(incline)).toBe('4 \u00d7 8\u201310')

    const facePull = DEFAULT_PLAN.days[1].exercises.find((exercise) => exercise.id === 'face-pull')
    expect(formatRepsRange(facePull)).toBe('3 \u00d7 15')
  })

  it('createDefaultPlan returns a deep clone', () => {
    const copy = createDefaultPlan()
    copy.days[0].exercises[0].name = 'معدّل'
    copy.days[0].name = 'معدّل'
    expect(DEFAULT_PLAN.days[0].exercises[0].name).toBe('Incline Dumbbell Press')
    expect(DEFAULT_PLAN.days[0].name).toBe('Push A')
  })

  it('createExercise builds schema-valid exercises (reps + timed)', () => {
    const reps = createExercise({ name: 'Cable Curl', type: 'reps', sets: 3, repsMin: 10, repsMax: 12, restSec: 60 })
    expect(reps.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    expect(validateExerciseSchema(reps)).toEqual([])

    const timed = createExercise({ name: 'Plank', type: 'timed', sets: 2, durationSec: 60, restSec: 30 })
    expect(timed).toMatchObject({ type: 'timed', durationSec: 60, repsMin: 0, repsMax: 0 })
    expect(validateExerciseSchema(timed)).toEqual([])
  })
})
