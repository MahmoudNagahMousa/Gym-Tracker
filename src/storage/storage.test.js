import { describe, expect, it } from 'vitest'
import { STORAGE_KEYS, STORAGE_PREFIX } from './keys.js'
import {
  clearAppStorage,
  getBackend,
  readArray,
  readJSON,
  readRaw,
  removeKey,
  safeParse,
  writeJSON,
  writeRaw,
} from './storage.js'

describe('storage wrapper', () => {
  it('round-trips JSON values', () => {
    expect(writeJSON(STORAGE_KEYS.profile, { name: 'محمود', weight: 80 })).toBe(true)
    expect(readJSON(STORAGE_KEYS.profile, null)).toEqual({ name: 'محمود', weight: 80 })
  })

  it('uses versioned keys', () => {
    writeJSON(STORAGE_KEYS.plan, { ok: true })
    // الـ key نفسه لازم يبدأ بالـ versioned prefix
    expect(STORAGE_KEYS.plan.startsWith('gym-tracker:v1:')).toBe(true)
    expect(STORAGE_KEYS.plan).toContain(STORAGE_PREFIX)
    expect(readRaw(STORAGE_KEYS.plan)).toContain('ok')
    expect(getBackend().getItem(STORAGE_KEYS.plan)).toContain('ok')
  })

  it('returns the fallback for missing keys', () => {
    expect(readJSON('gym-tracker:v1:missing', { default: true })).toEqual({ default: true })
    expect(readArray('gym-tracker:v1:missing')).toEqual([])
  })

  it('survives corrupted JSON (does not throw)', () => {
    writeRaw(STORAGE_KEYS.profile, '{"name": "broken",,')
    expect(() => readJSON(STORAGE_KEYS.profile, null)).not.toThrow()
    expect(readJSON(STORAGE_KEYS.profile, { fallback: true })).toEqual({ fallback: true })
  })

  it('survives corrupted JSON in the sessions array', () => {
    writeRaw(STORAGE_KEYS.sessions, '<<<not json>>>')
    expect(readArray(STORAGE_KEYS.sessions)).toEqual([])
  })

  it('safeParse handles null/undefined/garbage', () => {
    expect(safeParse(null, 'fallback')).toBe('fallback')
    expect(safeParse(undefined, 'fallback')).toBe('fallback')
    expect(safeParse('nope', 'fallback')).toBe('fallback')
    expect(safeParse('null', 'fallback')).toBe('fallback')
    expect(safeParse('{"a":1}')).toEqual({ a: 1 })
  })

  it('removes a single key', () => {
    writeJSON(STORAGE_KEYS.weightHistory, [{ weight: 80 }])
    expect(removeKey(STORAGE_KEYS.weightHistory)).toBe(true)
    expect(readJSON(STORAGE_KEYS.weightHistory, null)).toBeNull()
  })

  it('clearAppStorage only touches app keys', () => {
    writeJSON(STORAGE_KEYS.profile, { name: 'x' })
    writeJSON(STORAGE_KEYS.plan, { days: [] })
    window.localStorage.setItem('someone-else', 'keep-me')

    clearAppStorage()

    expect(readJSON(STORAGE_KEYS.profile, null)).toBeNull()
    expect(readJSON(STORAGE_KEYS.plan, null)).toBeNull()
    expect(window.localStorage.getItem('someone-else')).toBe('keep-me')
  })
})
