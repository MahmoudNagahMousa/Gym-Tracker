import { describe, expect, it } from 'vitest'
import {
  addMonths,
  calculateEndDate,
  daysRemaining,
  getWeekDay,
  parseISODate,
  startOfDay,
  toISODate,
  WEEK_DAYS,
  weekdayIndex,
} from './date.js'

describe('toISODate / parseISODate', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(toISODate(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('parses valid ISO dates', () => {
    const parsed = parseISODate('2026-01-31')
    expect(parsed).toBeInstanceOf(Date)
    expect(toISODate(parsed)).toBe('2026-01-31')
  })

  it('rejects invalid dates and junk', () => {
    expect(parseISODate('2026-02-30')).toBeNull()
    expect(parseISODate('31-01-2026')).toBeNull()
    expect(parseISODate('')).toBeNull()
    expect(parseISODate(null)).toBeNull()
    expect(parseISODate(undefined)).toBeNull()
  })

  it('startOfDay zeroes the time', () => {
    const date = startOfDay(new Date(2026, 4, 4, 18, 45, 12))
    expect(date.getHours()).toBe(0)
    expect(date.getMinutes()).toBe(0)
  })
})

describe('addMonths (month overflow / clamping)', () => {
  it('31 Jan + 1 month = 28 Feb (not 3 Mar)', () => {
    expect(toISODate(addMonths(new Date(2026, 0, 31), 1))).toBe('2026-02-28')
  })

  it('31 Jan + 1 month = 29 Feb in a leap year', () => {
    expect(toISODate(addMonths(new Date(2024, 0, 31), 1))).toBe('2024-02-29')
  })

  it('31 Aug + 6 months = 28 Feb next year', () => {
    expect(toISODate(addMonths(new Date(2025, 7, 31), 6))).toBe('2026-02-28')
  })

  it('keeps the same day when possible', () => {
    expect(toISODate(addMonths(new Date(2026, 10, 17), 1))).toBe('2026-12-17')
    expect(toISODate(addMonths(new Date(2026, 10, 17), 12))).toBe('2027-11-17')
  })

  it('rolls over the year', () => {
    expect(toISODate(addMonths(new Date(2026, 11, 15), 1))).toBe('2027-01-15')
  })
})

describe('calculateEndDate', () => {
  it('adds the duration in months', () => {
    expect(calculateEndDate('2026-01-31', 1)).toBe('2026-02-28')
    expect(calculateEndDate('2026-11-17', 3)).toBe('2027-02-17')
  })

  it('returns null for bad input', () => {
    expect(calculateEndDate('', 1)).toBeNull()
    expect(calculateEndDate('2026-11-17', 0)).toBeNull()
    expect(calculateEndDate('2026-11-17', -2)).toBeNull()
    expect(calculateEndDate('nope', 1)).toBeNull()
  })
})

describe('daysRemaining', () => {
  it('is 0 when the subscription ends today', () => {
    expect(daysRemaining('2026-11-17', new Date(2026, 10, 17, 23, 30))).toBe(0)
  })

  it('counts the days left', () => {
    expect(daysRemaining('2026-11-22', new Date(2026, 10, 17, 9, 0))).toBe(5)
    expect(daysRemaining('2026-11-18', new Date(2026, 10, 17, 9, 0))).toBe(1)
  })

  it('goes negative when expired', () => {
    expect(daysRemaining('2026-11-10', new Date(2026, 10, 17, 9, 0))).toBe(-7)
  })

  it('handles month boundaries', () => {
    expect(daysRemaining('2026-12-01', new Date(2026, 10, 30, 22, 0))).toBe(1)
  })

  it('returns null for invalid end date', () => {
    expect(daysRemaining('bad-date')).toBeNull()
    expect(daysRemaining(null)).toBeNull()
  })
})

describe('weekday mapping (plan starts on Saturday)', () => {
  it('has 7 days starting with Saturday', () => {
    expect(WEEK_DAYS).toHaveLength(7)
    expect(WEEK_DAYS[0].label).toBe('السبت')
    expect(WEEK_DAYS[6].label).toBe('الجمعة')
  })

  it('maps Saturday to index 0 and Friday to index 6', () => {
    expect(weekdayIndex(new Date(2026, 10, 14))).toBe(0) // Saturday 14 Nov 2026
    expect(weekdayIndex(new Date(2026, 10, 15))).toBe(1) // Sunday
    expect(weekdayIndex(new Date(2026, 10, 17))).toBe(3) // Tuesday
    expect(weekdayIndex(new Date(2026, 10, 20))).toBe(6) // Friday
  })

  it('getWeekDay falls back to Saturday', () => {
    expect(getWeekDay(0).id).toBe('sat')
    expect(getWeekDay(99).id).toBe('sat')
  })
})
