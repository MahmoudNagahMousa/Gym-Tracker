import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import HomePage from './HomePage.jsx'
import { AppProvider } from '../context/AppContext.jsx'
import { DEFAULT_PLAN } from '../data/defaultPlan.js'
import { STORAGE_KEYS } from '../storage/keys.js'

/** السبت 14 نوفمبر 2026 — يوم تمرين (Push A) */
const SATURDAY = new Date(2026, 10, 14, 9, 0)
/** الإثنين 16 نوفمبر 2026 — يوم راحة في الخطة */
const MONDAY = new Date(2026, 10, 16, 9, 0)
/** الخميس 19 نوفمبر 2026 — "النهارده" الثابت لاختبارات الاشتراك */
const TODAY = new Date(2026, 10, 19, 12, 0)

const session = (date, dayName = 'Push A') => ({ id: `s-${date}`, date, dayName })
const weight = (id, date, value) => ({ id, date, weight: value })

function renderHome({
  today = SATURDAY,
  profile,
  plan = DEFAULT_PLAN,
  sessions = [],
  weightHistory = [],
} = {}) {
  const user = userEvent.setup()
  const result = render(
    <AppProvider initialState={{ plan, profile, sessions, weightHistory }}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage today={today} />} />
          <Route path="/workout" element={<h1>صفحة التمرين</h1>} />
          <Route path="/profile" element={<h1>صفحة البيانات</h1>} />
        </Routes>
      </MemoryRouter>
    </AppProvider>,
  )
  return { user, ...result }
}

