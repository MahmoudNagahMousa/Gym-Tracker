import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { formatDateAr, getWeekDay, parseISODate, toISODate, WEEK_DAYS } from '../utils/date.js'
import {
  STATUS,
  buildHeatmapWeeks,
  calculateLongestStreak,
  calculateStreak,
  countTrainedDays,
  findSession,
  getPlanDayFor,
} from '../utils/consistency.js'
import ui from '../styles/ui.module.css'
import styles from './ConsistencyTracker.module.css'

const DEFAULT_WEEKS = 12

/** وسيلة الإيضاح تحت الشبكة — بالترتيب المطلوب */
const LEGEND = [
  { status: STATUS.MISSED, label: 'غير ملتزم', swatch: styles.missed },
  { status: STATUS.REST, label: 'راحة', swatch: styles.rest },
  { status: STATUS.TRAINED, label: 'تمرنت', swatch: styles.trained },
]

const STATUS_LABELS = {
  [STATUS.TRAINED]: 'تمرنت',
  [STATUS.REST]: 'راحة',
  [STATUS.MISSED]: 'غير ملتزم',
  [STATUS.TODAY]: 'النهارده — لسه مفيش تمرين',
  [STATUS.FUTURE]: 'لسه مجاش',
}

const STATUS_CLASS = {
  [STATUS.TRAINED]: styles.trained,
  [STATUS.REST]: styles.rest,
  [STATUS.MISSED]: styles.missed,
  [STATUS.TODAY]: styles.today,
}

const monthFormatter = (() => {
  try {
    return new Intl.DateTimeFormat('ar-EG', { month: 'long' })
  } catch {
    return null
  }
})()

/** "2026-11-14" -> "نوفمبر" (أو '' لو التاريخ تالف) */
function formatMonthAr(isoDate) {
  const date = parseISODate(isoDate)
  if (!date || !monthFormatter) return ''
  try {
    return monthFormatter.format(date)
  } catch {
    return ''
  }
}

/** aria-label فيه التاريخ + الحالة بالعربي (وزيادة اسم التمرين لو اتمرن) */
function buildCellLabel(day, workoutName) {
  const weekday = getWeekDay(day.weekdayIndex).label
  const dateText = formatDateAr(day.date)
  const statusText = STATUS_LABELS[day.status] ?? ''
  const suffix = day.status === STATUS.TRAINED && workoutName ? ` — ${workoutName}` : ''
  return `${weekday} ${dateText} — ${statusText}${suffix}`
}

/**
 * "سجل الالتزام" — شبكة أيام على طريقة GitHub:
 * كل عمود = أسبوع (السبت أول يوم)، آخر 12 أسبوع، والعمود الأخير = الأسبوع الحالي.
 *
 * @param {{ today?: Date|string, weeksCount?: number }} props
 *   today بيتحقن في الاختبارات عشان النتيجة تكون ثابتة.
 */
