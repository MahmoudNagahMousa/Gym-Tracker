import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ConsistencyTracker from './ConsistencyTracker.jsx'
import { renderWithProviders } from '../test/utils.jsx'

/** الأربعاء 18 نوفمبر 2026 */
const TODAY = new Date(2026, 10, 18, 9, 0)

/** نفس خطة defaultPlan: راحة الإثنين (2) والجمعة (6) */
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

const session = (date, dayName = '') => ({ id: `s-${date}`, date, dayName })

/** ar-EG بيكتب الأرقام عربي (١٨) — بنحوّلها لاتيني عشان نقدر نقارن */
const toLatinDigits = (value) =>
  String(value ?? '').replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))

function renderTracker(sessions = []) {
  return renderWithProviders(<ConsistencyTracker today={TODAY} />, {
    initialState: { plan: PLAN, sessions },
  })
}

describe('ConsistencyTracker', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders 7 weekday rows and all 12 weeks of day cells', () => {
    const { container } = renderTracker()

    const weekdayLabels = container.querySelectorAll('[data-weekday]')
    expect(weekdayLabels).toHaveLength(7)
    expect(weekdayLabels[0]).toHaveTextContent('سبت')
    expect(weekdayLabels[6]).toHaveTextContent('جمع')

    // 12 أسبوع × 7 أيام (بما فيهم خلايا المستقبل الفاضية)
    expect(container.querySelectorAll('[data-date]')).toHaveLength(84)
  })

  it('marks a trained day in green with an Arabic aria-label', () => {
    const { container } = renderTracker([session('2026-11-18', 'Pull B')])

    const cell = container.querySelector('[data-date="2026-11-18"]')
    expect(cell.tagName).toBe('BUTTON')
    expect(cell).toHaveAttribute('data-status', 'trained')
    expect(cell.className).toContain('trained')
    expect(cell).toHaveAccessibleName(/تمرنت/)
    expect(toLatinDigits(cell.getAttribute('aria-label'))).toContain('18 نوفمبر 2026')
    expect(cell).toHaveAccessibleName(/Pull B/)
  })

  it('shows gray for missed days, light green for rest days and an outline for today', () => {
    const { container } = renderTracker()

    expect(container.querySelector('[data-date="2026-11-17"]')).toHaveAttribute(
      'data-status',
      'missed',
    )
    expect(container.querySelector('[data-date="2026-11-16"]')).toHaveAttribute(
      'data-status',
      'rest',
    )
    expect(container.querySelector('[data-date="2026-11-18"]')).toHaveAttribute(
      'data-status',
      'today',
    )
    expect(container.querySelector('[data-date="2026-11-19"]')).toHaveAttribute(
      'data-status',
      'future',
    )
  })

  it('does not render future days as interactive squares', () => {
    const { container } = renderTracker()
    const future = container.querySelector('[data-date="2026-11-19"]')
    expect(future.tagName).not.toBe('BUTTON')
    expect(future).toHaveAttribute('aria-hidden', 'true')
  })

  it('shows a caption with the date and the workout name when a cell is clicked', async () => {
    const { user, container } = renderTracker([session('2026-11-17', 'Push B')])

    await user.click(container.querySelector('[data-date="2026-11-17"]'))

    const caption = await screen.findByTestId('consistency-caption')
    expect(caption).toHaveTextContent('الثلاثاء')
    expect(toLatinDigits(caption.textContent)).toContain('17 نوفمبر 2026')
    expect(caption).toHaveTextContent('تمرنت')
    expect(caption).toHaveTextContent('Push B')
  })

  it('describes a rest day without a workout name', async () => {
    const { user, container } = renderTracker()

    await user.click(container.querySelector('[data-date="2026-11-16"]'))

    const caption = await screen.findByTestId('consistency-caption')
    expect(caption).toHaveTextContent('راحة')
    expect(caption).not.toHaveTextContent('Push B')
  })

  it('renders the legend and the summary numbers', () => {
    renderTracker([session('2026-11-18', 'Pull B')])

    expect(screen.getByTestId('legend-missed')).toHaveTextContent('غير ملتزم')
    expect(screen.getByTestId('legend-rest')).toHaveTextContent('راحة')
    expect(screen.getByTestId('legend-trained')).toHaveTextContent('تمرنت')

    expect(screen.getByTestId('consistency-summary')).toHaveTextContent(
      'واظبت 1 يوم من آخر 30 يوم',
    )
    expect(screen.getByTestId('consistency-streak')).toHaveTextContent('السلسلة الحالية')
    expect(screen.getByTestId('consistency-longest')).toHaveTextContent('أطول سلسلة')
  })

  it('renders without errors when there are no sessions', () => {
    const { container } = renderTracker()

    expect(screen.getByTestId('consistency-tracker')).toBeInTheDocument()
    expect(screen.getByTestId('consistency-summary')).toHaveTextContent('واظبت 0 يوم')
    expect(container.querySelectorAll('[data-date="2026-11-18"]')).toHaveLength(1)
  })

  it('renders without errors with corrupted sessions', () => {
    expect(() =>
      renderTracker([null, {}, { date: 'garbage' }, { date: null }, { id: 'x' }]),
    ).not.toThrow()
    expect(screen.getByTestId('consistency-summary')).toHaveTextContent('واظبت 0 يوم')
  })

  it('is keyboard focusable and toggles aria-pressed', async () => {
    const { user, container } = renderTracker([session('2026-11-17', 'Push B')])
    const cell = container.querySelector('[data-date="2026-11-17"]')

    expect(cell).toHaveAttribute('aria-pressed', 'false')
    cell.focus()
    expect(cell).toHaveFocus()

    await user.click(cell)
    expect(cell).toHaveAttribute('aria-pressed', 'true')

    await user.click(cell)
    expect(cell).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByTestId('consistency-caption')).not.toBeInTheDocument()
  })

  it('falls back to the real clock when no today prop is passed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 18, 9, 0))

    renderWithProviders(<ConsistencyTracker />, { initialState: { plan: PLAN, sessions: [] } })

    expect(screen.getByTestId('consistency-summary')).toHaveTextContent('واظبت 0 يوم')
    expect(screen.getByTestId('consistency-tracker')).toBeInTheDocument()
  })
})
