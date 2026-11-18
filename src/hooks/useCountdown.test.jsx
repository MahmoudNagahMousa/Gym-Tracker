import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCountdown } from './useCountdown.js'

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('starts with the given duration', () => {
    const { result } = renderHook(() => useCountdown({ onFinish: vi.fn() }))

    act(() => {
      result.current.setDuration(3000)
    })

    expect(result.current.totalMs).toBe(3000)
    expect(result.current.remainingMs).toBe(3000)
    expect(result.current.isRunning).toBe(false)
    expect(result.current.progress).toBe(1)
  })

  it('counts down from timestamps (not from a decrementing counter)', () => {
    const { result } = renderHook(() => useCountdown({ onFinish: vi.fn() }))

    act(() => result.current.start(3000))
    expect(result.current.isRunning).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.remainingMs).toBe(2000)

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current.remainingMs).toBe(1500)
  })

  it('pauses, keeps the value, and resumes', () => {
    const onFinish = vi.fn()
    const { result } = renderHook(() => useCountdown({ onFinish }))

    act(() => result.current.start(2000))
    act(() => {
      vi.advanceTimersByTime(500)
    })
    act(() => result.current.pause())

    const paused = result.current.remainingMs
    expect(result.current.isRunning).toBe(false)
    expect(paused).toBe(1500)

    // الوقت بيعدي وهو واقف — القيمة ماتتغيرش
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current.remainingMs).toBe(paused)
    expect(onFinish).not.toHaveBeenCalled()

    act(() => result.current.resume())
    expect(result.current.isRunning).toBe(true)

    act(() => {
      vi.advanceTimersByTime(paused)
    })
    expect(result.current.remainingMs).toBe(0)
    expect(result.current.isFinished).toBe(true)
    expect(onFinish).toHaveBeenCalledTimes(1)
  })

  it('fires onFinish exactly once and stops', () => {
    const onFinish = vi.fn()
    const { result } = renderHook(() => useCountdown({ onFinish }))

    act(() => result.current.start(1000))
    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(result.current.isFinished).toBe(true)
    expect(result.current.isRunning).toBe(false)
    expect(result.current.remainingMs).toBe(0)
    expect(onFinish).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(onFinish).toHaveBeenCalledTimes(1)
  })

  it('resets back to the total duration', () => {
    const { result } = renderHook(() => useCountdown({ onFinish: vi.fn() }))

    act(() => result.current.start(4000))
    act(() => {
      vi.advanceTimersByTime(1500)
    })
    act(() => result.current.reset())

    expect(result.current.remainingMs).toBe(4000)
    expect(result.current.isRunning).toBe(false)
    expect(result.current.isFinished).toBe(false)
  })

  it('ignores start when there is no duration', () => {
    const { result } = renderHook(() => useCountdown({ onFinish: vi.fn() }))

    act(() => result.current.start())
    expect(result.current.isRunning).toBe(false)
  })

  it('toggle switches between pause and resume', () => {
    const { result } = renderHook(() => useCountdown({ onFinish: vi.fn() }))

    act(() => result.current.start(2000))
    act(() => result.current.toggle())
    expect(result.current.isRunning).toBe(false)

    act(() => result.current.toggle())
    expect(result.current.isRunning).toBe(true)
  })
})
