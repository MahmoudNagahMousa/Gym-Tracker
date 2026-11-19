import { describe, expect, it } from 'vitest'
import {
  STATUS,
  buildDayStatus,
  buildHeatmapWeeks,
  calculateLongestStreak,
  calculateStreak,
  countSessionsThisMonth,
  countTrainedDays,
  getTrainedDates,
  normalizeSessionDate,
} from './consistency.js'

/**
 * خطة بنفس شكل defaultPlan: السبت أول يوم (index 0).
 * راحة: الإثنين (2) والجمعة (6).
 */
const PLAN = {
  version: 1,
  days: [
    { weekday: 'saturday', index: 0, name: 'Push A', isRest: false, exercises: [] },
    { weekday: 'sunday', index: 1, name: 'Pull A', isRest: false, exercises: [] },
    { weekday: 'monday', index: 2, name: 'راحة', isRest: true, exercises: [] },
    { weekday: 'tuesday', index: 3, name: 'Push B', isRest: false, exercises: [] },
    { weekday: 'wednesday', index: 4, name: 'Pull B', isRest: false, exercises: [] },
    { weekday: 'thursday', index: 5, name: 'Leg + بطن وكور', isRest: false, exercises: [] },
    { weekday: 'friday', index: 6, name: 'راحة', isRest: true, exercises: [] },
  ],
}

/** الأربعاء 18 نوفمبر 2026 — "النهارده" الثابت في كل الاختبارات */
const TODAY = new Date(2026, 10, 18, 9, 0)

const session = (date, dayName = '') => ({ id: `s-${date}`, date, dayName })

describe('buildDayStatus', () => {
  it('is trained when a finished session exists', () => {
    expect(buildDayStatus('2026-11-18', [session('2026-11-18', 'Pull B')], PLAN, TODAY)).toBe(
      STATUS.TRAINED,
    )
  })

  it('is rest for a planned rest day without a session (Monday)', () => {
    expect(buildDayStatus('2026-11-16', [], PLAN, TODAY)).toBe(STATUS.REST)
  })

  it('stays trained when the user trained on a rest day', () => {
    expect(buildDayStatus('2026-11-16', [session('2026-11-16')], PLAN, TODAY)).toBe(
      STATUS.TRAINED,
    )
  })

  it('is missed for a past training day without a session (Tuesday)', () => {
    expect(buildDayStatus('2026-11-17', [], PLAN, TODAY)).toBe(STATUS.MISSED)
  })

  it('is today (not missed) when today has no session yet', () => {
    expect(buildDayStatus('2026-11-18', [], PLAN, TODAY)).toBe(STATUS.TODAY)
  })

  it('is future for days after today', () => {
    expect(buildDayStatus('2026-11-19', [], PLAN, TODAY)).toBe(STATUS.FUTURE)
  })

  it('uses the current plan weekday mapping (Friday is rest)', () => {
    expect(buildDayStatus('2026-11-13', [], PLAN, TODAY)).toBe(STATUS.REST)
  })

  it('does not crash on an invalid date', () => {
    expect(buildDayStatus('garbage', [], PLAN, TODAY)).toBe(STATUS.FUTURE)
  })
})

describe('buildHeatmapWeeks', () => {
  it('returns 12 weeks ending with the current week', () => {
    const weeks = buildHeatmapWeeks(TODAY, 12, [], PLAN)
    expect(weeks).toHaveLength(12)
    expect(weeks[0].days[0].date).toBe('2026-08-29')
    expect(weeks.at(-1).days[0].date).toBe('2026-11-14')
  })

  it('starts every week on Saturday (row 0 = السبت)', () => {
    const weeks = buildHeatmapWeeks(TODAY, 12, [], PLAN)
    const currentWeek = weeks.at(-1)
    expect(currentWeek.days).toHaveLength(7)
    expect(currentWeek.days[0].date).toBe('2026-11-14') // Saturday
    expect(currentWeek.days[0].dayName).toBe('السبت')
    expect(currentWeek.days[1].dayName).toBe('الأحد')
    expect(currentWeek.days[6].date).toBe('2026-11-20') // Friday
    expect(currentWeek.days[6].dayName).toBe('الجمعة')
  })

  it('marks the days after today as future', () => {
    const weeks = buildHeatmapWeeks(TODAY, 12, [], PLAN)
    const currentWeek = weeks.at(-1)
    expect(currentWeek.days[4].date).toBe('2026-11-18')
    expect(currentWeek.days[4].status).toBe(STATUS.TODAY)
    expect(currentWeek.days[5].status).toBe(STATUS.FUTURE)
    expect(currentWeek.days[6].status).toBe(STATUS.FUTURE)
  })
})

describe('normalizeSessionDate (local calendar day)', () => {
  it('keeps a bare YYYY-MM-DD as the same local day', () => {
    expect(normalizeSessionDate('2026-11-17')).toBe('2026-11-17')
  })

  it('counts a 23:30 local session for that same day', () => {
    const lateNight = new Date(2026, 10, 17, 23, 30)
    expect(normalizeSessionDate(lateNight.toISOString())).toBe('2026-11-17')
    expect(
      buildDayStatus('2026-11-17', [{ date: lateNight.toISOString() }], PLAN, TODAY),
    ).toBe(STATUS.TRAINED)
  })

  it('counts a 00:15 local session for the new day', () => {
    const afterMidnight = new Date(2026, 10, 18, 0, 15)
    expect(normalizeSessionDate(afterMidnight.toISOString())).toBe('2026-11-18')
  })

  it('accepts Date objects', () => {
    expect(normalizeSessionDate(new Date(2026, 10, 17, 22, 0))).toBe('2026-11-17')
  })

  it('returns null for invalid values', () => {
    expect(normalizeSessionDate(null)).toBeNull()
    expect(normalizeSessionDate('')).toBeNull()
    expect(normalizeSessionDate('garbage')).toBeNull()
    expect(normalizeSessionDate('2026-02-30')).toBeNull()
  })
})

