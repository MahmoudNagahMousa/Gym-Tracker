import { useState } from 'react'
import { hasErrors, validateExercise } from '../utils/validation.js'
import ui from '../styles/ui.module.css'

/**
 * فورم إضافة/تعديل تمرين في محرر الخطة.
 */
export default function ExerciseForm({ initial, onSubmit, onCancel }) {
  const [values, setValues] = useState({
    name: initial?.name ?? '',
    type: initial?.type === 'timed' ? 'timed' : 'reps',
    sets: String(initial?.sets ?? 3),
    reps: String(initial?.reps ?? 10),
    durationSec: String(initial?.durationSec ?? 60),
    restSec: String(initial?.restSec ?? 60),
  })
  const [errors, setErrors] = useState({})

  const update = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validateExercise(values)
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return
    onSubmit?.({
      name: values.name.trim(),
      type: values.type,
      sets: Number(values.sets),
      reps: values.type === 'timed' ? 0 : Number(values.reps),
      durationSec: values.type === 'timed' ? Number(values.durationSec) : 0,
      restSec: Number(values.restSec),
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
          placeholder="مثال: بنش برس"
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
            onChange={(event) => update('type', event.target.value)}
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
          <span className={ui.error}>{errors.sets ?? ''}</span>
        </div>
      </div>

      <div className={ui.grid2}>
        {values.type === 'timed' ? (
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
            <span className={ui.error}>{errors.durationSec ?? ''}</span>
          </div>
        ) : (
          <div className={ui.field}>
            <label className={ui.label} htmlFor="exercise-reps">
              التكرارات
            </label>
            <input
              id="exercise-reps"
              className={[ui.input, errors.reps ? ui.inputError : ''].join(' ')}
              type="number"
              inputMode="numeric"
              min="1"
              max="100"
              value={values.reps}
              onChange={(event) => update('reps', event.target.value)}
              aria-invalid={Boolean(errors.reps)}
            />
            <span className={ui.error}>{errors.reps ?? ''}</span>
          </div>
        )}

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
          <span className={ui.error}>{errors.restSec ?? ''}</span>
        </div>
      </div>

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
