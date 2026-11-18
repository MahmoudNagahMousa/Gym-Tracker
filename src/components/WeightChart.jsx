import { toISODate } from '../utils/date.js'
import styles from './WeightChart.module.css'

const WIDTH = 320
const HEIGHT = 132
const PAD_X = 18
const PAD_TOP = 16
const PAD_BOTTOM = 22

/**
 * رسم خطي خفيف بـ SVG (بدون مكتبات) لآخر تسجيلات الوزن.
 * @param {{entries: Array<{date:string, weight:number}>, limit?: number}} props
 */
export default function WeightChart({ entries = [], limit = 10 }) {
  const data = (Array.isArray(entries) ? entries : [])
    .filter((entry) => entry && Number.isFinite(Number(entry.weight)))
    .slice(-limit)

  if (data.length < 2) {
    return (
      <p className={styles.wrap} style={{ color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.8 }}>
        سجّل وزنك مرتين على الأقل عشان يظهر الرسم البياني 📈
      </p>
    )
  }

  const values = data.map((entry) => Number(entry.weight))
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const span = maxValue - minValue || 1
  const innerW = WIDTH - PAD_X * 2
  const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM

  const points = data.map((entry, index) => {
    const x = PAD_X + (index * innerW) / (data.length - 1)
    const y = PAD_TOP + innerH - ((Number(entry.weight) - minValue) / span) * innerH
    return { x, y, weight: Number(entry.weight), date: entry.date }
  })

  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${HEIGHT - PAD_BOTTOM} L${points[0].x.toFixed(1)},${HEIGHT - PAD_BOTTOM} Z`

  const first = data[0]
  const last = data[data.length - 1]
  const diff = Number(last.weight) - Number(first.weight)

  return (
    <div className={styles.wrap}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`رسم بياني لتغير الوزن، من ${first.weight} كجم إلى ${last.weight} كجم`}
        preserveAspectRatio="none"
      >
        <title>تغير الوزن</title>
        <line className={styles.gridLine} x1={PAD_X} y1={PAD_TOP} x2={WIDTH - PAD_X} y2={PAD_TOP} />
        <line
          className={styles.gridLine}
          x1={PAD_X}
          y1={HEIGHT - PAD_BOTTOM}
          x2={WIDTH - PAD_X}
          y2={HEIGHT - PAD_BOTTOM}
        />
        <path className={styles.area} d={areaPath} />
        <path className={styles.line} d={linePath} />
        {points.map((point) => (
          <circle key={`${point.date}-${point.x}`} className={styles.dot} cx={point.x} cy={point.y} r={3.2} />
        ))}
        <text className={styles.axis} x={PAD_X} y={HEIGHT - 6}>
          {maxValue} كجم
        </text>
        <text className={styles.axis} x={WIDTH - PAD_X} y={HEIGHT - 6} textAnchor="end">
          {minValue} كجم
        </text>
      </svg>
      <div className={styles.legend}>
        <span>من {toISODate(new Date(first.date))}</span>
        <span style={{ color: diff === 0 ? 'var(--text-dim)' : diff < 0 ? 'var(--primary)' : '#fca5a5' }}>
          {diff === 0 ? 'بدون تغيير' : `${diff > 0 ? '+' : ''}${diff.toFixed(1)} كجم`}
        </span>
        <span>إلى {toISODate(new Date(last.date))}</span>
      </div>
    </div>
  )
}
