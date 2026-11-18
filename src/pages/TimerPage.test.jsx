import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TimerPage from './TimerPage.jsx'
import { AppProvider } from '../context/AppContext.jsx'

function renderTimer(route = '/timer') {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={[route]}>
        <TimerPage />
      </MemoryRouter>
    </AppProvider>,
  )
}

describe('TimerPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('starts with the default exercise duration and applies presets', () => {
    renderTimer()
    expect(screen.getByTestId('timer-display')).toHaveTextContent('01:00')

    fireEvent.click(screen.getByRole('button', { name: '45 ث' }))
    expect(screen.getByTestId('timer-display')).toHaveTextContent('00:45')
  })

  it('uses the duration passed in the URL (from the workout page)', () => {
    renderTimer('/timer?mode=rest&seconds=90')
    expect(screen.getByTestId('timer-display')).toHaveTextContent('01:30')
  })

  it('counts down, pauses and finishes', () => {
    renderTimer('/timer?seconds=30')
    expect(screen.getByTestId('timer-display')).toHaveTextContent('00:30')

    fireEvent.click(screen.getByRole('button', { name: /ابدأ/ }))

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByTestId('timer-display')).toHaveTextContent('00:29')

    fireEvent.click(screen.getByRole('button', { name: /إيقاف مؤقت/ }))
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByTestId('timer-display')).toHaveTextContent('00:29')

    fireEvent.click(screen.getByRole('button', { name: /استكمال/ }))
    act(() => {
      vi.advanceTimersByTime(29000)
    })

    expect(screen.getByTestId('timer-display')).toHaveTextContent('00:00')
    expect(screen.getByText('خلص الوقت ✅')).toBeInTheDocument()
    expect(window.navigator.vibrate).toHaveBeenCalled()
  })

  it('validates the custom duration input in Arabic', () => {
    renderTimer()

    fireEvent.change(screen.getByLabelText('مدة مخصصة (mm:ss)'), { target: { value: '99:99' } })
    fireEvent.click(screen.getByRole('button', { name: 'تطبيق' }))
    expect(screen.getByText(/اكتب الوقت بصيغة mm:ss/)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('مدة مخصصة (mm:ss)'), { target: { value: '01:30' } })
    fireEvent.click(screen.getByRole('button', { name: 'تطبيق' }))
    expect(screen.getByTestId('timer-display')).toHaveTextContent('01:30')
  })

  it('switches to the rest timer mode', () => {
    renderTimer()
    fireEvent.click(screen.getByRole('button', { name: /مؤقت الراحة/ }))
    expect(screen.getByRole('heading', { name: 'راحة بين المجموعات' })).toBeInTheDocument()
    expect(screen.getByTestId('timer-display')).toHaveTextContent('01:30')
  })
})
