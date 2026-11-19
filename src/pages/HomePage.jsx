import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import ConsistencyTracker from '../components/ConsistencyTracker.jsx'
import PageHeader from '../components/PageHeader.jsx'
import RenewalBanner from '../components/RenewalBanner.jsx'
import WeightChart from '../components/WeightChart.jsx'
import { useApp } from '../context/AppContext.jsx'
import { getBMI } from '../utils/bmi.js'
import {
  calculateStreak,
  countSessionsThisMonth,
  countTrainedDays,
  getTrainedDates,
} from '../utils/consistency.js'
import { formatDateAr, toISODate, weekdayIndex } from '../utils/date.js'
import { getRenewalMessage } from '../utils/subscription.js'
import { getDayLabel, getDayName } from '../utils/workout.js'
import ui from '../styles/ui.module.css'
import styles from './HomePage.module.css'

/** تقريب لرقم عشري واحد (لمعادلة الفرق بين وزنين) */
function round1(value) {
  return Math.round(Number(value) * 10) / 10
}

/**
 * الرئيسية — أول صفحة بتفتح. فيها بانر التجديد + ملخص اليوم + الاشتراك و BMI
 * وآخر وزن + الإحصائيات + سجل الالتزام + تطور الوزن.
 *
 * @param {{ today?: Date|string }} props
 *   today بيتحقن في الاختبارات عشان النتيجة تكون ثابتة.
 */
