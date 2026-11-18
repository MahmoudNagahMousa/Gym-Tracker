import { useEffect } from 'react'

/**
 * تنبيه محلي عند فتح التطبيق لو الاشتراك قرب يخلص أو خلص.
 * best-effort: مفيش backend، والمتصفح ممكن يمنع التنبيهات — كله داخل try/catch.
 */
export function useRenewalReminder(subscription) {
  const endDate = subscription?.endDate
  const isDueSoon = subscription?.isDueSoon
  const isExpired = subscription?.isExpired
  const days = subscription?.daysRemaining

  useEffect(() => {
    if (!endDate) return
    if (!isDueSoon && !isExpired) return

    try {
      if (typeof window === 'undefined' || typeof window.Notification === 'undefined') return
      if (window.Notification.permission !== 'granted') return

      const body = isExpired
        ? 'انتهى اشتراك الجيم — افتح التطبيق واضغط «تم التجديد».'
        : `باقي ${days} يوم على انتهاء الاشتراك.`

      // eslint-disable-next-line no-new
      new window.Notification('جيم تراكر — تجديد الاشتراك', {
        body,
        tag: 'gym-tracker-renewal',
        icon: './icons/icon-192.png',
      })
    } catch {
      // best-effort
    }
  }, [endDate, isDueSoon, isExpired, days])
}

export default useRenewalReminder
