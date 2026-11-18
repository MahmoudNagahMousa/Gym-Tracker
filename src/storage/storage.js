/**
 * Wrapper آمن على localStorage:
 * - try/catch على كل عملية (متصفحات خاصة/Safari بترفض التخزين أحياناً)
 * - JSON.parse آمن (ملف تلف -> نرجع الـ fallback بدل ما التطبيق يكسر)
 * - fallback في الذاكرة لو localStorage مش متاح
 */
import { STORAGE_PREFIX } from './keys.js'

const memoryStore = new Map()

function createMemoryBackend() {
  return {
    getItem: (key) => (memoryStore.has(key) ? memoryStore.get(key) : null),
    setItem: (key, value) => {
      memoryStore.set(key, String(value))
    },
    removeItem: (key) => {
      memoryStore.delete(key)
    },
    key: (index) => Array.from(memoryStore.keys())[index] ?? null,
    clear: () => memoryStore.clear(),
    get length() {
      return memoryStore.size
    },
  }
}

const memoryBackend = createMemoryBackend()

/** بترجع localStorage لو شغال فعلاً، وإلا backend في الذاكرة */
export function getBackend() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const probe = `${STORAGE_PREFIX}__probe__`
      window.localStorage.setItem(probe, '1')
      window.localStorage.removeItem(probe)
      return window.localStorage
    }
  } catch {
    // private mode / quota / blocked
  }
  return memoryBackend
}

/** JSON.parse آمن */
export function safeParse(raw, fallback = null) {
  if (raw === null || raw === undefined) return fallback
  try {
    const parsed = JSON.parse(raw)
    return parsed === null || parsed === undefined ? fallback : parsed
  } catch {
    return fallback
  }
}

export function readRaw(key) {
  try {
    return getBackend().getItem(key)
  } catch {
    return null
  }
}

export function writeRaw(key, value) {
  try {
    getBackend().setItem(key, String(value))
    return true
  } catch {
    return false
  }
}

/** قراءة JSON — أي بيانات تالفة بترجع fallback */
export function readJSON(key, fallback = null) {
  const raw = readRaw(key)
  if (raw === null) return fallback
  const parsed = safeParse(raw, fallback)
  return parsed === null || parsed === undefined ? fallback : parsed
}

/** كتابة JSON — بترجع true/false عشان نعرف لو التخزين فشل */
export function writeJSON(key, value) {
  try {
    return writeRaw(key, JSON.stringify(value))
  } catch {
    return false
  }
}

export function removeKey(key) {
  try {
    getBackend().removeItem(key)
    return true
  } catch {
    return false
  }
}

/** بيمسح مفاتيح التطبيق بس (مش أي بيانات تانية على الدومين) */
export function clearAppStorage() {
  const backend = getBackend()
  try {
    const keys = []
    for (let i = 0; i < backend.length; i += 1) {
      const key = backend.key(i)
      if (key && key.startsWith(STORAGE_PREFIX)) keys.push(key)
    }
    keys.forEach((key) => backend.removeItem(key))
    return true
  } catch {
    return false
  }
}

/** helpers صغيرة مفيدة في الاختبارات */
export function readArray(key) {
  const value = readJSON(key, [])
  return Array.isArray(value) ? value : []
}

export function readObject(key, fallback = {}) {
  const value = readJSON(key, fallback)
  return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback
}
