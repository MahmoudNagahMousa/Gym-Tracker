/** أدوات الوقت/العدّاد */

/** ms -> "mm:ss" */
export function formatClock(ms) {
  const totalSeconds = Math.max(0, Math.ceil(Number(ms) / 1000) || 0)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/** "1:30" أو "90" -> ms (أو null لو غير صالح) */
export function parseClock(input) {
  if (input === null || input === undefined) return null
  const raw = String(input).trim()
  if (!raw) return null

  let minutes = 0
  let seconds = 0

  if (raw.includes(':')) {
    const parts = raw.split(':')
    if (parts.length !== 2) return null
    minutes = Number(parts[0])
    seconds = Number(parts[1])
  } else {
    seconds = Number(raw)
  }

  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null
  if (minutes < 0 || seconds < 0) return null
  if (!Number.isInteger(minutes) || !Number.isInteger(seconds)) return null
  if (seconds >= 60) return null

  const total = (minutes * 60 + seconds) * 1000
  return total > 0 ? total : null
}

/** ثواني -> نص عربي مختصر: "45 ثانية" / "1:30 دقيقة" */
export function formatSecondsAr(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0))
  if (seconds < 60) return `${seconds} ثانية`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest === 0 ? `${minutes} دقيقة` : `${minutes}:${String(rest).padStart(2, '0')} دقيقة`
}

export const TIMER_PRESETS = [30, 45, 60, 90, 120]
