import { calculateEndDate, daysRemaining } from './date.js'

export const RENEWAL_WARNING_DAYS = 5

/**
 * حالة الاشتراك بشكل واحد موحد يستخدمه البانر وصفحة البروفايل.
 * @param {{startDate?:string, durationMonths?:number}|null} profile
 * @param {Date} today
 */
export function getSubscriptionStatus(profile, today = new Date()) {
  if (!profile || !profile.startDate) {
    return {
      hasSubscription: false,
      startDate: null,
      endDate: null,
      daysRemaining: null,
      isActive: false,
      isExpired: false,
      isDueSoon: false,
      variant: 'none',
      months: 0,
    }
  }

  const months = Number(profile.durationMonths) || 1
  const endDate = calculateEndDate(profile.startDate, months)
  const days = daysRemaining(endDate, today)

  const isExpired = days !== null && days < 0
  const isDueSoon = days !== null && days >= 0 && days <= RENEWAL_WARNING_DAYS

  return {
    hasSubscription: true,
    startDate: profile.startDate,
    endDate,
    daysRemaining: days,
    months,
    isActive: days !== null && days >= 0,
    isExpired,
    isDueSoon,
    // yellow = قرّب يخلص، red = خلص
    variant: isExpired ? 'danger' : isDueSoon ? 'warning' : 'ok',
  }
}

/** رسالة البانر بالعربي */
export function getRenewalMessage(status) {
  if (!status || !status.hasSubscription) return ''
  const days = status.daysRemaining
  if (status.isExpired) {
    const late = Math.abs(days)
    return late === 1 ? 'انتهى اشتراكك من يوم — جدّد دلوقتي!' : `انتهى اشتراكك من ${late} يوم — جدّد دلوقتي!`
  }
  if (days === 0) return 'اشتراكك ينتهي النهارده — جدّد دلوقتي!'
  if (days === 1) return 'باقي يوم واحد على انتهاء الاشتراك'
  return `باقي ${days} يوم على انتهاء الاشتراك`
}
