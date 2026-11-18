import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ExerciseCard from '../components/ExerciseCard.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { useApp } from '../context/AppContext.jsx'
import { formatDateAr, toISODate, WEEK_DAYS, weekdayIndex } from '../utils/date.js'
import {
  buildLastPerformanceMap,
  computeSessionVolume,
  createEmptySets,
  makeLogKey,
} from '../utils/workout.js'
import ui from '../styles/ui.module.css'
import styles from './WorkoutPage.module.css'

export default function WorkoutPage() {
  const { plan, sessions, activeLogs, actions } = useApp()
  const todayIndex = weekdayIndex()
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex)
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  const dateKey = toISODate(new Date())
  const day = plan.days[selectedDayIndex] ?? plan.days[0]
  const logKey = makeLogKey(dateKey, selectedDayIndex)
  const log = activeLogs[logKey]

  // نجهّز log فاضي لليوم المختار أول ما نفتح الصفحة
  useEffect(() => {
    if (day?.exercises?.length) actions.initLog(logKey, day.exercises)
  }, [actions, logKey, day])

  const lastPerformance = useMemo(() => buildLastPerformanceMap(sessions), [sessions])
  const recentSessions = useMemo(() => (Array.isArray(sessions) ? sessions.slice(0, 5) : []), [sessions])

  const getSets = (exercise) => log?.entries?.[exercise.id]?.sets ?? createEmptySets(exercise.sets)

  const handleSetChange = (exerciseId, setIndex, patch) => {
    actions.updateSet(logKey, exerciseId, setIndex, patch)
    if (feedback.message) setFeedback({ type: '', message: '' })
  }

  const handleFinish = () => {
    const session = actions.finishWorkout(logKey, {
      date: dateKey,
      dayIndex: selectedDayIndex,
      dayLabel: day.label,
      dayName: day.name,
    })
    if (!session) {
      setFeedback({ type: 'error', message: 'سجّل مجموعة واحدة على الأقل (وزن أو عدّ أو علم «تم») قبل ما تخلّص.' })
      return
    }
    setFeedback({ type: 'success', message: 'تم حفظ التمرين في السجل ✅' })
    actions.initLog(logKey, day.exercises)
  }

  return (
    <div className={ui.page}>
      <PageHeader
        title="تمرين النهارده"
        subtitle={`${WEEK_DAYS[todayIndex].label} — ${plan.days[todayIndex]?.name ?? 'راحة'}. الأوزان اللي سجلتها آخر مرة ظاهرة كتلميح على كل تمرين.`}
      >
        <div className={styles.topActions}>
          <Link className={ui.btn} to="/plan">
            ⚙️ تعديل الخطة
          </Link>
          <Link className={ui.btn} to="/timer">
            ⏱️ المؤقت
          </Link>
        </div>
      </PageHeader>

      {/* اختيار اليوم */}
      <section aria-label="اختيار يوم التمرين">
        <div className={styles.dayStrip} role="group" aria-label="أيام الأسبوع">
          {WEEK_DAYS.map((weekDay) => {
            const isActive = weekDay.index === selectedDayIndex
            const isToday = weekDay.index === todayIndex
            return (
              <button
                key={weekDay.id}
                type="button"
                className={[
                  styles.dayChip,
                  isActive ? styles.dayChipActive : '',
                  isToday && !isActive ? styles.dayChipToday : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  setSelectedDayIndex(weekDay.index)
                  setFeedback({ type: '', message: '' })
                }}
                aria-pressed={isActive}
              >
                <span>{weekDay.short}</span>
                <span className={styles.dayChipName}>{plan.days[weekDay.index]?.name ?? 'راحة'}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* تمرين اليوم */}
      <section className={ui.card} aria-labelledby="today-workout-title">
        <div className={ui.cardHead}>
          <h2 className={ui.cardTitle} id="today-workout-title">
            {day.label} — {day.name}
          </h2>
          <span className={[ui.badge, selectedDayIndex === todayIndex ? ui.badgeOk : ui.badgeMuted].join(' ')}>
            {selectedDayIndex === todayIndex ? 'النهارده' : 'يوم تاني'}
          </span>
        </div>

        {day.exercises.length === 0 ? (
          <p className={ui.empty}>يوم راحة 😴 — ارتاح كويس، العضلات بتكبر في الراحة.</p>
        ) : (
          <ul className={styles.exerciseList} aria-label={`تمارين ${day.label}`}>
            {day.exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                sets={getSets(exercise)}
                lastPerformance={lastPerformance[exercise.name]}
                onSetChange={(setIndex, patch) => handleSetChange(exercise.id, setIndex, patch)}
              />
            ))}
          </ul>
        )}

        <div className={styles.finishBar}>
          <button
            type="button"
            className={[ui.btn, ui.btnPrimary, ui.btnBlock].join(' ')}
            onClick={handleFinish}
            disabled={day.exercises.length === 0}
          >
            خلّصت التمرين — احفظه
          </button>
          {feedback.message ? (
            <p
              className={feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}
              role="status"
              data-testid="workout-feedback"
            >
              {feedback.message}
            </p>
          ) : null}
        </div>
      </section>

      {/* سجل التمارين */}
      <section className={ui.card} aria-labelledby="history-title">
        <div className={ui.cardHead}>
          <h2 className={ui.cardTitle} id="history-title">
            آخر التمارين
          </h2>
          <span className={[ui.badge, ui.badgeMuted].join(' ')}>{sessions.length} جلسة</span>
        </div>

        {recentSessions.length === 0 ? (
          <p className={ui.empty}>لسه مفيش تمارين محفوظة — أول ما تخلّص تمرين هيظهر هنا.</p>
        ) : (
          <ul className={ui.list} aria-label="سجل التمارين">
            {recentSessions.map((session) => (
              <li key={session.id} className={styles.historyItem}>
                <div className={styles.historyHead}>
                  <span>{session.dayLabel ? `${session.dayLabel} — ${session.dayName}` : session.dayName}</span>
                  <span className="numeric">{Math.round(computeSessionVolume(session))} كجم</span>
                </div>
                <div className={styles.historyMeta}>
                  {formatDateAr(session.date)} • {session.exercises.length} تمرين •{' '}
                  {session.exercises.reduce((total, exercise) => total + (exercise.sets?.length ?? 0), 0)} مجموعة
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
