import { useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import WeightChart from '../components/WeightChart.jsx'
import { useApp } from '../context/AppContext.jsx'
import { formatDateAr, toISODate } from '../utils/date.js'
import { getBMI } from '../utils/bmi.js'
import { getRenewalMessage } from '../utils/subscription.js'
import { hasErrors, validateProfile } from '../utils/validation.js'
import ui from '../styles/ui.module.css'
import styles from './ProfilePage.module.css'

function createDefaultForm() {
  return {
    name: '',
    age: '',
    weight: '',
    height: '',
    startDate: toISODate(new Date()),
    durationMonths: '1',
  }
}

function profileToForm(profile) {
  if (!profile) return createDefaultForm()
  return {
    name: profile.name ?? '',
    age: profile.age === undefined || profile.age === null ? '' : String(profile.age),
    weight: profile.weight === undefined || profile.weight === null ? '' : String(profile.weight),
    height: profile.height === undefined || profile.height === null ? '' : String(profile.height),
    startDate: profile.startDate ?? toISODate(new Date()),
    durationMonths: profile.durationMonths ? String(profile.durationMonths) : '1',
  }
}

export default function ProfilePage() {
  const { profile, subscription, weightHistory, actions } = useApp()
  const [values, setValues] = useState(() => profileToForm(profile))
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ type: '', message: '' })
  const [permission, setPermission] = useState(() => {
    try {
      return typeof window !== 'undefined' && typeof window.Notification !== 'undefined'
        ? window.Notification.permission
        : 'unsupported'
    } catch {
      return 'unsupported'
    }
  })

  const liveBmi = useMemo(() => getBMI(values.weight, values.height), [values.weight, values.height])
  const errorCount = Object.keys(errors).filter((key) => errors[key]).length

  const update = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
    setStatus({ type: '', message: '' })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validateProfile(values)
    const cleanErrors = Object.fromEntries(Object.entries(nextErrors).filter(([, value]) => Boolean(value)))
    setErrors(cleanErrors)
    if (hasErrors(cleanErrors)) {
      setStatus({ type: 'error', message: 'فيه بيانات ناقصة أو غير صحيحة، راجع الحقول بالأحمر.' })
      return
    }
    actions.saveProfile(values)
    setStatus({ type: 'success', message: 'تم حفظ بياناتك ✅' })
  }

  const requestNotifications = async () => {
    try {
      if (typeof window === 'undefined' || typeof window.Notification === 'undefined') {
        setPermission('unsupported')
        return
      }
      const result = await window.Notification.requestPermission()
      setPermission(result)
    } catch {
      setPermission('denied')
    }
  }

  const statusBadge = subscription.isExpired
    ? { className: ui.badgeDanger, label: 'منتهي' }
    : subscription.isDueSoon
      ? { className: ui.badgeWarn, label: 'قرب يخلص' }
      : subscription.hasSubscription
        ? { className: ui.badgeOk, label: 'نشط' }
        : { className: ui.badgeMuted, label: 'بدون اشتراك' }

  const bmiToneClass =
    liveBmi?.category.tone === 'ok'
      ? ui.badgeOk
      : liveBmi?.category.tone === 'danger'
        ? ui.badgeDanger
        : liveBmi
          ? ui.badgeWarn
          : ui.badgeMuted

  return (
    <div className={ui.page}>
      <PageHeader
        title="بياناتي"
        subtitle="سجّل بياناتك مرة واحدة، والتطبيق يحسب لك الاشتراك والـ BMI ويحفظ كل حاجة على جهازك."
      />

      {/* ---------- البيانات الأساسية ---------- */}
      <section className={ui.card} aria-labelledby="profile-form-title">
        <div className={ui.cardHead}>
          <h2 className={ui.cardTitle} id="profile-form-title">
            البيانات الأساسية
          </h2>
          <span className={[ui.badge, statusBadge.className].join(' ')}>{statusBadge.label}</span>
        </div>

        <form className={ui.form} onSubmit={handleSubmit} noValidate>
          {errorCount > 0 ? (
            <p className={styles.hintBar} role="alert" style={{ background: 'rgba(239,68,68,.12)', borderColor: 'rgba(239,68,68,.35)', color: '#fecaca' }}>
              فيه {errorCount} حقل محتاج تصحيح — شوف الرسائل تحت كل حقل.
            </p>
          ) : null}

          <div className={ui.field}>
            <label className={ui.label} htmlFor="profile-name">
              الاسم
            </label>
            <input
              id="profile-name"
              name="name"
              className={[ui.input, errors.name ? ui.inputError : ''].join(' ')}
              value={values.name}
              onChange={(event) => update('name', event.target.value)}
              placeholder="اسمك"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'profile-name-error' : undefined}
            />
            <span className={ui.error} id="profile-name-error" role={errors.name ? 'alert' : undefined}>
              {errors.name ?? ''}
            </span>
          </div>

          <div className={ui.grid2}>
            <div className={ui.field}>
              <label className={ui.label} htmlFor="profile-age">
                العمر (سنة)
              </label>
              <input
                id="profile-age"
                name="age"
                className={[ui.input, errors.age ? ui.inputError : ''].join(' ')}
                type="number"
                inputMode="numeric"
                min="10"
                max="100"
                value={values.age}
                onChange={(event) => update('age', event.target.value)}
                aria-invalid={Boolean(errors.age)}
              />
              <span className={ui.error} role={errors.age ? 'alert' : undefined}>
                {errors.age ?? ''}
              </span>
            </div>

            <div className={ui.field}>
              <label className={ui.label} htmlFor="profile-weight">
                الوزن (كجم)
              </label>
              <input
                id="profile-weight"
                name="weight"
                className={[ui.input, errors.weight ? ui.inputError : ''].join(' ')}
                type="number"
                inputMode="decimal"
                step="0.1"
                min="25"
                max="300"
                value={values.weight}
                onChange={(event) => update('weight', event.target.value)}
                aria-invalid={Boolean(errors.weight)}
              />
              <span className={ui.error} role={errors.weight ? 'alert' : undefined}>
                {errors.weight ?? ''}
              </span>
            </div>
          </div>

          <div className={ui.grid2}>
            <div className={ui.field}>
              <label className={ui.label} htmlFor="profile-height">
                الطول (سم)
              </label>
              <input
                id="profile-height"
                name="height"
                className={[ui.input, errors.height ? ui.inputError : ''].join(' ')}
                type="number"
                inputMode="numeric"
                min="100"
                max="250"
                value={values.height}
                onChange={(event) => update('height', event.target.value)}
                aria-invalid={Boolean(errors.height)}
              />
              <span className={ui.error} role={errors.height ? 'alert' : undefined}>
                {errors.height ?? ''}
              </span>
            </div>

            <div className={ui.field}>
              <label className={ui.label} htmlFor="profile-duration">
                مدة الاشتراك (شهور)
              </label>
              <input
                id="profile-duration"
                name="durationMonths"
                className={[ui.input, errors.durationMonths ? ui.inputError : ''].join(' ')}
                type="number"
                inputMode="numeric"
                min="1"
                max="36"
                value={values.durationMonths}
                onChange={(event) => update('durationMonths', event.target.value)}
                aria-invalid={Boolean(errors.durationMonths)}
              />
              <span className={ui.error} role={errors.durationMonths ? 'alert' : undefined}>
                {errors.durationMonths ?? ''}
              </span>
            </div>
          </div>

          <div className={ui.field}>
            <label className={ui.label} htmlFor="profile-start">
              تاريخ بداية الاشتراك
            </label>
            <input
              id="profile-start"
              name="startDate"
              className={[ui.input, errors.startDate ? ui.inputError : ''].join(' ')}
              type="date"
              value={values.startDate}
              onChange={(event) => update('startDate', event.target.value)}
              aria-invalid={Boolean(errors.startDate)}
            />
            <span className={ui.error} role={errors.startDate ? 'alert' : undefined}>
              {errors.startDate ?? ''}
            </span>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={[ui.btn, ui.btnPrimary].join(' ')}>
              حفظ البيانات
            </button>
            <button
              type="button"
              className={ui.btn}
              onClick={() => {
                setValues(profileToForm(profile))
                setErrors({})
                setStatus({ type: '', message: '' })
              }}
            >
              تراجع
            </button>
          </div>

          {status.message ? (
            <p
              className={status.type === 'success' ? ui.success : ui.error}
              role="status"
              data-testid="profile-status"
            >
              {status.message}
            </p>
          ) : null}
        </form>
      </section>

      {/* ---------- حالة الاشتراك ---------- */}
      <section className={ui.card} aria-labelledby="subscription-title">
        <div className={ui.cardHead}>
          <h2 className={ui.cardTitle} id="subscription-title">
            الاشتراك
          </h2>
          <span className={[ui.badge, statusBadge.className].join(' ')}>{statusBadge.label}</span>
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
                <span className={ui.statValue}>{subscription.months} شهر</span>
                <span className={ui.statLabel}>المدة</span>
              </div>
              <div className={ui.stat}>
                <span className={ui.statValue}>
                  {subscription.isExpired ? `متأخر ${Math.abs(subscription.daysRemaining)} يوم` : `${subscription.daysRemaining} يوم`}
                </span>
                <span className={ui.statLabel}>{subscription.isExpired ? 'منتهي' : 'باقي'}</span>
              </div>
            </div>

            {subscription.isDueSoon || subscription.isExpired ? (
              <p className={styles.hintBar}>{getRenewalMessage(subscription)}</p>
            ) : (
              <p className={ui.footnote}>كل حاجة تمام — الاشتراك شغال.</p>
            )}

            <button type="button" className={[ui.btn, ui.btnPrimary, ui.btnBlock].join(' ')} onClick={actions.renewSubscription}>
              تم التجديد — ابدأ من النهارده
            </button>
          </>
        ) : (
          <p className={ui.empty}>املا بياناتك فوق واضغط «حفظ البيانات» عشان نحسب لك ميعاد انتهاء الاشتراك.</p>
        )}
      </section>

      {/* ---------- BMI ---------- */}
      <section className={ui.card} aria-labelledby="bmi-title">
        <div className={ui.cardHead}>
          <h2 className={ui.cardTitle} id="bmi-title">
            مؤشر كتلة الجسم (BMI)
          </h2>
          <span className={[ui.badge, bmiToneClass].join(' ')}>
            {liveBmi ? liveBmi.category.label : 'لسه مش متحسب'}
          </span>
        </div>

        <div className={styles.bmiRow}>
          <div>
            <span className={styles.bmiValue}>{liveBmi ? liveBmi.value : '—'}</span>
            <span className={styles.bmiUnit}>kg/m²</span>
          </div>
          <p className={ui.footnote} style={{ maxWidth: 260 }}>
            المدى الصحي: 18.5 – 24.9. المؤشر بيستخدم الوزن والطول اللي في الفورم فوق (مش محتاج تحفظ).
          </p>
        </div>
      </section>

      {/* ---------- الوزن ---------- */}
      <section className={ui.card} aria-labelledby="weight-title">
        <div className={ui.cardHead}>
          <h2 className={ui.cardTitle} id="weight-title">
            تطور الوزن
          </h2>
          <span className={[ui.badge, ui.badgeMuted].join(' ')}>{weightHistory.length} تسجيل</span>
        </div>
        <WeightChart entries={weightHistory} />
        {weightHistory.length ? (
          <ul>
            {[...weightHistory]
              .slice(-3)
              .reverse()
              .map((entry) => (
                <li key={entry.id} className={styles.listItem}>
                  <span className="numeric">{entry.weight} كجم</span>
                  <span className={ui.muted}>{toISODate(new Date(entry.date))}</span>
                </li>
              ))}
          </ul>
        ) : null}
        <p className={ui.footnote}>كل مرة تحفظ فيها وزن جديد بيتسجل تلقائياً بتاريخ النهارده.</p>
      </section>

      {/* ---------- التنبيهات ---------- */}
      <section className={ui.card} aria-labelledby="notify-title">
        <div className={ui.cardHead}>
          <h2 className={ui.cardTitle} id="notify-title">
            تنبيهات التجديد
          </h2>
          <span className={[ui.badge, permission === 'granted' ? ui.badgeOk : ui.badgeMuted].join(' ')}>
            {permission === 'granted' ? 'مفعّلة' : permission === 'denied' ? 'مرفوضة' : 'مش مفعّلة'}
          </span>
        </div>
        <p className={ui.footnote}>
          التنبيه بيظهر مرة عند فتح التطبيق لو باقي 5 أيام أو أقل. مفيش سيرفر، فالتنبيه «أفضل جهد» بس — لو
          المتصفح قافل الإشعارات مش هيشتغل، لكن البانر الأحمر/الأصفر فوق بيفضل ظاهر.
        </p>
        <button
          type="button"
          className={ui.btn}
          onClick={requestNotifications}
          disabled={permission === 'granted' || permission === 'unsupported'}
        >
          {permission === 'granted' ? 'التنبيهات مفعّلة ✅' : 'تفعيل التنبيهات'}
        </button>
      </section>
    </div>
  )
}
