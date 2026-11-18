import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import CircularProgress from '../components/CircularProgress.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { useCountdown } from '../hooks/useCountdown.js'
import { useWakeLock } from '../hooks/useWakeLock.js'
import { formatClock, parseClock, TIMER_PRESETS } from '../utils/time.js'
import { signalTimerFinished } from '../utils/feedback.js'
import ui from '../styles/ui.module.css'
import styles from './TimerPage.module.css'

const DEFAULT_EXERCISE_MS = 60 * 1000
const DEFAULT_REST_MS = 90 * 1000

export default function TimerPage() {
  const [searchParams] = useSearchParams()
  const secondsParam = Number.parseInt(searchParams.get('seconds') ?? '', 10)
  const modeParam = searchParams.get('mode') === 'rest' ? 'rest' : 'exercise'

  const initialMs =
    Number.isFinite(secondsParam) && secondsParam > 0 ? Math.min(secondsParam, 3600) * 1000 : DEFAULT_EXERCISE_MS

  const [mode, setMode] = useState(modeParam)
  const [customValue, setCustomValue] = useState('')
  const [customError, setCustomError] = useState('')
  const [flash, setFlash] = useState(false)
  const flashTimer = useRef(null)

  const handleFinish = useCallback(() => {
    signalTimerFinished()
  }, [])

  const { totalMs, remainingMs, progress, isRunning, isFinished, setDuration, start, pause, resume, reset } =
    useCountdown({ onFinish: handleFinish })

  const isWakeLocked = useWakeLock(isRunning)

  // المدة الابتدائية (من الـ URL أو الافتراضي)
  useEffect(() => {
    setDuration(initialMs)
  }, [initialMs, setDuration])

  // فلاش + صوت عند النهاية
  useEffect(() => {
    if (!isFinished) return undefined
    setFlash(true)
    flashTimer.current = setTimeout(() => setFlash(false), 1600)
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current)
    }
  }, [isFinished])

  const applyDuration = (ms) => {
    setDuration(ms)
    setCustomError('')
  }

  const applyCustom = () => {
    const ms = parseClock(customValue)
    if (!ms) {
      setCustomError('اكتب الوقت بصيغة mm:ss أو عدد ثواني (مثال 01:30 أو 90)')
      return
    }
    applyDuration(ms)
  }

  const canResume = !isRunning && !isFinished && remainingMs > 0 && remainingMs < totalMs
  const primaryLabel = isRunning ? '⏸️ إيقاف مؤقت' : canResume ? '▶️ استكمال' : '▶️ ابدأ'
  const state = isRunning ? 'running' : isFinished ? 'finished' : remainingMs < totalMs ? 'paused' : 'idle'

  return (
    <div className={ui.page}>
      <div className={[styles.flash, flash ? styles.flashOn : ''].join(' ')} aria-hidden="true" />

      <PageHeader
        title="المؤقت"
        subtitle="عدّاد دقيق محسوب من الوقت الحقيقي (مش عدّاد setInterval)، فبيفضل صح حتى لو الشاشة قفلت أو التاب اتأخر."
      />

      <div className={styles.modeTabs} role="group" aria-label="نوع المؤقت">
        <button
          type="button"
          className={[styles.modeTab, mode === 'exercise' ? styles.modeTabActive : ''].join(' ')}
          aria-pressed={mode === 'exercise'}
          onClick={() => {
            setMode('exercise')
            if (!isRunning) applyDuration(DEFAULT_EXERCISE_MS)
          }}
        >
          ⏱️ مؤقت التمرين
        </button>
        <button
          type="button"
          className={[styles.modeTab, mode === 'rest' ? styles.modeTabActive : ''].join(' ')}
          aria-pressed={mode === 'rest'}
          onClick={() => {
            setMode('rest')
            if (!isRunning) applyDuration(DEFAULT_REST_MS)
          }}
        >
          😮‍💨 مؤقت الراحة
        </button>
      </div>

      <section className={ui.card} aria-labelledby="timer-card-title">
        <div className={ui.cardHead}>
          <h2 className={ui.cardTitle} id="timer-card-title">
            {mode === 'rest' ? 'راحة بين المجموعات' : 'تمرين بالوقت'}
          </h2>
          <span
            className={[
              ui.badge,
              isRunning ? ui.badgeOk : isFinished ? ui.badgeWarn : ui.badgeMuted,
            ].join(' ')}
          >
            {isRunning ? 'شغال' : isFinished ? 'خلص' : 'متوقف'}
          </span>
        </div>

        <div className={styles.stage}>
          <CircularProgress
            progress={progress}
            label={formatClock(remainingMs)}
            sublabel={isFinished ? 'خلص الوقت ✅' : isRunning ? 'جاري العد...' : 'جاهز'}
            state={state}
          />

          <div className={styles.statusLine} aria-live="polite">
            {isWakeLocked ? <span>🔆 الشاشة مفتوحة</span> : null}
            {!isWakeLocked && isRunning ? <span>الشاشة مش مضمونة تفضل صاحية على المتصفح ده</span> : null}
            {!isRunning && !isFinished ? <span>المدة الكلية: {formatClock(totalMs)}</span> : null}
          </div>
        </div>

        <div className={styles.presets} role="group" aria-label="أوقات سريعة">
          {TIMER_PRESETS.map((seconds) => (
            <button
              key={seconds}
              type="button"
              className={[styles.preset, totalMs === seconds * 1000 ? styles.presetActive : ''].join(' ')}
              onClick={() => applyDuration(seconds * 1000)}
              aria-pressed={totalMs === seconds * 1000}
            >
              {seconds} ث
            </button>
          ))}
        </div>

        <div className={styles.controlRow}>
          <button
            type="button"
            className={[ui.btn, ui.btnPrimary].join(' ')}
            onClick={() => {
              if (isRunning) pause()
              else if (canResume) resume()
              else start()
            }}
          >
            {primaryLabel}
          </button>
          <button type="button" className={ui.btn} onClick={reset} disabled={isRunning || remainingMs === totalMs}>
            🔄 إعادة
          </button>
        </div>

        <div className={styles.customRow}>
          <div className={[ui.field, styles.customField].join(' ')}>
            <label className={ui.label} htmlFor="custom-duration">
              مدة مخصصة (mm:ss)
            </label>
            <input
              id="custom-duration"
              className={[ui.input, customError ? ui.inputError : ''].join(' ')}
              value={customValue}
              onChange={(event) => {
                setCustomValue(event.target.value)
                setCustomError('')
              }}
              placeholder="01:30"
              inputMode="numeric"
              autoComplete="off"
              aria-invalid={Boolean(customError)}
            />
            <span className={ui.error} role={customError ? 'alert' : undefined}>
              {customError}
            </span>
          </div>
          <button type="button" className={ui.btn} onClick={applyCustom} style={{ alignSelf: 'flex-start', marginTop: 22 }}>
            تطبيق
          </button>
        </div>
      </section>

      <section className={ui.card}>
        <h2 className={ui.cardTitle}>إزاي المؤقت بيشتغل؟</h2>
        <p className={ui.footnote}>
          المؤقت بيحسب الوقت المتبقي من <code>Date.now()</code> في كل مرة، مش عن طريق نقصان عدّاد — عشان
          المتصفحات على الموبايل بتبطّئ الـ timers في الخلفية. لما الوقت يخلص: التليفون يهتز (لو المتصفح
          بيدعم)، صفارة بـ Web Audio، وفلاش أخضر على الشاشة.
        </p>
        <Link className={ui.btn} to="/workout">
          🏋️ رجوع لتمرين النهارده
        </Link>
      </section>
    </div>
  )
}
