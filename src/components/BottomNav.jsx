import { NavLink } from 'react-router-dom'
import styles from './BottomNav.module.css'

const TABS = [
  { to: '/', label: 'بياناتي', icon: '👤', end: true },
  { to: '/workout', label: 'تمرين النهارده', icon: '🏋️', end: false },
  { to: '/timer', label: 'المؤقت', icon: '⏱️', end: false },
]

export default function BottomNav() {
  return (
    <nav className={styles.nav} aria-label="التنقل الرئيسي">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => [styles.tab, isActive ? styles.active : ''].filter(Boolean).join(' ')}
        >
          <span className={styles.icon} aria-hidden="true">
            {tab.icon}
          </span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
