import { useState } from 'react'
import { hasErrors, validateExercise } from '../utils/validation.js'
import ui from '../styles/ui.module.css'
import styles from './ExerciseForm.module.css'

/**
 * فورم إضافة/تعديل تمرين في محرر الخطة.
 * بيدعم: مدى تكرارات (min/max)، تمارين بالوقت، لكل جنب، مجموعة، وملاحظة.
 */
export default function ExerciseForm({ initial, onSubmit, onCancel }) {
  const [values, setValues] = useState({
    name: initial?.name ?? '',
    type: initial?.type === 'timed' ? 'timed' : 'reps',
    sets: String(initial?.sets ?? 3),
    repsMin: String(Number(initial?.repsMin) > 0 ? initial.repsMin : 8),
    repsMax: String(Number(initial?.repsMax) > 0 ? initial.repsMax : 12),
    durationSec: String(Number(initial?.durationSec) > 0 ? initial.durationSec : 45),
    restSec: String(Number.isFinite(Number(initial?.restSec)) ? initial.restSec : 60),
    perSide: Boolean(initial?.perSide),
    group: initial?.group ?? '',
    note: initial?.note ?? '',
  })
  const [errors, setErrors] = useState({})

  const update = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const changeType = (type) => {
    setValues((prev) => {
      const next = { ...prev, type }
      // لو رجعنا لتكرارات وقيم المين/ماكس صفر (جمّالها من تمرين بالوقت) نحطّ قيم افتراضية
      if (type === 'reps') {
        if (!Number(next.repsMin)) next.repsMin = '8'
        if (!Number(next.repsMax)) next.repsMax = '12'
      }
      if (type === 'timed' && !Number(next.durationSec)) next.durationSec = '45'
      return next
    })
    setErrors({})
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validateExercise(values)
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return

    const type = values.type === 'timed' ? 'timed' : 'reps'
    onSubmit?.({
      name: values.name.trim(),
      type,
      sets: Number(values.sets),
      repsMin: type === 'reps' ? Number(values.repsMin) : 0,
      repsMax: type === 'reps' ? Number(values.repsMax) : 0,
      durationSec: type === 'timed' ? Number(values.durationSec) : 0,
      restSec: Number(values.restSec),
      perSide: Boolean(values.perSide),
      group: values.group.trim() || undefined,
      note: values.note.trim() || undefined,
    })
  }

  return (
    <form className={ui.form} onSubmit={handleSubmit} noValidate aria-label={initial ? 'تعديل تمرين' : 'إضافة تمرين'}>
      <div className={ui.field}>
        <label className={ui.label} htmlFor="exercise-name">
          اسم التمرين
        </label>
        <input
          id="exercise-name"
          className={[ui.input, errors.name ? ui.inputError : ''].join(' ')}
          value={values.name}
          onChange={(event) => update('name', event.target.value)}
          placeholder="مثال: Incline Dumbbell Press"
          autoComplete="off"
          aria-invalid={Boolean(errors.name)}
        />
        <span className={ui.error} role={errors.name ? 'alert' : undefined}>
          {errors.name ?? ''}
        </span>
      </div>

      <div className={ui.grid2}>
        <div className={ui.field}>
          <label className={ui.label} htmlFor="exercise-type">
            نوع التمرين
          </label>
          <select
            id="exercise-type"
            className={ui.select}
            value={values.type}
            onChange={(event) => changeType(event.target.value)}
          >
            <option value="reps">تكرارات (عدّ)</option>
            <option value="timed">بالوقت (زي البلانك)</option>
          </select>
        </div>

        <div className={ui.field}>
          <label className={ui.label} htmlFor="exercise-sets">
            عدد المجموعات
          </label>
          <input
            id="exercise-sets"
            className={[ui.input, errors.sets ? ui.inputError : ''].join(' ')}
            type="number"
            inputMode="numeric"
            min="1"
            max="20"
            value={values.sets}
            onChange={(event) => update('sets', event.target.value)}
            aria-invalid={Boolean(errors.sets)}
          />
          <span className={ui.error} role={errors.sets ? 'alert' : undefined}>
            {errors.sets ?? ''}
          </span>
        </div>
      </div>

      {values.type === 'timed' ? (
        <div className={ui.grid2}>
          <div className={ui.field}>
            <label className={ui.label} htmlFor="exercise-duration">
              المدة (ثانية)
            </label>
            <input
              id="exercise-duration"
              className={[ui.input, errors.durationSec ? ui.inputError : ''].join(' ')}
              type="number"
              inputMode="numeric"
              min="5"
              max="3600"
              value={values.durationSec}
              onChange={(event) => update('durationSec', event.target.value)}
              aria-invalid={Boolean(errors.durationSec)}
            />
            <span className={ui.error} role={errors.durationSec ? 'alert' : undefined}>
              {errors.durationSec ?? ''}
            </span>
          </div>

          <div className={ui.field}>
            <label className={ui.label} htmlFor="exercise-rest">
              الراحة (ثانية)
            </label>
            <input
              id="exercise-rest"
              className={[ui.input, errors.restSec ? ui.inputError : ''].join(' ')}
              type="number"
              inputMode="numeric"
              min="0"
              max="900"
              value={values.restSec}
              onChange={(event) => update('restSec', event.target.value)}
              aria-invalid={Boolean(errors.restSec)}
            />
            <span className={ui.error} role={errors.restSec ? 'alert' : undefined}>
              {errors.restSec ?? ''}
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className={ui.grid2}>
            <div className={ui.field}>
              <label className={ui.label} htmlFor="exercise-reps-min">
                أقل تكرارات
              </label>
              <input
                id="exercise-reps-min"
                className={[ui.input, errors.repsMin ? ui.inputError : ''].join(' ')}
                type="number"
                inputMode="numeric"
                min="1"
                max="100"
                value={values.repsMin}
                onChange={(event) => update('repsMin', event.target.value)}
                aria-invalid={Boolean(errors.repsMin)}
              />
              <span className={ui.error} role={errors.repsMin ? 'alert' : undefined}>
                {errors.repsMin ?? ''}
              </span>
            </div>

            <div className={ui.field}>
              <label className={ui.label} htmlFor="exercise-reps-max">
                أكبر تكرارات
              </label>
              <input
                id="exercise-reps-max"
                className={[ui.input, errors.repsMax ? ui.inputError : ''].join(' ')}
                type="number"
                inputMode="numeric"
                min="1"
                max="100"
                value={values.repsMax}
                onChange={(event) => update('repsMax', event.target.value)}
                aria-invalid={Boolean(errors.repsMax)}
              />
              <span className={ui.error} role={errors.repsMax ? 'alert' : undefined}>
                {errors.repsMax ?? ''}
              </span>
            </div>
          </div>

          <div className={ui.field}>
            <label className={ui.label} htmlFor="exercise-rest">
              الراحة بين المجموعات (ثانية)
            </label>
            <input
              id="exercise-rest"
              className={[ui.input, errors.restSec ? ui.inputError : ''].join(' ')}
              type="number"
              inputMode="numeric"
              min="0"
              max="900"
              value={values.restSec}
              onChange={(event) => update('restSec', event.target.value)}
              aria-invalid={Boolean(errors.restSec)}
            />
            <span className={ui.error} role={errors.restSec ? 'alert' : undefined}>
              {errors.restSec ?? ''}
            </span>
          </div>
        </>
      )}

      <div className={ui.grid2}>
        <div className={ui.field}>
          <label className={ui.label} htmlFor="exercise-group">
            المجموعة (اختياري)
          </label>
          <input
            id="exercise-group"
            className={[ui.input, errors.group ? ui.inputError : ''].join(' ')}
            value={values.group}
            onChange={(event) => update('group', event.target.value)}
            placeholder="مثال: رجل"
            autoComplete="off"
            aria-invalid={Boolean(errors.group)}
          />
          <span className={ui.error} role={errors.group ? 'alert' : undefined}>
            {errors.group ?? ''}
          </span>
        </div>

        <div className={ui.field}>
          <label className={ui.label} htmlFor="exercise-note">
            ملاحظة (اختياري)
          </label>
          <input
            id="exercise-note"
            className={[ui.input, errors.note ? ui.inputError : ''].join(' ')}
            value={values.note}
            onChange={(event) => update('note', event.target.value)}
            placeholder="مثال: ميّل جسمك لقدام"
            autoComplete="off"
            aria-invalid={Boolean(errors.note)}
          />
          <span className={ui.error} role={errors.note ? 'alert' : undefined}>
            {errors.note ?? ''}
          </span>
        </div>
      </div>

      <label className={styles.checkbox}>
        <input
          type="checkbox"
          className={styles.checkboxInput}
          checked={values.perSide}
          onChange={(event) => update('perSide', event.target.checked)}
        />
        <span>لكل جنب (التمرين بيتعمل لكل ناحية لوحدها)</span>
      </label>

      <div className={ui.row}>
        <button type="submit" className={[ui.btn, ui.btnPrimary].join(' ')}>
          {initial ? 'حفظ التعديل' : 'إضافة التمرين'}
        </button>
        <button type="button" className={ui.btn} onClick={onCancel}>
          إلغاء
        </button>
      </div>
    </form>
  )
}
