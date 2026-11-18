import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RenewalBanner from './RenewalBanner.jsx'
import { AppProvider } from '../context/AppContext.jsx'
import { STORAGE_KEYS } from '../storage/keys.js'

function renderBanner(profile) {
  return render(
    <AppProvider initialState={{ profile }}>
      <MemoryRouter>
        <RenewalBanner />
      </MemoryRouter>
    </AppProvider>,
  )
}

// النهارده ثابت = 17 نوفمبر 2026
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 10, 17, 12, 0, 0))
})

describe('RenewalBanner', () => {
  it('does not render when there is no profile', () => {
    renderBanner(null)
    expect(screen.queryByTestId('renewal-banner')).toBeNull()
  })

  it('does not render when the subscription is far from expiring', () => {
    // 1 نوفمبر + شهر = 1 ديسمبر -> باقي 14 يوم
    renderBanner({ name: 'محمود', startDate: '2026-11-01', durationMonths: 1 })
    expect(screen.queryByTestId('renewal-banner')).toBeNull()
  })

  it('shows the yellow warning when 5 days or fewer remain', () => {
    // 20 أكتوبر + شهر = 20 نوفمبر -> باقي 3 أيام
    renderBanner({ name: 'محمود', startDate: '2026-10-20', durationMonths: 1 })

    const banner = screen.getByTestId('renewal-banner')
    expect(banner).toBeInTheDocument()
    expect(banner).toHaveAttribute('data-variant', 'warning')
    expect(screen.getByText(/باقي 3 يوم على انتهاء الاشتراك/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'تم التجديد' })).toBeInTheDocument()
  })

  it('shows the warning on the exact 5th day', () => {
    // 22 أكتوبر + شهر = 22 نوفمبر -> باقي 5 أيام
    renderBanner({ name: 'محمود', startDate: '2026-10-22', durationMonths: 1 })
    expect(screen.getByTestId('renewal-banner')).toHaveAttribute('data-variant', 'warning')
    expect(screen.getByText(/باقي 5 يوم/)).toBeInTheDocument()
  })

  it('shows the red banner when expired', () => {
    // 10 سبتمبر + شهر = 10 أكتوبر -> متأخر كتير
    renderBanner({ name: 'محمود', startDate: '2026-09-10', durationMonths: 1 })

    const banner = screen.getByTestId('renewal-banner')
    expect(banner).toHaveAttribute('data-variant', 'danger')
    expect(screen.getByText(/انتهى اشتراكك/)).toBeInTheDocument()
  })

  it('renews the subscription from today and hides the banner', () => {
    renderBanner({ name: 'محمود', startDate: '2026-10-20', durationMonths: 1 })
    expect(screen.getByTestId('renewal-banner')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'تم التجديد' }))

    expect(screen.queryByTestId('renewal-banner')).toBeNull()

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.profile))
    expect(stored.startDate).toBe('2026-11-17')
    expect(stored.durationMonths).toBe(1)
  })
})
