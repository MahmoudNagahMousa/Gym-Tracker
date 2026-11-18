import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App.jsx'
import { STORAGE_KEYS } from './storage/keys.js'

function getNav() {
  return screen.getByRole('navigation', { name: 'التنقل الرئيسي' })
}

function navLink(name) {
  return within(getNav()).getByRole('link', { name })
}

describe('App navigation', () => {
  it('navigates between the three tabs', async () => {
    window.location.hash = ''
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'بياناتي' })).toBeInTheDocument()

    await user.click(navLink(/تمرين النهارده/))
    expect(await screen.findByRole('heading', { name: 'تمرين النهارده' })).toBeInTheDocument()

    await user.click(navLink(/^.*المؤقت$/))
    expect(await screen.findByRole('heading', { name: 'المؤقت' })).toBeInTheDocument()

    await user.click(navLink(/بياناتي/))
    expect(await screen.findByRole('heading', { name: 'بياناتي' })).toBeInTheDocument()
  })

  it('opens the plan editor from the hash route', async () => {
    window.location.hash = '#/plan'
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'محرر الخطة' })).toBeInTheDocument()
  })

  it('shows the renewal banner on every page when the subscription is expired', async () => {
    window.localStorage.setItem(
      STORAGE_KEYS.profile,
      JSON.stringify({
        name: 'محمود',
        age: 28,
        weight: 80,
        height: 180,
        startDate: '2020-01-01',
        durationMonths: 1,
      }),
    )
    window.location.hash = ''
    const user = userEvent.setup()
    render(<App />)

    const banner = await screen.findByTestId('renewal-banner')
    expect(banner).toHaveAttribute('data-variant', 'danger')

    await user.click(navLink(/تمرين النهارده/))
    expect(await screen.findByRole('heading', { name: 'تمرين النهارده' })).toBeInTheDocument()
    expect(screen.getByTestId('renewal-banner')).toBeInTheDocument()

    await user.click(navLink(/^.*المؤقت$/))
    expect(await screen.findByRole('heading', { name: 'المؤقت' })).toBeInTheDocument()
    expect(screen.getByTestId('renewal-banner')).toBeInTheDocument()
  })

  it('has an accessible bottom navigation with three tabs', async () => {
    window.location.hash = ''
    render(<App />)

    const nav = await screen.findByRole('navigation', { name: 'التنقل الرئيسي' })
    expect(nav).toBeInTheDocument()
    expect(within(nav).getAllByRole('link')).toHaveLength(3)
  })
})