describe('getTrainedDates (defensive parsing)', () => {
  it('counts one day once even with several sessions', () => {
    const dates = getTrainedDates([
      session('2026-11-18'),
      session('2026-11-18'),
      { date: new Date(2026, 10, 18, 21, 0).toISOString() },
    ])
    expect(dates.size).toBe(1)
    expect(dates.has('2026-11-18')).toBe(true)
  })

  it('ignores empty and corrupted sessions', () => {
    const corrupted = [
      null,
      undefined,
      'x',
      {},
      { date: null },
      { date: '' },
      { date: 'garbage' },
      { date: '2026-02-30' },
      { date: {} },
    ]
    expect(getTrainedDates(corrupted).size).toBe(0)
    expect(() => buildHeatmapWeeks(TODAY, 12, corrupted, PLAN)).not.toThrow()
    expect(countTrainedDays(TODAY, 30, corrupted)).toBe(0)
  })

  it('ignores sessions that reference deleted exercises (extra fields are fine)', () => {
    const stale = [{ id: 's1', date: '2026-11-18', exercises: [{ exerciseId: 'deleted' }] }]
    expect(getTrainedDates(stale).has('2026-11-18')).toBe(true)
  })
})

describe('countTrainedDays', () => {
  it('counts trained days in the last 30 days (today included)', () => {
    const sessions = [
      session('2026-11-18'), // today
      session('2026-10-20'), // 29 days ago -> inside
      session('2026-10-19'), // 30 days ago -> outside
      session('2026-11-01'),
    ]
    expect(countTrainedDays(TODAY, 30, sessions)).toBe(3)
  })

  it('is 0 with no sessions', () => {
    expect(countTrainedDays(TODAY, 30, [])).toBe(0)
  })

  it('ignores future dated sessions', () => {
    expect(countTrainedDays(TODAY, 30, [session('2026-11-25')])).toBe(0)
  })
})

describe('countSessionsThisMonth', () => {
  it('counts every finished session in the current local month', () => {
    const sessions = [
      session('2026-11-01'),
      session('2026-11-18'),
      session('2026-10-31'), // الشهر اللي فات
      session('2026-12-01'), // الشهر الجاي
    ]
    expect(countSessionsThisMonth(TODAY, sessions)).toBe(2)
  })

  it('counts two sessions on the same day as two sessions', () => {
    expect(
      countSessionsThisMonth(TODAY, [session('2026-11-18'), session('2026-11-18')]),
    ).toBe(2)
  })

  it('handles late-night sessions by local calendar day', () => {
    const lateNight = new Date(2026, 10, 30, 23, 30)
    expect(countSessionsThisMonth(TODAY, [{ date: lateNight.toISOString() }])).toBe(1)
  })

  it('is 0 for empty or corrupted sessions', () => {
    expect(countSessionsThisMonth(TODAY, [])).toBe(0)
    expect(countSessionsThisMonth(TODAY, [null, {}, { date: 'garbage' }])).toBe(0)
  })
})

describe('calculateStreak', () => {
  it('counts an unbroken streak across rest days', () => {
    const sessions = [
      session('2026-11-18'), // Wed - trained
      session('2026-11-17'), // Tue - trained
      // Mon = rest
      session('2026-11-15'), // Sun - trained
      session('2026-11-14'), // Sat - trained
      // Fri = rest
      // Thu 12 Nov = training day without a session -> breaks
    ]
    expect(calculateStreak(TODAY, sessions, PLAN)).toBe(6)
  })

  it('is broken by a missed training day', () => {
    expect(calculateStreak(TODAY, [session('2026-11-18')], PLAN)).toBe(1)
  })

  it('does not break when today has not been trained yet', () => {
    // Tue trained + Mon rest, then Sunday (training day) is missing
    expect(calculateStreak(TODAY, [session('2026-11-17')], PLAN)).toBe(2)
  })

  it('is 0 when there is nothing to count', () => {
    expect(calculateStreak(TODAY, [], PLAN)).toBe(0)
  })

  it('counts a rest day today as part of the streak', () => {
    const friday = new Date(2026, 10, 20, 9, 0)
    expect(calculateStreak(friday, [], PLAN)).toBe(1)
  })
})

describe('calculateLongestStreak', () => {
  it('finds the longest run inside the displayed weeks (rest days included)', () => {
    const weeks = buildHeatmapWeeks(
      TODAY,
      4,
      [session('2026-11-14'), session('2026-11-15'), session('2026-11-17'), session('2026-11-18')],
      PLAN,
    )
    // الجمعة 13 (راحة) + السبت 14 + الأحد 15 + الإثنين 16 (راحة) + الثلاثاء 17 + الأربعاء 18
    expect(calculateLongestStreak(weeks)).toBe(6)
  })

  it('does not count future days', () => {
    const weeks = buildHeatmapWeeks(TODAY, 2, [], PLAN)
    // كل الأيام اللي فاتت "غير ملتزم" ما عدا أيام الراحة المتفرقة
    expect(calculateLongestStreak(weeks)).toBeLessThanOrEqual(2)
  })

  it('is 0 for empty weeks', () => {
    expect(calculateLongestStreak([])).toBe(0)
  })
})