export default function ConsistencyTracker({ today, weeksCount = DEFAULT_WEEKS }) {
  const { sessions, plan } = useApp()
  const scrollRef = useRef(null)
  const [selectedDate, setSelectedDate] = useState(null)

  const todayDate = useMemo(() => {
    const base = today ? new Date(today) : new Date()
    return Number.isNaN(base.getTime()) ? new Date() : base
    // today ثابت أثناء عمر الصفحة — مش محتاجين نعيد الحساب كل render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today])
  const todayKey = toISODate(todayDate)

  const weeks = useMemo(
    () => buildHeatmapWeeks(todayDate, weeksCount, sessions, plan),
    [todayDate, weeksCount, sessions, plan],
  )
  const trainedLast30 = useMemo(
    () => countTrainedDays(todayDate, 30, sessions),
    [todayDate, sessions],
  )
  const streak = useMemo(
    () => calculateStreak(todayDate, sessions, plan),
    [todayDate, sessions, plan],
  )
  const longest = useMemo(() => calculateLongestStreak(weeks), [weeks])

  // الشريط جواه direction: ltr، فأحدث أسبوع على أقصى اليمين -> نسكرول لليمين
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollLeft = el.scrollWidth
  }, [todayKey, weeks.length])

  const selectedDay = useMemo(() => {
    if (!selectedDate) return null
    for (const week of weeks) {
      const day = week.days.find((entry) => entry.date === selectedDate)
      if (day) return day
    }
    return null
  }, [selectedDate, weeks])

  const selectedWorkoutName = useMemo(() => {
    if (!selectedDay || selectedDay.status !== STATUS.TRAINED) return ''
    const session = findSession(selectedDay.date, sessions)
    if (session?.dayName) return session.dayName
    return getPlanDayFor(selectedDay.date, plan)?.name ?? ''
  }, [selectedDay, sessions, plan])

  const handleCellClick = (isoDate) => {
    setSelectedDate((prev) => (prev === isoDate ? null : isoDate))
  }

  return (
    <section className={ui.card} aria-labelledby="consistency-title" data-testid="consistency-tracker">
      <div className={ui.cardHead}>
        <h2 className={ui.cardTitle} id="consistency-title">
          سجل الالتزام
        </h2>
        <span className={[ui.badge, ui.badgeMuted].join(' ')}>آخر {weeksCount} أسبوع</span>
      </div>

      <p className={styles.summary} data-testid="consistency-summary">
        {'واظبت '}
        <strong className={styles.summaryValue}>{trainedLast30}</strong>
        {' يوم من آخر 30 يوم'}
      </p>

      <div className={styles.stats}>
        <div className={styles.statBox} data-testid="consistency-streak">
          <span className={styles.statValue}>{streak} يوم</span>
          <span className={styles.statLabel}>السلسلة الحالية</span>
        </div>
        <div className={styles.statBox} data-testid="consistency-longest">
          <span className={styles.statValue}>{longest} يوم</span>
          <span className={styles.statLabel}>أطول سلسلة في الفترة</span>
        </div>
      </div>

      <div className={styles.gridWrap} dir="rtl">
        <div className={styles.weekdayLabels} aria-hidden="true" data-testid="consistency-weekdays">
          {WEEK_DAYS.map((weekDay) => (
            <span key={weekDay.id} className={styles.weekdayLabel} data-weekday={weekDay.id}>
              {weekDay.short}
            </span>
          ))}
        </div>

        <div className={styles.scroll} ref={scrollRef}>
          <div className={styles.columns}>
            {weeks.map((week, weekIndex) => {
              const monthText = formatMonthAr(week.startDate)
              const previousMonth =
                weekIndex > 0 ? formatMonthAr(weeks[weekIndex - 1].startDate) : null
              const showMonth = Boolean(monthText) && monthText !== previousMonth

              return (
                <div className={styles.column} key={week.startDate}>
                  <span className={styles.monthLabel}>{showMonth ? monthText : ''}</span>

                  {week.days.map((day) => {
                    // الأيام اللي بعد النهارده مش بتترسم — خلية فاضية بس
                    if (day.status === STATUS.FUTURE) {
                      return (
                        <span
                          key={day.date}
                          className={styles.empty}
                          data-date={day.date}
                          data-status={day.status}
                          aria-hidden="true"
                        />
                      )
                    }

                    const session =
                      day.status === STATUS.TRAINED ? findSession(day.date, sessions) : null
                    const planDay = getPlanDayFor(day.date, plan)
                    const workoutName = session?.dayName || planDay?.name || ''
                    const isSelected = selectedDate === day.date

                    return (
                      <button
                        key={day.date}
                        type="button"
                        className={[
                          styles.cell,
                          STATUS_CLASS[day.status] ?? styles.missed,
                          isSelected ? styles.selected : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        data-date={day.date}
                        data-status={day.status}
                        aria-label={buildCellLabel(day, workoutName)}
                        aria-pressed={isSelected}
                        onClick={() => handleCellClick(day.date)}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className={styles.legend}>
        {LEGEND.map((item) => (
          <span className={styles.legendItem} key={item.status} data-testid={`legend-${item.status}`}>
            <span className={[styles.legendSwatch, item.swatch].join(' ')} aria-hidden="true" />
            {item.label}
          </span>
        ))}
      </div>

      {selectedDay ? (
        <p className={styles.caption} data-testid="consistency-caption" role="status">
          <strong>
            {getWeekDay(selectedDay.weekdayIndex).label} {formatDateAr(selectedDay.date)}
          </strong>
          <span> — {STATUS_LABELS[selectedDay.status]}</span>
          {selectedWorkoutName ? <span> — {selectedWorkoutName}</span> : null}
        </p>
      ) : (
        <p className={styles.hint} data-testid="consistency-hint">
          اضغط على أي مربع تشوف تفاصيل اليوم.
        </p>
      )}

      <p className={ui.footnote}>
        كل مربع = يوم واحد. الأيام الجاية لسه مش بتتحسب، ويوم الراحة في الخطة مش بيكسر السلسلة.
      </p>
    </section>
  )
}
