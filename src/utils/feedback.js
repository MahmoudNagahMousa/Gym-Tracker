/**
 * اهتزاز + صوت الجرس — كل حاجة best-effort وبتفشل بهدوء
 * (مفيش داعي التطبيق يكسر لو المتصفح مش داعم).
 */

export function vibrate(pattern = [200, 100, 200]) {
  try {
    if (typeof navigator === 'undefined') return false
    if (typeof navigator.vibrate !== 'function') return false
    return navigator.vibrate(pattern)
  } catch {
    return false
  }
}

let audioContext = null

function getAudioContext() {
  try {
    if (typeof window === 'undefined') return null
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return null
    if (!audioContext) audioContext = new AudioContextClass()
    return audioContext
  } catch {
    return null
  }
}

/**
 * صفارة بسيطة بـ Web Audio API (بدون ملفات صوت).
 */
export function playBeep({ times = 2, frequency = 880, duration = 0.18, gap = 0.24 } = {}) {
  const context = getAudioContext()
  if (!context) return false
  try {
    if (typeof context.resume === 'function' && context.state === 'suspended') {
      context.resume()
    }
    const start = context.currentTime
    for (let i = 0; i < times; i += 1) {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const at = start + i * gap
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, at)
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.exponentialRampToValueAtTime(0.35, at + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(at)
      oscillator.stop(at + duration + 0.02)
    }
    return true
  } catch {
    return false
  }
}

/** alert كامل للنهاية: اهتزاز + صوت */
export function signalTimerFinished() {
  vibrate([300, 150, 300])
  playBeep({ times: 2 })
}
