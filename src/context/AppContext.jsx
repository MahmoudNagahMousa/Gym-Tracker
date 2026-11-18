import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { readJSON, writeJSON } from '../storage/storage.js'
import { STORAGE_KEYS } from '../storage/keys.js'
import { createDefaultPlan, normalizePlan } from '../data/defaultPlan.js'
import { getSubscriptionStatus } from '../utils/subscription.js'
import { createEmptySets } from '../utils/workout.js'
import { toISODate } from '../utils/date.js'
import { createId } from '../utils/id.js'

const AppContext = createContext(null)

const asArray = (value) => (Array.isArray(value) ? value : [])

function loadProfile() {
  const value = readJSON(STORAGE_KEYS.profile, null)
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null
}

function loadPlan() {
  const value = readJSON(STORAGE_KEYS.plan, null)
  return value ? normalizePlan(value) : createDefaultPlan()
}

function loadActiveLogs() {
  const value = readJSON(STORAGE_KEYS.activeLogs, {})
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

/**
 * الحالة العامة للتطبيق + حفظ تلقائي في localStorage.
 * في الاختبارات نقدر نحقن initialState.
 */
export function AppProvider({ children, initialState }) {
  const [profile, setProfileState] = useState(() => initialState?.profile ?? loadProfile())
  const [plan, setPlanState] = useState(() => initialState?.plan ?? loadPlan())
  const [sessions, setSessions] = useState(() =>
    asArray(initialState?.sessions ?? readJSON(STORAGE_KEYS.sessions, [])),
  )
  const [weightHistory, setWeightHistory] = useState(() =>
    asArray(initialState?.weightHistory ?? readJSON(STORAGE_KEYS.weightHistory, [])),
  )
  const [activeLogs, setActiveLogs] = useState(() => initialState?.activeLogs ?? loadActiveLogs())

  // ---------- الحفظ في localStorage ----------
  useEffect(() => {
    if (profile) writeJSON(STORAGE_KEYS.profile, profile)
  }, [profile])

  useEffect(() => {
    writeJSON(STORAGE_KEYS.plan, plan)
  }, [plan])

  useEffect(() => {
    writeJSON(STORAGE_KEYS.sessions, sessions)
  }, [sessions])

  useEffect(() => {
    writeJSON(STORAGE_KEYS.weightHistory, weightHistory)
  }, [weightHistory])

  useEffect(() => {
    writeJSON(STORAGE_KEYS.activeLogs, activeLogs)
  }, [activeLogs])

  // ---------- الوزن ----------
  const addWeightEntry = useCallback((weight, when = new Date()) => {
    const value = Number(weight)
    if (!Number.isFinite(value) || value <= 0) return
    setWeightHistory((prev) => {
      const list = asArray(prev)
      const last = list[list.length - 1]
      const sameDay = last?.date ? toISODate(new Date(last.date)) === toISODate(when) : false
      if (last && Number(last.weight) === value && sameDay) return list
      const next = [...list, { id: createId('w'), date: when.toISOString(), weight: value }]
      return next.slice(-120)
    })
  }, [])

  // ---------- البروفايل ----------
  const saveProfile = useCallback(
    (values) => {
      const now = new Date()
      const clean = {
        name: String(values.name ?? '').trim(),
        age: Number(values.age),
        weight: Number(values.weight),
        height: Number(values.height),
        startDate: values.startDate,
        durationMonths: Number(values.durationMonths),
        updatedAt: now.toISOString(),
      }
      setProfileState((prev) => ({
        ...(prev ?? {}),
        ...clean,
        createdAt: prev?.createdAt ?? now.toISOString(),
      }))
      addWeightEntry(clean.weight, now)
      return clean
    },
    [addWeightEntry],
  )

  /** "تم التجديد" — الاشتراك يبدأ من النهارده بنفس عدد الشهور */
  const renewSubscription = useCallback(() => {
    const today = toISODate(new Date())
    setProfileState((prev) => (prev ? { ...prev, startDate: today, renewedAt: new Date().toISOString() } : prev))
  }, [])

  // ---------- الخطة ----------
  const updatePlan = useCallback((nextPlan) => {
    setPlanState(normalizePlan(nextPlan))
  }, [])

  const updateDay = useCallback((dayIndex, dayPatch) => {
    setPlanState((current) => {
      const days = current.days.map((day, index) => (index === dayIndex ? { ...day, ...dayPatch } : day))
      return { ...current, days }
    })
  }, [])

  const resetPlan = useCallback(() => {
    setPlanState(createDefaultPlan())
  }, [])

  // ---------- سجل التمرين الحالي ----------
  const initLog = useCallback((logKey, exercises = []) => {
    setActiveLogs((prev) => {
      if (prev[logKey]) return prev
      const entries = {}
      exercises.forEach((exercise) => {
        entries[exercise.id] = {
          exerciseId: exercise.id,
          name: exercise.name,
          type: exercise.type,
          sets: createEmptySets(exercise.sets),
        }
      })
      return {
        ...prev,
        [logKey]: { key: logKey, createdAt: new Date().toISOString(), entries },
      }
    })
  }, [])

  const updateSet = useCallback((logKey, exerciseId, setIndex, patch) => {
    setActiveLogs((prev) => {
      const log = prev[logKey]
      const entry = log?.entries?.[exerciseId]
      if (!log || !entry) return prev
      const sets = entry.sets.map((set, index) => (index === setIndex ? { ...set, ...patch } : set))
      return {
        ...prev,
        [logKey]: { ...log, entries: { ...log.entries, [exerciseId]: { ...entry, sets } } },
      }
    })
  }, [])

  const clearLog = useCallback((logKey) => {
    setActiveLogs((prev) => {
      if (!prev[logKey]) return prev
      const next = { ...prev }
      delete next[logKey]
      return next
    })
  }, [])

  /** يحوّل الـ log المفتوح لجلسة محفوظة. بيرجع الجلسة أو null لو مفيش بيانات. */
  const finishWorkout = useCallback(
    (logKey, meta = {}) => {
      const log = activeLogs[logKey]
      if (!log) return null

      const exercises = Object.values(log.entries ?? {})
        .map((entry) => {
          const sets = (entry.sets ?? [])
            .filter((set) => set.done || set.weight !== '' || set.reps !== '')
            .map((set) => ({
              weight: set.weight === '' || set.weight === null ? null : Number(set.weight),
              reps: set.reps === '' || set.reps === null ? null : Number(set.reps),
              done: Boolean(set.done),
            }))
          return { exerciseId: entry.exerciseId, name: entry.name, type: entry.type, sets }
        })
        .filter((entry) => entry.sets.length > 0)

      if (!exercises.length) return null

      const session = {
        id: createId('s'),
        createdAt: new Date().toISOString(),
        date: meta.date ?? toISODate(new Date()),
        dayIndex: meta.dayIndex ?? null,
        dayLabel: meta.dayLabel ?? '',
        dayName: meta.dayName ?? '',
        exercises,
      }

      setSessions((prev) => [session, ...asArray(prev)].slice(0, 200))
      setActiveLogs((prev) => {
        if (!prev[logKey]) return prev
        const next = { ...prev }
        delete next[logKey]
        return next
      })
      return session
    },
    [activeLogs],
  )

  const deleteSession = useCallback((sessionId) => {
    setSessions((prev) => asArray(prev).filter((session) => session.id !== sessionId))
  }, [])

  const subscription = useMemo(() => getSubscriptionStatus(profile), [profile])

  const actions = useMemo(
    () => ({
      saveProfile,
      renewSubscription,
      addWeightEntry,
      updatePlan,
      updateDay,
      resetPlan,
      initLog,
      updateSet,
      clearLog,
      finishWorkout,
      deleteSession,
    }),
    [
      saveProfile,
      renewSubscription,
      addWeightEntry,
      updatePlan,
      updateDay,
      resetPlan,
      initLog,
      updateSet,
      clearLog,
      finishWorkout,
      deleteSession,
    ],
  )

  const value = useMemo(
    () => ({ profile, plan, sessions, weightHistory, activeLogs, subscription, actions }),
    [profile, plan, sessions, weightHistory, activeLogs, subscription, actions],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside <AppProvider>')
  return context
}

export default AppContext
