import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/**
 * عدّاد تنازلي مبني على الـ timestamps مش على عدّاد setInterval.
 *
 * ليه؟ لأن المتصفحات على الموبايل بتبطّئ/توقف الـ timers في التابات في الخلفية.
 * إحنا بنحسب دايماً  endAt - Date.now()  فالوقت بيفضل صح حتى لو الـ interval اتأخر.
 *
 * @param {{ onFinish?: () => void, tickMs?: number }} options
 */
export function useCountdown({ onFinish, tickMs = 100 } = {}) {
  const [totalMs, setTotalMs] = useState(0)
  const [remainingMs, setRemainingMs] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const endAtRef = useRef(0)
  const finishedRef = useRef(false)
  const onFinishRef = useRef(onFinish)

  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  const complete = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    endAtRef.current = 0
    setRemainingMs(0)
    setIsRunning(false)
    setIsFinished(true)
    try {
      onFinishRef.current?.()
    } catch {
      // ما نخليش خطأ في الكولباك يكسر العدّاد
    }
  }, [])

  // tick loop — بيقرأ الوقت الحقيقي كل مرة
  useEffect(() => {
    if (!isRunning) return undefined
    const id = setInterval(() => {
      const rest = endAtRef.current - Date.now()
      if (rest <= 0) complete()
      else setRemainingMs(rest)
    }, tickMs)
    return () => clearInterval(id)
  }, [isRunning, tickMs, complete])

  // لو رجعت للتاب بعد ما المتصفح وقّف الـ interval، حدّث فوراً
  useEffect(() => {
    if (!isRunning) return undefined
    const sync = () => {
      const rest = endAtRef.current - Date.now()
      if (rest <= 0) complete()
      else setRemainingMs(rest)
    }
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [isRunning, complete])

  /** تحديد مدة جديدة (بيوقف العدّاد) */
  const setDuration = useCallback((ms) => {
    const value = Math.max(0, Number(ms) || 0)
    finishedRef.current = false
    endAtRef.current = 0
    setTotalMs(value)
    setRemainingMs(value)
    setIsRunning(false)
    setIsFinished(false)
  }, [])

  /** يبدأ من الأول بمدة معينة، أو بالمدة الحالية لو مفيش بارامتر */
  const start = useCallback(
    (ms) => {
      const value = Math.max(0, Number(ms) || 0)
      const duration = value > 0 ? value : totalMs > 0 ? totalMs : remainingMs
      if (duration <= 0) return
      finishedRef.current = false
      endAtRef.current = Date.now() + duration
      setTotalMs(duration)
      setRemainingMs(duration)
      setIsFinished(false)
      setIsRunning(true)
    },
    [totalMs, remainingMs],
  )

  const pause = useCallback(() => {
    if (!isRunning) return
    const rest = Math.max(0, endAtRef.current - Date.now())
    setRemainingMs(rest)
    setIsRunning(false)
  }, [isRunning])

  const resume = useCallback(() => {
    if (isRunning || finishedRef.current) return
    const rest = remainingMs > 0 ? remainingMs : totalMs
    if (rest <= 0) return
    endAtRef.current = Date.now() + rest
    setIsRunning(true)
  }, [isRunning, remainingMs, totalMs])

  const reset = useCallback(() => {
    finishedRef.current = false
    endAtRef.current = 0
    setRemainingMs(totalMs)
    setIsRunning(false)
    setIsFinished(false)
  }, [totalMs])

  const toggle = useCallback(() => {
    if (isRunning) pause()
    else resume()
  }, [isRunning, pause, resume])

  const progress = totalMs > 0 ? Math.min(1, Math.max(0, remainingMs / totalMs)) : 0

  return useMemo(
    () => ({
      totalMs,
      remainingMs,
      progress,
      isRunning,
      isFinished,
      setDuration,
      start,
      pause,
      resume,
      reset,
      toggle,
    }),
    [totalMs, remainingMs, progress, isRunning, isFinished, setDuration, start, pause, resume, reset, toggle],
  )
}

export default useCountdown
