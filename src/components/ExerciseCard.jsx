import { Link } from 'react-router-dom'
import { formatClock, formatSecondsAr } from '../utils/time.js'
import ui from '../styles/ui.module.css'
import styles from './ExerciseCard.module.css'

/**
 * كارت تمرين واحد داخل صفحة تمرين النهارده.
 */
export default function ExerciseCard({ exercise, sets = [], lastPerformance, onSetChange }) {
  const isTimed = exercise.type === 'timed'
  const setRows = Array.isArray(sets) ? sets : []

  return (
    <li className={ui.card} data-testid={`exercise-${exercise.id}`}>
      <div className={styles.head}>
        <div className={styles.headText}>
          <h3 className={styles.name}>{exercise.name}</h3>
          <p className={styles.meta}>
            {exercise.sets} مجموعات •{' '}
            {isTimed ? formatSecondsAr(exercise.durationSec) : `${exercise.reps} تكرار`} • راحة{' '}
            {formatSecondsAr(exercise.restSec)}
          </p>
        </div>
        {lastPerformance ? (
          <span className={[ui.badge, ui.badgeOk].join(' ')}>آخر مرة: {lastPerformance.weight} كجم</span>
        ) : (
          <span className={[ui.badge, ui.badgeMuted].join(' ')}>أول مرة</span>
        )}
      </div>

      <ul className={styles.sets}>
        {setRows.map((set, index) => (
          <li key={`${exercise.id}-set-${index}`} className={[styles.setRow, isTimed ? styles.setRowTimed : ''].join(' ')}>
            <span className={styles.setNo} aria-hidden="true">
              {index + 1}
            </span>

            {isTimed ? (
              <span className={styles.timedBox}>{formatClock(exercise.durationSec * 1000)}</span>
            ) : (
              <>
                <div>
                  <label className="sr-only" htmlFor={`${exercise.id}-weight-${index}`}>
                    وزن {exercise.name} — المجموعة {index + 1} (كجم)
                  </label>
                  <input
                    id={`${exercise.id}-weight-${index}`}
                    className={styles.setInput}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.5"
                    placeholder="كجم"
                    value={set.weight}
                    onChange={(event) => onSetChange?.(index, { weight: event.target.value })}
                  />
                </div>
                <div>
                  <label className="sr-only" htmlFor={`${exercise.id}-reps-${index}`}>
                    تكرارات {exercise.name} — المجموعة {index + 1}
                  </label>
                  <input
                    id={`${exercise.id}-reps-${index}`}
                    className={styles.setInput}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    placeholder="عدّ"
                    value={set.reps}
                    onChange={(event) => onSetChange?.(index, { reps: event.target.value })}
                  />
                </div>
              </>
            )}

            <label className={[styles.done, set.done ? styles.doneOn : ''].join(' ')}>
              <input
                className={styles.doneInput}
                type="checkbox"
                checked={Boolean(set.done)}
                onChange={(event) => onSetChange?.(index, { done: event.target.checked })}
              />
              <span>تم</span>
            </label>
          </li>
        ))}
      </ul>

      <div className={styles.actions}>
        {isTimed ? (
          <Link className={styles.actionBtn} to={`/timer?mode=exercise&seconds=${exercise.durationSec}`}>
            ⏱️ ابدأ التمرين ({exercise.durationSec} ث)
          </Link>
        ) : null}
        {Number(exercise.restSec) > 0 ? (
          <Link className={styles.actionBtn} to={`/timer?mode=rest&seconds=${exercise.restSec}`}>
            😮‍💨 راحة {exercise.restSec} ث
          </Link>
        ) : null}
      </div>
    </li>
  )
}
