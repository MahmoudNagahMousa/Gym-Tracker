import { Link, useLocation } from 'react-router-dom'
import styles from './BottomNav.module.css'

/**
 * التابات الأربعة بالترتيب المطلوب.
 * paths: المسارات اللي بتخلّي التاب "نشط" (صفحة محرر الخطة مثلًا بتخلّي
 * «تمرين النهارده» هو النشط). مطابقة بالمسار الكامل — فالرئيسية "/" مش
 * هتبقى نشطة على أي مسار تاني.
 */
const TABS = [
  { to: '/', label: 'الرئيسية', icon: '🏠', paths: ['/'] },
  { to: '/workout', label: 'تمرين النهارده', icon: '🏋️', paths: ['/workout', '/plan'] },
  { to: '/timer', label: 'المؤقت', icon: '⏱️', paths: ['/timer'] },
  { to: '/profile', label: 'بياناتي', icon: '👤', paths: ['/profile'] },
]

/** "/profile/" -> "/profile" و "" -> "/" */
function normalizePath(pathname) {
  if (!pathname) return '/'
  const trimmed = pathname.replace(/\/+$/, '')
  return trimmed || '/'
}

export default function BottomNav() {
  const { pathname } = useLocation()
  const currentPath = normalizePath(pathname)

  return (
    <nav className={styles.nav} aria-label="التنقل الرئيسي">
      {TABS.map((tab) => {
        const isActive = tab.paths.includes(currentPath)
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={[styles.tab, isActive ? styles.active : ''].filter(Boolean).join(' ')}
            aria-current={isActive ? 'page' : undefined}
            data-active={isActive ? 'true' : 'false'}
            data-testid={`nav-tab-${tab.to === '/' ? 'home' : tab.to.slice(1)}`}
          >
            <span className={styles.icon} aria-hidden="true">
              {tab.icon}
            </span>
            <span className={styles.label}>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
