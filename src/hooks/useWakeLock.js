import { useEffect, useRef, useState } from 'react'

/**
 * Screen Wake Lock — الشاشة تفضل صاحية طول ما المؤقت شغال.
 * feature detection + fallback هادي (لو المتصفح مش داعم مفيش أي مشكلة).
 */
export function useWakeLock(active) {
  const [isLocked, setIsLocked] = useState(false)
  const lockRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function requestLock() {
      try {
        if (typeof navigator === 'undefined' || !navigator.wakeLock || !navigator.wakeLock.request) return
        const lock = await navigator.wakeLock.request('screen')
        if (cancelled) {
          try {
            lock?.release?.()
          } catch {
            /* ignore */
          }
          return
        }
        lockRef.current = lock
        setIsLocked(true)
        if (lock && typeof lock.addEventListener === 'function') {
          lock.addEventListener('release', () => setIsLocked(false))
        }
      } catch {
        setIsLocked(false)
      }
    }

    if (active) requestLock()

    return () => {
      cancelled = true
      try {
        lockRef.current?.release?.()
      } catch {
        /* ignore */
      }
      lockRef.current = null
      setIsLocked(false)
    }
  }, [active])

  return isLocked
}

export default useWakeLock
