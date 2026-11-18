import styles from './CircularProgress.module.css'

const SIZE = 260
const STROKE = 12

/**
 * عدّاد دائري كبير — progress من 0 لـ 1.
 */
export default function CircularProgress({ progress = 0, label = '00:00', sublabel, state = 'idle' }) {
  const radius = (SIZE - STROKE) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(1, Math.max(0, Number(progress) || 0))
  const offset = circumference * (1 - clamped)

  return (
    <div className={[styles.wrap, styles[state] ?? ''].join(' ')}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`الوقت المتبقي ${label}`}
      >
        <circle className={styles.track} cx={SIZE / 2} cy={SIZE / 2} r={radius} />
        <circle
          className={styles.progress}
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>
      <div className={styles.center}>
        <span className={styles.time} data-testid="timer-display">
          {label}
        </span>
        {sublabel ? <span className={styles.sub}>{sublabel}</span> : null}
      </div>
    </div>
  )
}
