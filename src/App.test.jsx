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
  it('opens on the Home page first', async () => {
    window.location.hash = ''
    render(<App />)

    expect(await screen.findByRole('heading', { name: /أهلاً/ })).toBeInTheDocument()
    expect(screen.getByTestId('home-today-card')).toBeInTheDocument()
  })

  it('navigates between the four tabs', async () => {
    window.location.hash = ''
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByRole('heading', { name: /أهلاً/ })).toBeInTheDocument()

    await user.click(navLink(/تمرين النهارده/))
    expect(await screen.findByRole('heading', { name: 'تمرين النهارده' })).toBeInTheDocument()

    await user.click(navLink(/^.*المؤقت$/))
    expect(await screen.findByRole('heading', { name: 'المؤقت' })).toBeInTheDocument()

    await user.click(navLink(/بياناتي/))
    expect(await screen.findByRole('heading', { name: 'بياناتي' })).toBeInTheDocument()

    await user.click(navLink(/الرئيسية/))
    expect(await screen.findByRole('heading', { name: /أهلاً/ })).toBeInTheDocument()
  })

  it('marks the Home tab inactive on /profile and the profile tab inactive on /', async () => {
    window.location.hash = ''
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByRole('heading', { name: /أهلاً/ })).toBeInTheDocument()
    expect(navLink(/الرئيسية/)).toHaveAttribute('aria-current', 'page')
    expect(navLink(/بياناتي/)).not.toHaveAttribute('aria-current')

    await user.click(navLink(/بياناتي/))
    expect(await screen.findByRole('heading', { name: 'بياناتي' })).toBeInTheDocument()

    expect(navLink(/بياناتي/)).toHaveAttribute('aria-current', 'page')
    expect(navLink(/الرئيسية/)).not.toHaveAttribute('aria-current')
  })

  it('redirects unknown routes to Home', async () => {
    window.location.hash = '#/not-a-page'
    render(<App />)

    expect(await screen.findByRole('heading', { name: /أهلاً/ })).toBeInTheDocument()
    expect(screen.getByTestId('home-today-card')).toBeInTheDocument()
  })

  it('opens the plan editor from the hash route', async () => {
    window.location.hash = '#/plan'
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'محرر الخطة' })).toBeInTheDocument()
    // محرر الخطة بيفضل مضوّي على تاب «تمرين النهارده»
    expect(navLink(/تمرين النهارده/)).toHaveAttribute('aria-current', 'page')
  })

  it('shows the renewal banner on Home only, never on the other pages', async () => {
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

    await user.click(navLink(/بياناتي/))
    expect(await screen.findByRole('heading', { name: 'بياناتي' })).toBeInTheDocument()
    expect(screen.queryByTestId('renewal-banner')).not.toBeInTheDocument()

    await user.click(navLink(/تمرين النهارده/))
    expect(await screen.findByRole('heading', { name: 'تمرين النهارده' })).toBeInTheDocument()
    expect(screen.queryByTestId('renewal-banner')).not.toBeInTheDocument()

    await user.click(navLink(/^.*المؤقت$/))
    expect(await screen.findByRole('heading', { name: 'المؤقت' })).toBeInTheDocument()
    expect(screen.queryByTestId('renewal-banner')).not.toBeInTheDocument()

    // محرر الخطة كمان من غير بانر
    await user.click(navLink(/تمرين النهارده/))
    await user.click(screen.getByRole('link', { name: /تعديل الخطة/ }))
    expect(await screen.findByRole('heading', { name: 'محرر الخطة' })).toBeInTheDocument()
    expect(screen.queryByTestId('renewal-banner')).not.toBeInTheDocument()

    // والرئيسية بس اللي فيها البانر
    await user.click(navLink(/الرئيسية/))
    expect(await screen.findByRole('heading', { name: /أهلاً/ })).toBeInTheDocument()
    expect(screen.getByTestId('renewal-banner')).toBeInTheDocument()
  })

  it('has an accessible bottom navigation with four tabs', async () => {
    window.location.hash = ''
    render(<App />)

    const nav = await screen.findByRole('navigation', { name: 'التنقل الرئيسي' })
    expect(nav).toBeInTheDocument()
    expect(within(nav).getAllByRole('link')).toHaveLength(4)
  })
})
