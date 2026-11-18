import { useApp } from '../context/AppContext.jsx'
import { getRenewalMessage } from '../utils/subscription.js'
import styles from './RenewalBanner.module.css'

/**
 * بانر التجديد — بيظهر في كل الصفحات (لأنه جوه الـ Layout)
 * أصفر = قرب يخلص (<= 5 أيام)، أحمر = خلص.
 */
export default function RenewalBanner() {
  const { subscription, actions } = useApp()

  if (!subscription?.hasSubscription) return null
  if (!subscription.isDueSoon && !subscription.isExpired) return null

  const isDanger = subscription.isExpired

  return (
    <div
      className={[styles.banner, isDanger ? styles.danger : styles.warning].join(' ')}
      data-testid="renewal-banner"
      data-variant={isDanger ? 'danger' : 'warning'}
      role="alert"
      aria-live="polite"
    >
      <span className={styles.text}>
        <span className={styles.emoji} aria-hidden="true">
          {isDanger ? '⛔' : '⚠️'}
        </span>
        <span>{getRenewalMessage(subscription)}</span>
      </span>
      <button type="button" className={styles.action} onClick={actions.renewSubscription}>
        تم التجديد
      </button>
    </div>
  )
}