export default function HomePage({ today }) {
  // حالة الاشتراك جاية من الـ Context (getSubscriptionStatus) — نفس الحساب القديم
  const { profile, plan, sessions, weightHistory, subscription, actions } = useApp()

  const todayDate = useMemo(() => {
    const base = today ? new Date(today) : new Date()
    return Number.isNaN(base.getTime()) ? new Date() : base
    // today ثابت أثناء عمر الصفحة — مش محتاجين نعيد الحساب كل render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today])

  const todayIndex = weekdayIndex(todayDate)
  const todayKey = toISODate(todayDate)

  // خطة غير صالحة/فاضية ما تكسرش الصفحة
  const todayDay = plan && Array.isArray(plan.days) ? (plan.days[todayIndex] ?? null) : null
  const exercisesCount = Array.isArray(todayDay?.exercises) ? todayDay.exercises.length : 0
  const isRest = Boolean(todayDay) && (Boolean(todayDay?.isRest) || exercisesCount === 0)
  const dayName = todayDay ? getDayName(todayDay) : ''

  const trainedDates = useMemo(() => getTrainedDates(sessions), [sessions])
  const trainedToday = trainedDates.has(todayKey)

  const streak = useMemo(
    () => calculateStreak(todayDate, sessions, plan),
    [todayDate, sessions, plan],
  )
  const trainedLast30 = useMemo(
    () => countTrainedDays(todayDate, 30, sessions),
    [todayDate, sessions],
  )
  const sessionsThisMonth = useMemo(
    () => countSessionsThisMonth(todayDate, sessions),
    [todayDate, sessions],
  )

  // ---------- الوزن ----------
  const weightEntries = useMemo(
    () =>
      (Array.isArray(weightHistory) ? weightHistory : []).filter(
        (entry) => entry && Number.isFinite(Number(entry.weight)),
      ),
    [weightHistory],
  )
  const latestWeight = weightEntries.length ? weightEntries[weightEntries.length - 1] : null
  const previousWeight = weightEntries.length >= 2 ? weightEntries[weightEntries.length - 2] : null
  const weightDiff =
    latestWeight && previousWeight
      ? round1(Number(latestWeight.weight) - Number(previousWeight.weight))
      : null
  const hasWeightChart = weightEntries.length >= 2

  // ---------- BMI من بيانات البروفايل المحفوظة ----------
  const savedBmi = useMemo(
    () => getBMI(profile?.weight, profile?.height),
    [profile?.weight, profile?.height],
  )

  const bmiToneClass =
    savedBmi?.category.tone === 'ok'
      ? ui.badgeOk
      : savedBmi?.category.tone === 'danger'
        ? ui.badgeDanger
        : savedBmi
          ? ui.badgeWarn
          : ui.badgeMuted

  const subscriptionBadge = subscription.isExpired
    ? { className: ui.badgeDanger, label: 'انتهى الاشتراك' }
    : subscription.isDueSoon
      ? { className: ui.badgeWarn, label: 'قرب يخلص' }
      : subscription.hasSubscription
        ? { className: ui.badgeOk, label: 'نشط' }
        : { className: ui.badgeMuted, label: 'بدون اشتراك' }

  const name = typeof profile?.name === 'string' ? profile.name.trim() : ''
  const greeting = name ? `أهلاً يا ${name} 👋` : 'أهلاً بيك 👋'

  const stateBadge = trainedToday
    ? { className: ui.badgeOk, label: 'خلصت ✅' }
    : isRest
      ? { className: ui.badgeMuted, label: 'راحة' }
      : todayDay
        ? { className: ui.badgeWarn, label: 'مستنيك' }
        : { className: ui.badgeMuted, label: 'بدون خطة' }

  return (
    <div className={ui.page}>
      {/* بانر التجديد — على الرئيسية بس */}
      <RenewalBanner />

      <PageHeader
        title={greeting}
        subtitle="ملخص يومك: تمرين النهارده، اشتراكك، التزامك، ووزنك في مكان واحد."
      />

      {/* ---------- تمرين النهارده ---------- */}
      <section className={ui.card} aria-labelledby="home-today-title" data-testid="home-today-card">
        <div className={ui.cardHead}>
          <h2 className={ui.cardTitle} id="home-today-title">
            تمرين النهارده
          </h2>
          <span className={[ui.badge, stateBadge.className].join(' ')}>{stateBadge.label}</span>
        </div>

        {todayDay ? (
          <>
            <p className={styles.todayName}>
              {getDayLabel(todayIndex)} — {dayName}
            </p>
            {todayDay.focus ? <p className={styles.todayFocus}>🎯 {todayDay.focus}</p> : null}
            <p className={ui.muted}>{exercisesCount} تمرين</p>
          </>
        ) : (
          <p className={ui.empty}>
            مفيش خطة متاحة دلوقتي — افتح «تعديل الخطة» من صفحة التمرين عشان نجهّز لك يومك.
          </p>
        )}

        {trainedToday ? (
          <p className={styles.stateOk} data-testid="home-state-trained">
            خلصت تمرين النهارده ✅
          </p>
        ) : isRest ? (
          <p className={styles.stateRest} data-testid="home-state-rest">
            يوم راحة 😴
          </p>
        ) : todayDay ? (
          <Link className={[ui.btn, ui.btnPrimary, ui.btnBlock].join(' ')} to="/workout" data-testid="home-start">
            ابدأ التمرين
          </Link>
        ) : null}
      </section>

      {/* ---------- الاشتراك ---------- */}
      <section className={ui.card} aria-labelledby="home-subscription-title" data-testid="home-subscription-card">
        <div className={ui.cardHead}>
          <h2 className={ui.cardTitle} id="home-subscription-title">
            الاشتراك
          </h2>
          <span
            className={[ui.badge, subscriptionBadge.className].join(' ')}
            data-testid="home-subscription-badge"
          >
            {subscriptionBadge.label}
          </span>
        </div>

        {subscription.hasSubscription ? (
          <>
            <div className={ui.statGrid}>
              <div className={ui.stat}>
                <span className={ui.statValue}>{formatDateAr(subscription.startDate)}</span>
                <span className={ui.statLabel}>بداية الاشتراك</span>
              </div>
              <div className={ui.stat}>
                <span className={ui.statValue}>{formatDateAr(subscription.endDate)}</span>
                <span className={ui.statLabel}>تاريخ الانتهاء</span>
              </div>
              <div className={ui.stat}>
                <span className={ui.statValue} data-testid="home-days-remaining">
                  {subscription.isExpired
                    ? `متأخر ${Math.abs(subscription.daysRemaining)} يوم`
                    : `باقي ${subscription.daysRemaining} يوم`}
                </span>
                <span className={ui.statLabel}>{subscription.isExpired ? 'انتهى الاشتراك' : 'باقي'}</span>
              </div>
              <div className={ui.stat}>
                <span className={ui.statValue}>{subscription.months} شهر</span>
                <span className={ui.statLabel}>المدة</span>
              </div>
            </div>

            {subscription.isExpired ? (
              <p className={styles.expiredBar} data-testid="home-subscription-state">
                انتهى الاشتراك — جدّد عشان تكمّل تمرينك.
              </p>
            ) : subscription.isDueSoon ? (
              <p className={styles.dueBar} data-testid="home-subscription-state">
                {getRenewalMessage(subscription)}
              </p>
            ) : (
              <p className={ui.footnote} data-testid="home-subscription-state">
                كل حاجة تمام — الاشتراك شغال.
              </p>
            )}

            <button
              type="button"
              className={[ui.btn, ui.btnPrimary, ui.btnBlock].join(' ')}
              onClick={actions.renewSubscription}
              data-testid="home-renew-button"
            >
              تم التجديد — ابدأ من النهارده
            </button>
          </>
        ) : (
          <div className={styles.emptyState} data-testid="home-subscription-empty">
            <p className={ui.footnote}>ضيف تاريخ اشتراكك عشان نتابع لك الأيام المتبقية والتجديد.</p>
            <Link className={[ui.btn, ui.btnBlock].join(' ')} to="/profile">
              ضيف تاريخ اشتراكك
            </Link>
          </div>
        )}
      </section>

      {/* ---------- BMI + آخر وزن (جنب بعض) ---------- */}
      <div className={styles.twoCols}>
        <section
          className={[ui.card, styles.smallCard].join(' ')}
          aria-labelledby="home-bmi-title"
          data-testid="home-bmi-card"
        >
          <div className={[ui.cardHead, styles.compactHead].join(' ')}>
            <h2 className={ui.cardTitle} id="home-bmi-title">
              BMI
            </h2>
            <span className={[ui.badge, bmiToneClass].join(' ')}>
              {savedBmi ? savedBmi.category.label : 'لسه مش متحسب'}
            </span>
          </div>

          {savedBmi ? (
            <div className={styles.bmiRow}>
              <span className={styles.bmiValue} data-testid="home-bmi-value">
                {savedBmi.value}
              </span>
              <span className={styles.bmiUnit}>kg/m²</span>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p className={ui.footnote}>سجّل وزنك وطولك عشان نحسب الـ BMI.</p>
              <Link className={ui.linkBtn} to="/profile">
                افتح بياناتي
              </Link>
            </div>
          )}
        </section>

        <section
          className={[ui.card, styles.smallCard].join(' ')}
          aria-labelledby="home-latest-weight-title"
          data-testid="home-latest-weight-card"
        >
          <div className={[ui.cardHead, styles.compactHead].join(' ')}>
            <h2 className={ui.cardTitle} id="home-latest-weight-title">
              آخر وزن
            </h2>
            <span className={[ui.badge, ui.badgeMuted].join(' ')}>{weightEntries.length} تسجيل</span>
          </div>

          {latestWeight ? (
            <>
              <div className={styles.bmiRow}>
                <span className={styles.bmiValue} data-testid="home-latest-weight-value">
                  {latestWeight.weight}
                </span>
                <span className={styles.bmiUnit}>كجم</span>
              </div>
              <p className={ui.footnote} data-testid="home-latest-weight-date">
                {formatDateAr(latestWeight.date)}
              </p>
              {weightDiff !== null ? (
                <p
                  className={[styles.diff, weightDiff <= 0 ? styles.diffDown : styles.diffUp].join(' ')}
                  data-testid="home-weight-diff"
                >
                  {weightDiff > 0 ? `+${weightDiff}` : `${weightDiff}`} كجم من آخر تسجيل
                </p>
              ) : null}
            </>
          ) : (
            <div className={styles.emptyState} data-testid="home-latest-weight-empty">
              <p className={ui.footnote}>لسه مفيش وزن مسجّل.</p>
              <Link className={ui.linkBtn} to="/profile">
                ضيف وزنك
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* ---------- إحصائيات سريعة ---------- */}
      <div className={ui.grid3}>
        <div className={ui.stat} data-testid="home-stat-streak">
          <span className={ui.statValue}>{streak} يوم</span>
          <span className={ui.statLabel}>السلسلة الحالية</span>
        </div>
        <div className={ui.stat} data-testid="home-stat-last30">
          <span className={ui.statValue}>{trainedLast30} يوم</span>
          <span className={ui.statLabel}>تمرنت آخر 30 يوم</span>
        </div>
        <div className={ui.stat} data-testid="home-stat-month">
          <span className={ui.statValue}>{sessionsThisMonth} جلسة</span>
          <span className={ui.statLabel}>الشهر ده</span>
        </div>
      </div>

      {/* ---------- سجل الالتزام (heatmap) ---------- */}
      <ConsistencyTracker today={todayDate} />

      {/* ---------- تطور الوزن ---------- */}
      <section className={ui.card} aria-labelledby="home-weight-title">
        <div className={ui.cardHead}>
          <h2 className={ui.cardTitle} id="home-weight-title">
            تطور الوزن
          </h2>
          <span className={[ui.badge, ui.badgeMuted].join(' ')}>{weightEntries.length} تسجيل</span>
        </div>

        {hasWeightChart ? (
          <>
            <WeightChart entries={weightEntries} />
            {latestWeight ? (
              <p className={ui.footnote} data-testid="home-latest-weight">
                آخر وزن: <span className="numeric">{latestWeight.weight} كجم</span> —{' '}
                {formatDateAr(latestWeight.date)}
              </p>
            ) : null}
          </>
        ) : (
          <div className={styles.weightEmpty} data-testid="home-weight-empty">
            <p className={ui.footnote}>سجّل وزنك مرتين على الأقل عشان يظهر الرسم البياني 📈</p>
            <Link className={[ui.btn, ui.btnBlock].join(' ')} to="/profile">
              سجّل وزنك
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
