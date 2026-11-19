import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import BottomNav from './BottomNav.jsx'

function renderNav(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <BottomNav />
    </MemoryRouter>,
  )
}

function getNav() {
  return screen.getByRole('navigation', { name: 'التنقل الرئيسي' })
}

function tab(name) {
  return within(getNav()).getByRole('link', { name })
}

describe('BottomNav', () => {
  it('renders the 4 tabs in the required order', () => {
    renderNav('/')
    const links = within(getNav()).getAllByRole('link')

    expect(links).toHaveLength(4)
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/',
      '/workout',
      '/timer',
      '/profile',
    ])

    expect(tab('الرئيسية')).toBeInTheDocument()
    expect(tab('تمرين النهارده')).toBeInTheDocument()
    expect(tab('المؤقت')).toBeInTheDocument()
    expect(tab('بياناتي')).toBeInTheDocument()
  })

  it('marks Home as the active tab only on "/"', () => {
    renderNav('/')
    expect(tab('الرئيسية')).toHaveAttribute('aria-current', 'page')
    expect(tab('تمرين النهارده')).not.toHaveAttribute('aria-current')
  })

  it('does not keep Home active on "/profile"', () => {
    renderNav('/profile')

    expect(tab('بياناتي')).toHaveAttribute('aria-current', 'page')
    expect(tab('الرئيسية')).not.toHaveAttribute('aria-current')
    expect(tab('تمرين النهارده')).not.toHaveAttribute('aria-current')
    expect(tab('المؤقت')).not.toHaveAttribute('aria-current')
  })

  it('activates the workout tab on /workout', () => {
    renderNav('/workout')
    expect(tab('تمرين النهارده')).toHaveAttribute('aria-current', 'page')
    expect(tab('الرئيسية')).not.toHaveAttribute('aria-current')
  })

  it('activates the workout tab on the plan editor (/plan)', () => {
    renderNav('/plan')
    expect(tab('تمرين النهارده')).toHaveAttribute('aria-current', 'page')
    expect(tab('الرئيسية')).not.toHaveAttribute('aria-current')
  })

  it('activates the timer tab on /timer', () => {
    renderNav('/timer')
    expect(tab('المؤقت')).toHaveAttribute('aria-current', 'page')
    expect(tab('بياناتي')).not.toHaveAttribute('aria-current')
  })
})
