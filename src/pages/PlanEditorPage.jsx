import { useState } from 'react'
import { Link } from 'react-router-dom'
import ExerciseForm from '../components/ExerciseForm.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { useApp } from '../context/AppContext.jsx'
import { createExercise } from '../data/defaultPlan.js'
import { WEEK_DAYS } from '../utils/date.js'
import { formatSecondsAr } from '../utils/time.js'
import { formatRepsRange, getDayLabel, getDayName } from '../utils/workout.js'
import ui from '../styles/ui.module.css'
import styles from './PlanEditorPage.module.css'

export default function PlanEditorPage() {
  const { plan, planWarning, actions } = useApp()
  const [dayIndex, setDayIndex] = useState(0)
  // form: null | { mode: 'add' } | { mode: 'edit', index: number }
  const [form, setForm] = useState(null)

  const day = plan.days[dayIndex] ?? plan.days[0]
  const exercises = Array.isArray(day?.exercises) ? day.exercises : []

  const commit = (nextExercises) => actions.updateDay(dayIndex, { exercises: nextExercises })

  const handleAdd = (values) => {
    commit([...exercises, createExercise(values)])
    setForm(null)
  }

  const handleEdit = (values) => {
    if (form?.mode !== 'edit') return
    const next = exercises.map((exercise, index) =>
      index === form.index ? { ...exercise, ...values, id: exercise.id } : exercise,
    )
    commit(next)
    setForm(null)
  }

  const handleDelete = (index) => {
    commit(exercises.filter((_, itemIndex) => itemIndex !== index))
    setForm(null)
  }

  const move = (index, direction) => {
    const target = index + direction
    if (target < 0 || target >= exercises.length) return
    const next = [...exercises]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    commit(next)
  }

  return (
    <div className={ui.page}>
      <PageHeader
        title="محرر الخطة"
        subtitle="عدّل تمارين كل يوم: ضيف، احذف، رتّب، وغيّر المجموعات ومدى التكرارات والراحة. الخطة الافتراضية بتتحمّل من ملف JSON."
      >
        <div className={ui.rowWrap} style={{ marginTop: 6 }}>
          <Link className={ui.btn} to="/workout">
            ← رجوع للتمرين
          </Link>
        </div>
      </PageHeader>

      {planWarning ? (
        <section className={ui.card} role="alert" data-testid="plan-warning">
          <div className={ui.cardHead}>
            <h2 className={ui.cardTitle}>تنبيه بخصوص خطتك</h2>
            <button type="button" className={ui.iconBtn} onClick={actions.dismissPlanWarning} aria-label="إغلاق التنبيه">
              ✕
            </button>
          </div>
          <p className={styles.warningText}>{planWarning}</p>
          <div className={ui.rowWrap}>
            <button type="button" className={ui.btn} onClick={actions.resetPlan}>
              ♻️ استعادة الخطة الافتراضية
            </button>
          </div>
        </section>
      ) : null}

      <section aria-label="اختيار اليوم">
        <div className={styles.daySelect} role="group" aria-label="أيام الأسبوع">
          {WEEK_DAYS.map((weekDay) => (
            <button
              key={weekDay.id}
              type="button"
              className={[ui.chip, weekDay.index === dayIndex ? ui.chipActive : ''].join(' ')}
              onClick={() => {
                setDayIndex(weekDay.index)
                setForm(null)
              }}
              aria-pressed={weekDay.index === dayIndex}
            >
              {weekDay.short}
            </button>
          ))}
        </div>
      </section>

      <section className={ui.card} aria-labelledby="day-title">
        <div className={ui.cardHead}>
          <h2 className={ui.cardTitle} id="day-title">
            {getDayLabel(dayIndex)} — {getDayName(day)}
          </h2>
          <span className={[ui.badge, ui.badgeMuted].join(' ')}>{exercises.length} تمرين</span>
        </div>

        <div className={ui.grid2}>
          <div className={ui.field}>
            <label className={ui.label} htmlFor="day-name">
              اسم اليوم
            </label>
            <input
              id="day-name"
              className={ui.input}
              value={day?.name ?? ''}
              onChange={(event) => actions.updateDay(dayIndex, { name: event.target.value })}
              placeholder="مثال: Push A أو راحة"
            />
          </div>

          <div className={ui.field}>
            <label className={ui.label} htmlFor="day-focus">
              التركيز (اختياري)
            </label>
            <input
              id="day-focus"
              className={ui.input}
              value={day?.focus ?? ''}
              onChange={(event) => actions.updateDay(dayIndex, { focus: event.target.value })}
              placeholder="مثال: صدر علوي + كتف"
            />
          </div>
        </div>

        {exercises.length === 0 ? (
          <p className={ui.empty}>مفيش تمارين في اليوم ده (يوم راحة) — ضيف أول تمرين من تحت 👇</p>
        ) : (
          <ul className={ui.list} aria-label={`تمارين ${getDayLabel(dayIndex)}`}>
            {exercises.map((exercise, index) => (
              <li key={exercise.id} className={styles.exerciseRow}>
                <div className={styles.exerciseInfo}>
                  <span className={styles.exerciseName}>{exercise.name}</span>
                  <span className={styles.exerciseMeta}>
                    {exercise.group ? `${exercise.group} • ` : ''}
                    {formatRepsRange(exercise)} • راحة {formatSecondsAr(exercise.restSec)}
                    {exercise.perSide ? ' • لكل جنب' : ''}
                    {exercise.note ? ` • ${exercise.note}` : ''}
                  </span>
                </div>
                <div className={styles.rowActions}>
                  <button
                    type="button"
                    className={styles.miniBtn}
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`تحريك ${exercise.name} لأعلى`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={styles.miniBtn}
                    onClick={() => move(index, 1)}
                    disabled={index === exercises.length - 1}
                    aria-label={`تحريك ${exercise.name} لأسفل`}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className={styles.miniBtn}
                    onClick={() => setForm({ mode: 'edit', index })}
                    aria-label={`تعديل ${exercise.name}`}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className={[styles.miniBtn, styles.miniBtnDanger].join(' ')}
                    onClick={() => handleDelete(index)}
                    aria-label={`حذف ${exercise.name}`}
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {form ? (
          <div className={styles.formShell}>
            <h3 className={ui.cardTitle} style={{ marginBottom: 10 }}>
              {form.mode === 'edit' ? 'تعديل التمرين' : 'تمرين جديد'}
            </h3>
            <ExerciseForm
              initial={form.mode === 'edit' ? exercises[form.index] : null}
              onSubmit={form.mode === 'edit' ? handleEdit : handleAdd}
              onCancel={() => setForm(null)}
            />
          </div>
        ) : (
          <button type="button" className={[ui.btn, ui.btnPrimary].join(' ')} onClick={() => setForm({ mode: 'add' })}>
            ＋ إضافة تمرين
          </button>
        )}
      </section>

      <section className={ui.card}>
        <h2 className={ui.cardTitle}>إعدادات الخطة</h2>
        <p className={ui.footnote}>
          الخطة محفوظة على جهازك فقط، والافتراضي بيتحمّل من ملف <code>src/data/defaultPlan.json</code>. لو خرّبتها
          أو عايز تبدأ من جديد، اضغط «استعادة الخطة الافتراضية».
        </p>
        <button type="button" className={ui.btn} onClick={actions.resetPlan}>
          ♻️ استعادة الخطة الافتراضية
        </button>
      </section>
    </div>
  )
}
