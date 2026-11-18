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

describe('PlanEditorPage', () => {
  it("lists the selected day's exercises", () => {
    renderWithProviders(<PlanEditorPage />)
    expect(screen.getByText(first.name)).toBeInTheDocument()
    expect(screen.getByText(second.name)).toBeInTheDocument()
  })

  it('adds a new exercise', async () => {
    const { user } = renderWithProviders(<PlanEditorPage />)

    await user.click(screen.getByRole('button', { name: /إضافة تمرين/ }))
    await user.type(screen.getByLabelText('اسم التمرين'), 'سكوات جوبلت')
    await user.clear(screen.getByLabelText('عدد المجموعات'))
    await user.type(screen.getByLabelText('عدد المجموعات'), '4')
    await user.click(screen.getByRole('button', { name: 'إضافة التمرين' }))

    expect(screen.getByText('سكوات جوبلت')).toBeInTheDocument()
    const plan = storedPlan()
    const added = plan.days[0].exercises.find((exercise) => exercise.name === 'سكوات جوبلت')
    expect(added).toBeTruthy()
    expect(added.sets).toBe(4)
  })

  it('shows a validation error for an empty exercise name', async () => {
    const { user } = renderWithProviders(<PlanEditorPage />)

    await user.click(screen.getByRole('button', { name: /إضافة تمرين/ }))
    await user.click(screen.getByRole('button', { name: 'إضافة التمرين' }))

    expect(screen.getByText('اكتب اسم التمرين')).toBeInTheDocument()
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
    const plan = storedPlan()
    expect(plan.days[0].exercises.find((exercise) => exercise.name === second.name)).toBeFalsy()
  })

  it('restores the default plan', async () => {
    const { user } = renderWithProviders(<PlanEditorPage />)

    await user.click(screen.getByRole('button', { name: `حذف ${first.name}` }))
    expect(screen.queryByText(first.name)).toBeNull()

    await user.click(screen.getByRole('button', { name: /استعادة الخطة الافتراضية/ }))
    expect(screen.getByText(first.name)).toBeInTheDocument()
  })
})
