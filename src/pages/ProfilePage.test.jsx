import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ProfilePage from './ProfilePage.jsx'
import { renderWithProviders } from '../test/utils.jsx'
import { STORAGE_KEYS } from '../storage/keys.js'

async function fillValidForm(user, overrides = {}) {
  await user.type(screen.getByLabelText('الاسم'), overrides.name ?? 'محمود')
  await user.type(screen.getByLabelText('العمر (سنة)'), overrides.age ?? '28')
  await user.type(screen.getByLabelText('الوزن (كجم)'), overrides.weight ?? '80')
  await user.type(screen.getByLabelText('الطول (سم)'), overrides.height ?? '180')
}

describe('ProfilePage', () => {
  it('shows Arabic validation errors when the form is empty', async () => {
    const { user } = renderWithProviders(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: 'حفظ البيانات' }))

    expect(screen.getByText('من فضلك اكتب الاسم (حرفين على الأقل)')).toBeInTheDocument()
    expect(screen.getByText('العمر مطلوب')).toBeInTheDocument()
    expect(screen.getByText('الوزن مطلوب')).toBeInTheDocument()
    expect(screen.getByText('الطول مطلوب')).toBeInTheDocument()

    // مفيش أي حاجة اتخزنت
    expect(window.localStorage.getItem(STORAGE_KEYS.profile)).toBeNull()
  })

  it('rejects out-of-range values', async () => {
    const { user } = renderWithProviders(<ProfilePage />)

    await user.type(screen.getByLabelText('الاسم'), 'محمود')
    await user.type(screen.getByLabelText('العمر (سنة)'), '5')
    await user.type(screen.getByLabelText('الوزن (كجم)'), '500')
    await user.type(screen.getByLabelText('الطول (سم)'), '10')
    await user.click(screen.getByRole('button', { name: 'حفظ البيانات' }))

    expect(screen.getByText('العمر يجب أن يكون بين 10 و 100 سنة')).toBeInTheDocument()
    expect(screen.getByText('الوزن يجب أن يكون بين 25 و 300 كجم')).toBeInTheDocument()
    expect(screen.getByText('الطول يجب أن يكون بين 100 و 250 سم')).toBeInTheDocument()
  })

  it('saves a valid profile and appends the weight history (no BMI shown here anymore)', async () => {
    const { user } = renderWithProviders(<ProfilePage />)

    await fillValidForm(user)
    await user.clear(screen.getByLabelText('مدة الاشتراك (شهور)'))
    await user.type(screen.getByLabelText('مدة الاشتراك (شهور)'), '2')
    await user.click(screen.getByRole('button', { name: 'حفظ البيانات' }))

    expect(await screen.findByTestId('profile-status')).toHaveTextContent('تم حفظ بياناتك')

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.profile))
    expect(stored).toMatchObject({
      name: 'محمود',
      age: 28,
      weight: 80,
      height: 180,
      durationMonths: 2,
    })

    // الوزن لسه بيتسجل في الهيستوري عشان رسم الرئيسية يتحدّث
    const history = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.weightHistory))
    expect(history).toHaveLength(1)
    expect(history[0].weight).toBe(80)

    // الـ BMI اتنقل للرئيسية — مش ظاهر هنا
    expect(screen.queryByText('24.7')).not.toBeInTheDocument()
    expect(screen.queryByText('وزن طبيعي')).not.toBeInTheDocument()
  })

  it('renders a saved profile from storage', async () => {
    window.localStorage.setItem(
      STORAGE_KEYS.profile,
      JSON.stringify({
        name: 'علي',
        age: 30,
        weight: 90,
        height: 175,
        startDate: '2026-01-01',
        durationMonths: 1,
      }),
    )

    renderWithProviders(<ProfilePage />)

    expect(screen.getByLabelText('الاسم')).toHaveValue('علي')
    expect(screen.getByLabelText('الوزن (كجم)')).toHaveValue(90)
  })

  it('keeps only the forms: no subscription status, BMI, heatmap or latest-weight cards', () => {
    window.localStorage.setItem(
      STORAGE_KEYS.profile,
      JSON.stringify({
        name: 'علي',
        age: 30,
        weight: 90,
        height: 175,
        startDate: '2026-01-01',
        durationMonths: 1,
      }),
    )
    window.localStorage.setItem(
      STORAGE_KEYS.weightHistory,
      JSON.stringify([{ id: 'w1', date: '2026-11-01T10:00:00.000Z', weight: 90 }]),
    )

    renderWithProviders(<ProfilePage />)

    // مدخلات لسه موجودة
    expect(screen.getByLabelText('الاسم')).toBeInTheDocument()
    expect(screen.getByLabelText('تاريخ بداية الاشتراك')).toBeInTheDocument()
    expect(screen.getByLabelText('مدة الاشتراك (شهور)')).toBeInTheDocument()

    // وحاجات الملخص اتشالت
    expect(screen.queryByText('تاريخ الانتهاء')).not.toBeInTheDocument()
    expect(screen.queryByText('بداية الاشتراك')).not.toBeInTheDocument()
    expect(screen.queryByText('مؤشر كتلة الجسم (BMI)')).not.toBeInTheDocument()
    expect(screen.queryByText('آخر وزن مسجّل')).not.toBeInTheDocument()
    expect(screen.queryByTestId('profile-latest-weight')).not.toBeInTheDocument()
    expect(screen.queryByTestId('consistency-tracker')).not.toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /رسم بياني/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /تم التجديد/ })).not.toBeInTheDocument()
    expect(screen.queryByTestId('renewal-banner')).not.toBeInTheDocument()
  })

  it('links back to the Home page for subscription and progress', () => {
    renderWithProviders(<ProfilePage />)

    expect(
      screen.getByRole('link', { name: /شوف الاشتراك والتقدم في الرئيسية/ }),
    ).toHaveAttribute('href', '/')
  })

  it('still exposes the notification permission section', () => {
    renderWithProviders(<ProfilePage />)

    expect(screen.getByRole('heading', { name: 'تنبيهات التجديد' })).toBeInTheDocument()
  })
})