describe('HomePage', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('greets the user by name when the profile has one', () => {
    renderHome({ profile: { name: 'محمود', startDate: '2026-11-01', durationMonths: 1 } })
    expect(screen.getByRole('heading', { name: 'أهلاً يا محمود 👋' })).toBeInTheDocument()
  })

  it('shows a generic greeting when there is no name', () => {
    renderHome()
    expect(screen.getByRole('heading', { name: 'أهلاً بيك 👋' })).toBeInTheDocument()
  })

  it("shows today's training day with a start button that opens the workout page", async () => {
    const { user } = renderHome({ today: SATURDAY })

    const card = screen.getByTestId('home-today-card')
    expect(card).toHaveTextContent('السبت — Push A')
    expect(card).toHaveTextContent('صدر علوي + كتف')
    expect(card).toHaveTextContent('6 تمرين')

    await user.click(screen.getByRole('link', { name: 'ابدأ التمرين' }))
    expect(await screen.findByRole('heading', { name: 'صفحة التمرين' })).toBeInTheDocument()
  })

  it('shows a rest message with no start button on a planned rest day', () => {
    renderHome({ today: MONDAY })

    expect(screen.getByTestId('home-state-rest')).toHaveTextContent('يوم راحة 😴')
    expect(screen.queryByTestId('home-start')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'ابدأ التمرين' })).not.toBeInTheDocument()
  })

  it('shows the finished message when a session was already logged today', () => {
    renderHome({ today: SATURDAY, sessions: [session('2026-11-14')] })

    expect(screen.getByTestId('home-state-trained')).toHaveTextContent('خلصت تمرين النهارده ✅')
    expect(screen.queryByTestId('home-start')).not.toBeInTheDocument()
  })

  it('renders the quick stats row from the consistency utils', () => {
    renderHome({
      today: SATURDAY,
      sessions: [session('2026-11-14'), session('2026-11-10'), session('2026-11-03')],
    })

    expect(screen.getByTestId('home-stat-streak')).toHaveTextContent('السلسلة الحالية')
    expect(screen.getByTestId('home-stat-last30')).toHaveTextContent('30')
    expect(screen.getByTestId('home-stat-month')).toHaveTextContent('3 جلسة')
  })

  it('renders the consistency heatmap', () => {
    renderHome()
    expect(screen.getByTestId('consistency-tracker')).toBeInTheDocument()
  })

  it('renders the weight chart when there are at least 2 entries', () => {
    renderHome({
      weightHistory: [weight('w1', '2026-11-01T10:00:00.000Z', 82), weight('w2', '2026-11-15T10:00:00.000Z', 80)],
    })

    expect(screen.getByRole('img', { name: /رسم بياني لتغير الوزن/ })).toBeInTheDocument()
    expect(screen.getByTestId('home-latest-weight-value')).toHaveTextContent('80')
    expect(screen.queryByTestId('home-weight-empty')).not.toBeInTheDocument()
  })

  it('shows the weight empty state with a link to the profile page', async () => {
    const { user } = renderHome({ weightHistory: [weight('w1', '2026-11-01T10:00:00.000Z', 82)] })

    expect(screen.getByTestId('home-weight-empty')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /رسم بياني/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'سجّل وزنك' }))
    expect(await screen.findByRole('heading', { name: 'صفحة البيانات' })).toBeInTheDocument()
  })

  it('does not crash when the plan is empty or invalid', () => {
    renderHome({ plan: { version: 1, days: [] } })

    expect(screen.getByTestId('home-today-card')).toHaveTextContent('مفيش خطة متاحة')
    expect(screen.queryByTestId('home-start')).not.toBeInTheDocument()
    expect(screen.getByTestId('consistency-tracker')).toBeInTheDocument()
  })

  // ---------------- الاشتراك ----------------
  describe('subscription card', () => {
    it('shows dates, remaining days and a green status when the subscription is healthy', () => {
      vi.useFakeTimers()
      vi.setSystemTime(TODAY)
      renderHome({ today: TODAY, profile: { name: 'محمود', startDate: '2026-11-01', durationMonths: 1 } })

      const card = screen.getByTestId('home-subscription-card')
      expect(card).toHaveTextContent('بداية الاشتراك')
      expect(card).toHaveTextContent('تاريخ الانتهاء')
      expect(screen.getByTestId('home-subscription-badge')).toHaveTextContent('نشط')
      expect(screen.getByTestId('home-days-remaining')).toHaveTextContent('باقي 12 يوم')
      expect(screen.getByTestId('home-subscription-state')).toHaveTextContent('الاشتراك شغال')

      // مفيش بانر لما الاشتراك لسه بعيد
      expect(screen.queryByTestId('renewal-banner')).not.toBeInTheDocument()
    })

    it('turns yellow and shows the banner when 5 days or fewer remain', () => {
      vi.useFakeTimers()
      vi.setSystemTime(TODAY)
      // 24 أكتوبر + شهر = 24 نوفمبر -> باقي 5 أيام
      renderHome({ today: TODAY, profile: { name: 'محمود', startDate: '2026-10-24', durationMonths: 1 } })

      expect(screen.getByTestId('home-subscription-badge')).toHaveTextContent('قرب يخلص')
      expect(screen.getByTestId('home-days-remaining')).toHaveTextContent('باقي 5 يوم')
      expect(screen.getByTestId('home-subscription-state')).toHaveTextContent('باقي 5 يوم على انتهاء الاشتراك')

      const banner = screen.getByTestId('renewal-banner')
      expect(banner).toHaveAttribute('data-variant', 'warning')
    })

    it('turns red with "انتهى الاشتراك" when the subscription is expired', () => {
      vi.useFakeTimers()
      vi.setSystemTime(TODAY)
      renderHome({ today: TODAY, profile: { name: 'محمود', startDate: '2020-01-01', durationMonths: 1 } })

      expect(screen.getByTestId('home-subscription-badge')).toHaveTextContent('انتهى الاشتراك')
      expect(screen.getByTestId('home-subscription-state')).toHaveTextContent('انتهى الاشتراك')
      expect(screen.getByTestId('home-days-remaining')).toHaveTextContent('متأخر')

      const banner = screen.getByTestId('renewal-banner')
      expect(banner).toHaveAttribute('data-variant', 'danger')
    })

    it('shows an empty state with a link to the profile when there is no start date', () => {
      renderHome({ today: TODAY, profile: { name: 'محمود' } })

      const empty = screen.getByTestId('home-subscription-empty')
      expect(empty).toHaveTextContent('ضيف تاريخ اشتراكك')
      expect(screen.getByRole('link', { name: 'ضيف تاريخ اشتراكك' })).toHaveAttribute(
        'href',
        '/profile',
      )
      expect(screen.queryByTestId('home-renew-button')).not.toBeInTheDocument()
      expect(screen.queryByTestId('renewal-banner')).not.toBeInTheDocument()
    })

    it('restarts the subscription from today when renewing', () => {
      vi.useFakeTimers()
      vi.setSystemTime(TODAY)
      renderHome({ today: TODAY, profile: { name: 'محمود', startDate: '2026-10-24', durationMonths: 1 } })

      expect(screen.getByTestId('renewal-banner')).toBeInTheDocument()

      fireEvent.click(screen.getByTestId('home-renew-button'))

      // الاشتراك بدأ من النهارده (19 نوفمبر) + شهر = 19 ديسمبر -> باقي 30 يوم
      expect(screen.getByTestId('home-days-remaining')).toHaveTextContent('باقي 30 يوم')
      expect(screen.getByTestId('home-subscription-badge')).toHaveTextContent('نشط')
      expect(screen.queryByTestId('renewal-banner')).not.toBeInTheDocument()

      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.profile))
      expect(stored.startDate).toBe('2026-11-19')
      expect(stored.durationMonths).toBe(1)
    })
  })

  // ---------------- BMI ----------------
  describe('BMI card', () => {
    it('shows the saved BMI value and its Arabic category', () => {
      renderHome({ today: TODAY, profile: { name: 'محمود', weight: 80, height: 180 } })

      expect(screen.getByTestId('home-bmi-value')).toHaveTextContent('24.7')
      expect(screen.getByTestId('home-bmi-card')).toHaveTextContent('وزن طبيعي')
    })

    it('shows an empty state with a link to the profile when data is missing', () => {
      renderHome({ today: TODAY, profile: { name: 'محمود', weight: 80 } })

      expect(screen.queryByTestId('home-bmi-value')).not.toBeInTheDocument()
      expect(screen.getByTestId('home-bmi-card')).toHaveTextContent('سجّل وزنك وطولك')
      expect(screen.getByRole('link', { name: 'افتح بياناتي' })).toHaveAttribute('href', '/profile')
    })
  })

  // ---------------- آخر وزن ----------------
  describe('latest weight card', () => {
    it('shows an empty state when there are no entries', () => {
      renderHome({ today: TODAY, weightHistory: [] })

      expect(screen.getByTestId('home-latest-weight-empty')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'ضيف وزنك' })).toHaveAttribute('href', '/profile')
    })

    it('shows the value and date without a difference for a single entry', () => {
      renderHome({ today: TODAY, weightHistory: [weight('w1', '2026-11-15T10:00:00.000Z', 80)] })

      expect(screen.getByTestId('home-latest-weight-value')).toHaveTextContent('80')
      expect(screen.getByTestId('home-latest-weight-date')).toBeInTheDocument()
      expect(screen.queryByTestId('home-weight-diff')).not.toBeInTheDocument()
    })

    it('shows a negative difference when weight went down', () => {
      renderHome({
        today: TODAY,
        weightHistory: [
          weight('w1', '2026-11-01T10:00:00.000Z', 82),
          weight('w2', '2026-11-15T10:00:00.000Z', 80.5),
        ],
      })

      expect(screen.getByTestId('home-latest-weight-value')).toHaveTextContent('80.5')
      expect(screen.getByTestId('home-weight-diff')).toHaveTextContent('-1.5 كجم')
    })

    it('shows a positive difference with a plus sign when weight went up', () => {
      renderHome({
        today: TODAY,
        weightHistory: [
          weight('w1', '2026-11-01T10:00:00.000Z', 80),
          weight('w2', '2026-11-15T10:00:00.000Z', 80.3),
        ],
      })

      expect(screen.getByTestId('home-weight-diff')).toHaveTextContent('+0.3 كجم')
    })
  })
})
