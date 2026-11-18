import { describe, expect, it } from 'vitest'
import { calculateBMI, getBMI, getBMICategory } from './bmi.js'

describe('calculateBMI', () => {
  it('computes BMI and rounds to one decimal', () => {
    expect(calculateBMI(80, 180)).toBe(24.7)
    expect(calculateBMI(70, 175)).toBe(22.9)
    expect(calculateBMI(100, 170)).toBe(34.6)
  })

  it('accepts numeric strings (from form inputs)', () => {
    expect(calculateBMI('80', '180')).toBe(24.7)
  })

  it('returns null for invalid values', () => {
    expect(calculateBMI(0, 180)).toBeNull()
    expect(calculateBMI(80, 0)).toBeNull()
    expect(calculateBMI(-5, 180)).toBeNull()
    expect(calculateBMI('', 180)).toBeNull()
    expect(calculateBMI(80, 'abc')).toBeNull()
    expect(calculateBMI(undefined, undefined)).toBeNull()
  })
})

describe('getBMICategory', () => {
  it('classifies the ranges with Arabic labels', () => {
    expect(getBMICategory(17).label).toBe('نقص في الوزن')
    expect(getBMICategory(18.5).label).toBe('وزن طبيعي')
    expect(getBMICategory(24.9).label).toBe('وزن طبيعي')
    expect(getBMICategory(25).label).toBe('زيادة في الوزن')
    expect(getBMICategory(29.9).label).toBe('زيادة في الوزن')
    expect(getBMICategory(30).label).toBe('سمنة')
  })

  it('handles unknown values', () => {
    expect(getBMICategory(null).key).toBe('unknown')
    expect(getBMICategory(NaN).label).toBe('غير معروف')
  })
})

describe('getBMI', () => {
  it('returns value + category together', () => {
    const result = getBMI(80, 180)
    expect(result).not.toBeNull()
    expect(result.value).toBe(24.7)
    expect(result.category.label).toBe('وزن طبيعي')
  })

  it('returns null when inputs are invalid', () => {
    expect(getBMI(null, null)).toBeNull()
  })
})
