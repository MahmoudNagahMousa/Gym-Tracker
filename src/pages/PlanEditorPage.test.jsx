import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PlanEditorPage from './PlanEditorPage.jsx'
import { renderWithProviders } from '../test/utils.jsx'
import { DEFAULT_PLAN } from '../data/defaultPlan.js'
import { STORAGE_KEYS } from '../storage/keys.js'

const day0 = DEFAULT_PLAN.days[0]
const first = day0.exercises[0]
const second = day0.exercises[1]

function storedPlan() {
  return JSON.parse(window.localStorage.getItem(STORAGE_KEYS.plan))
}

async function openAddForm(user) {
  await user.click(screen.getByRole('button', { name: /إضافة تمرين/ }))
}

describe('PlanEditorPage', () => {
  it("lists the selected day's exercises with ranges", () => {
    renderWithProviders(<PlanEditorPage />)
    expect(screen.getByText(first.name)).toBeInTheDocument()
    expect(screen.getByText(second.name)).toBeInTheDocument()
    expect(screen.getByText(/4 \u00d7 8\u201310/)).toBeInTheDocument()
  })

  it('shows the day focus in the header area', () => {
    renderWithProviders(<PlanEditorPage />)
    expect(screen.getByLabelText('التركيز (اختياري)')).toHaveValue('صدر علوي + كتف')
  })

  it('adds a new exercise with a rep range, group, note and perSide', async () => {
    const { user } = renderWithProviders(<PlanEditorPage />)

    await openAddForm(user)
    await user.type(screen.getByLabelText('اسم التمرين'), 'Cable Curl')
    await user.clear(screen.getByLabelText('أقل تكرارات'))
    await user.type(screen.getByLabelText('أقل تكرارات'), '10')
    await user.clear(screen.getByLabelText('أكبر تكرارات'))
    await user.type(screen.getByLabelText('أكبر تكرارات'), '12')
    await user.type(screen.getByLabelText('المجموعة (اختياري)'), 'بايسبس')
    await user.type(screen.getByLabelText('ملاحظة (اختياري)'), 'كوع ثابت')
    await user.click(screen.getByLabelText(/لكل جنب/))
    await user.click(screen.getByRole('button', { name: 'إضافة التمرين' }))

    expect(screen.getByText('Cable Curl')).toBeInTheDocument()

    const plan = storedPlan()
    const added = plan.days[0].exercises.find((exercise) => exercise.name === 'Cable Curl')
    expect(added).toMatchObject({
      type: 'reps',
      sets: 3,
      repsMin: 10,
      repsMax: 12,
      group: 'بايسبس',
      note: 'كوع ثابت',
      perSide: true,
    })
    expect(added.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  })

  it('shows an Arabic error when repsMin > repsMax', async () => {
    const { user } = renderWithProviders(<PlanEditorPage />)

    await openAddForm(user)
    await user.type(screen.getByLabelText('اسم التمرين'), 'تمرين غلط')
    await user.clear(screen.getByLabelText('أقل تكرارات'))
    await user.type(screen.getByLabelText('أقل تكرارات'), '15')
    await user.clear(screen.getByLabelText('أكبر تكرارات'))
    await user.type(screen.getByLabelText('أكبر تكرارات'), '8')
    await user.click(screen.getByRole('button', { name: 'إضافة التمرين' }))

    expect(screen.getByText('أكبر تكرارات لازم تكون أكبر من أو تساوي أقل تكرارات')).toBeInTheDocument()
    expect(screen.queryByText('تمرين غلط')).toBeNull()
  })

  it('validates required fields (empty name, bad sets)', async () => {
    const { user } = renderWithProviders(<PlanEditorPage />)

    await openAddForm(user)
    await user.clear(screen.getByLabelText('عدد المجموعات'))
    await user.type(screen.getByLabelText('عدد المجموعات'), '0')
    await user.click(screen.getByRole('button', { name: 'إضافة التمرين' }))

    expect(screen.getByText('اكتب اسم التمرين')).toBeInTheDocument()
    expect(screen.getByText('عدد المجموعات من 1 إلى 20')).toBeInTheDocument()
  })

  it('edits an existing exercise', async () => {
    const { user } = renderWithProviders(<PlanEditorPage />)

    await user.click(screen.getByRole('button', { name: `تعديل ${first.name}` }))
    await user.clear(screen.getByLabelText('اسم التمرين'))
    await user.type(screen.getByLabelText('اسم التمرين'), 'Incline DB Press')
    await user.click(screen.getByRole('button', { name: 'حفظ التعديل' }))

    expect(screen.getByText('Incline DB Press')).toBeInTheDocument()
    const plan = storedPlan()
    expect(plan.days[0].exercises[0]).toMatchObject({ id: first.id, name: 'Incline DB Press' })
  })

  it('reorders exercises', async () => {
    const { user } = renderWithProviders(<PlanEditorPage />)

    await user.click(screen.getByRole('button', { name: `تحريك ${first.name} لأسفل` }))

    const plan = storedPlan()
    expect(plan.days[0].exercises[0].name).toBe(second.name)
    expect(plan.days[0].exercises[1].name).toBe(first.name)
  })

  it('deletes an exercise', async () => {
    const { user } = renderWithProviders(<PlanEditorPage />)

    await user.click(screen.getByRole('button', { name: `حذف ${second.name}` }))

    expect(screen.queryByText(second.name)).toBeNull()
    expect(storedPlan().days[0].exercises.find((exercise) => exercise.name === second.name)).toBeFalsy()
  })

  it('restore defaults reloads the plan from the bundled JSON', async () => {
    const { user } = renderWithProviders(<PlanEditorPage />)

    await user.click(screen.getByRole('button', { name: `حذف ${first.name}` }))
    expect(screen.queryByText(first.name)).toBeNull()

    await user.click(screen.getByRole('button', { name: /استعادة الخطة الافتراضية/ }))

    expect(screen.getByText(first.name)).toBeInTheDocument()
    expect(storedPlan().days[0].exercises[0].name).toBe(DEFAULT_PLAN.days[0].exercises[0].name)
  })
})
