import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import WorkoutPage from './WorkoutPage.jsx'
import { renderWithProviders } from '../test/utils.jsx'
import { DEFAULT_PLAN } from '../data/defaultPlan.js'
import { STORAGE_KEYS } from '../storage/keys.js'
import { toISODate, weekdayIndex } from '../utils/date.js'

const SATURDAY = 0
const saturdayPlan = DEFAULT_PLAN.days[SATURDAY]
const firstExercise = saturdayPlan.exercises[0]

async function selectSaturday(user) {
  await user.click(screen.getByRole('button', { name: /^سبت/ }))
}

describe('WorkoutPage', () => {
  it("renders today's plan day automatically", () => {
    renderWithProviders(<WorkoutPage />)
    const todayPlan = DEFAULT_PLAN.days[weekdayIndex()]
    expect(screen.getByRole('heading', { name: `${todayPlan.label} — ${todayPlan.name}` })).toBeInTheDocument()
  })

  it("renders the selected day's exercises", async () => {
    const { user } = renderWithProviders(<WorkoutPage />)

    await selectSaturday(user)

    saturdayPlan.exercises.forEach((exercise) => {
      expect(screen.getByText(exercise.name)).toBeInTheDocument()
    })

    // التمرين بالوقت بيظهر كوقت مش تكرارات
    expect(screen.getByText('بلانك')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /ابدأ التمرين/ }).length).toBeGreaterThan(0)
  })

  it('saves a logged set into localStorage', async () => {
    const { user } = renderWithProviders(<WorkoutPage />)
    await selectSaturday(user)

    const weightInputs = screen.getAllByLabelText(new RegExp(`وزن ${firstExercise.name}`))
    const repsInputs = screen.getAllByLabelText(new RegExp(`تكرارات ${firstExercise.name}`))
    expect(weightInputs).toHaveLength(firstExercise.sets)

    await user.type(weightInputs[0], '60')
    await user.type(repsInputs[0], '8')
    await user.click(screen.getAllByRole('checkbox')[0])

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.activeLogs))
    const logKey = `${toISODate(new Date())}#${SATURDAY}`
    expect(stored[logKey].entries[firstExercise.id].sets[0]).toMatchObject({
      weight: '60',
      reps: '8',
      done: true,
    })
  })

  it('finishes the workout and stores it in the history', async () => {
    const { user } = renderWithProviders(<WorkoutPage />)
    await selectSaturday(user)

    const weightInputs = screen.getAllByLabelText(new RegExp(`وزن ${firstExercise.name}`))
    await user.type(weightInputs[0], '60')
    await user.click(screen.getByRole('button', { name: /خلّصت التمرين/ }))

    expect(await screen.findByTestId('workout-feedback')).toHaveTextContent('تم حفظ التمرين')

    const sessions = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.sessions))
    expect(sessions).toHaveLength(1)
    expect(sessions[0].exercises[0].name).toBe(firstExercise.name)
    expect(sessions[0].exercises[0].sets[0].weight).toBe(60)

    const history = screen.getByLabelText('سجل التمارين')
    expect(within(history).getAllByRole('listitem')).toHaveLength(1)
  })

  it('refuses to finish an empty workout', async () => {
    const { user } = renderWithProviders(<WorkoutPage />)
    await selectSaturday(user)

    await user.click(screen.getByRole('button', { name: /خلّصت التمرين/ }))

    expect(await screen.findByTestId('workout-feedback')).toHaveTextContent('سجّل مجموعة واحدة على الأقل')
    expect(window.localStorage.getItem(STORAGE_KEYS.sessions)).toEqual('[]')
  })

  it('shows the last session weight as a hint', async () => {
    const sessions = [
      {
        id: 'session-1',
        createdAt: new Date().toISOString(),
        date: toISODate(new Date()),
        dayIndex: SATURDAY,
        dayLabel: saturdayPlan.label,
        dayName: saturdayPlan.name,
        exercises: [
          {
            exerciseId: firstExercise.id,
            name: firstExercise.name,
            type: 'reps',
            sets: [{ weight: 70, reps: 8, done: true }],
          },
        ],
      },
    ]

    const { user } = renderWithProviders(<WorkoutPage />, { initialState: { sessions } })
    await selectSaturday(user)

    expect(screen.getByText(/آخر مرة: 70 كجم/)).toBeInTheDocument()
  })

  it('shows a rest message for rest days', async () => {
    const { user } = renderWithProviders(<WorkoutPage />)

    // الثلاثاء = يوم راحة في الخطة الافتراضية
    await user.click(screen.getByRole('button', { name: /^ثلا/ }))
    expect(screen.getByText(/يوم راحة/)).toBeInTheDocument()
  })
})
