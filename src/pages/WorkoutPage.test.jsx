import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import WorkoutPage from './WorkoutPage.jsx'
import { renderWithProviders } from '../test/utils.jsx'
import { DEFAULT_PLAN } from '../data/defaultPlan.js'
import { STORAGE_KEYS } from '../storage/keys.js'
import { toISODate, weekdayIndex } from '../utils/date.js'
import { getDayLabel } from '../utils/workout.js'

const SATURDAY = 0
const sundayPlan = DEFAULT_PLAN.days[1]
const saturdayPlan = DEFAULT_PLAN.days[SATURDAY]
const thursdayPlan = DEFAULT_PLAN.days[5]
const firstExercise = saturdayPlan.exercises[0]

async function selectDay(user, short) {
  await user.click(screen.getByRole('button', { name: new RegExp(`^${short}`) }))
}

describe('WorkoutPage', () => {
  it("renders today's plan day automatically", () => {
    renderWithProviders(<WorkoutPage />)
    const todayIndex = weekdayIndex()
    const todayPlan = DEFAULT_PLAN.days[todayIndex]
    expect(
      screen.getByRole('heading', { name: `${getDayLabel(todayIndex)} — ${todayPlan.name}` }),
    ).toBeInTheDocument()
  })

  it('renders Saturday = Push A with rep ranges', async () => {
    const { user } = renderWithProviders(<WorkoutPage />)
    await selectDay(user, 'سبت')

    expect(screen.getByText('Incline Dumbbell Press')).toBeInTheDocument()
    expect(screen.getByText('Standing Barbell Overhead Press')).toBeInTheDocument()
    // 4 × 8–10
    expect(screen.getByText(/4 \u00d7 8\u201310/)).toBeInTheDocument()
    // 3 × 8–10 (Bench Press)
    expect(screen.getByText(/3 \u00d7 8\u201310/)).toBeInTheDocument()
    // الملاحظة بتظهر تحت اسم التمرين
    expect(screen.getByText('ميّل جسمك لقدام')).toBeInTheDocument()
  })

  it('renders Sunday = Pull A with a single-value range (3 × 15)', async () => {
    const { user } = renderWithProviders(<WorkoutPage />)
    await selectDay(user, 'أحد')

    expect(screen.getByText('Wide Pull-ups')).toBeInTheDocument()
    expect(screen.getByText(/3 \u00d7 15/)).toBeInTheDocument()
    expect(screen.getByText('بوزن لو قدرت')).toBeInTheDocument()
    expect(screen.getByText(sundayPlan.exercises.at(-1).name)).toBeInTheDocument()
  })

  it('renders Thursday with both group headings, the plank timer and the perSide badge', async () => {
    const { user } = renderWithProviders(<WorkoutPage />)
    await selectDay(user, 'خمي')

    expect(screen.getByRole('heading', { name: 'رجل' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'بطن وكور' })).toBeInTheDocument()

    // البلانك: تمرين بالوقت 3 × 45 ث + زرار المؤقت
    const plankCard = screen.getByTestId('exercise-plank')
    expect(within(plankCard).getByText(/3 \u00d7 45 ث/)).toBeInTheDocument()
    expect(within(plankCard).getByRole('link', { name: /ابدأ التمرين/ })).toBeInTheDocument()

    // Pallof Press: شارة «لكل جنب»
    const pallofCard = screen.getByTestId('exercise-pallof-press')
    expect(within(pallofCard).getByText('لكل جنب')).toBeInTheDocument()

    // كل تمارين الخميس بتظهر
    thursdayPlan.exercises.forEach((exercise) => {
      expect(screen.getByText(exercise.name)).toBeInTheDocument()
    })
  })

  it('shows a rest message on rest days (Monday)', async () => {
    const { user } = renderWithProviders(<WorkoutPage />)
    await selectDay(user, 'إثن')
    expect(screen.getByText(/يوم راحة/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /خلّصت التمرين/ })).toBeDisabled()
  })

  it('saves a logged set into localStorage', async () => {
    const { user } = renderWithProviders(<WorkoutPage />)
    await selectDay(user, 'سبت')

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
    await selectDay(user, 'سبت')

    const weightInputs = screen.getAllByLabelText(new RegExp(`وزن ${firstExercise.name}`))
    await user.type(weightInputs[0], '60')
    await user.click(screen.getByRole('button', { name: /خلّصت التمرين/ }))

    expect(await screen.findByTestId('workout-feedback')).toHaveTextContent('تم حفظ التمرين')

    const sessions = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.sessions))
    expect(sessions).toHaveLength(1)
    expect(sessions[0].exercises[0]).toMatchObject({ exerciseId: firstExercise.id, name: firstExercise.name })
    expect(sessions[0].exercises[0].sets[0].weight).toBe(60)
    expect(sessions[0].dayName).toBe('Push A')

    const history = screen.getByLabelText('سجل التمارين')
    expect(within(history).getAllByRole('listitem')).toHaveLength(1)
  })

  it('refuses to finish an empty workout', async () => {
    const { user } = renderWithProviders(<WorkoutPage />)
    await selectDay(user, 'سبت')

    await user.click(screen.getByRole('button', { name: /خلّصت التمرين/ }))

    expect(await screen.findByTestId('workout-feedback')).toHaveTextContent('سجّل مجموعة واحدة على الأقل')
    expect(window.localStorage.getItem(STORAGE_KEYS.sessions)).toEqual('[]')
  })

  it('shows the last session weight hint matched by exercise id', async () => {
    const sessions = [
      {
        id: 'session-1',
        createdAt: new Date().toISOString(),
        date: toISODate(new Date()),
        dayIndex: SATURDAY,
        dayLabel: 'السبت',
        dayName: 'Push A',
        exercises: [
          {
            exerciseId: 'incline-dumbbell-press',
            // الاسم مختلف عن الاسم الحالي — الهينت لازم يشتغل بالـ id
            name: 'اسم قديم للتمرين',
            type: 'reps',
            sets: [{ weight: 32.5, reps: 8, done: true }],
          },
        ],
      },
    ]

    const { user } = renderWithProviders(<WorkoutPage />, { initialState: { sessions } })
    await selectDay(user, 'سبت')

    expect(screen.getByText(/آخر مرة: 32\.5 كجم/)).toBeInTheDocument()
  })

  it('renders history sessions that reference deleted exercises without crashing', () => {
    const sessions = [
      {
        id: 'session-old',
        createdAt: new Date().toISOString(),
        date: '2026-01-01',
        dayIndex: 0,
        dayLabel: 'السبت',
        dayName: 'خطة قديمة',
        exercises: [{ exerciseId: 'deleted-exercise', name: 'تمرين اتشال', type: 'reps', sets: [{ weight: 40, reps: 10, done: true }] }],
      },
    ]

    renderWithProviders(<WorkoutPage />, { initialState: { sessions } })

    const history = screen.getByLabelText('سجل التمارين')
    expect(within(history).getAllByRole('listitem')).toHaveLength(1)
    expect(within(history).getByText(/خطة قديمة/)).toBeInTheDocument()
  })
})
