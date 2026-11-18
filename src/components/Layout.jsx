import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav.jsx'
import RenewalBanner from './RenewalBanner.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useRenewalReminder } from '../hooks/useRenewalReminder.js'
import styles from './Layout.module.css'

export default function Layout() {
  const { subscription } = useApp()
  useRenewalReminder(subscription)

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main-content">
        تخطَّ إلى المحتوى
      </a>
      <RenewalBanner />
      <main id="main-content" className={styles.main} tabIndex={-1}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
