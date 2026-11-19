import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useRenewalReminder } from '../hooks/useRenewalReminder.js'
import styles from './Layout.module.css'

/**
 * الشل العام: سكيب لينك + المحتوى + الشريط السفلي.
 *
 * بانر التجديد اتنقل للرئيسية (HomePage) عشان يظهر هناك بس، لكن التنبيه
 * المحلي (useRenewalReminder) لسه بيتحسب هنا مرة واحدة عند فتح التطبيق.
 */
export default function Layout() {
  const { subscription } = useApp()
  useRenewalReminder(subscription)

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main-content">
        تخطَّ إلى المحتوى
      </a>
      <main id="main-content" className={styles.main} tabIndex={-1}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
