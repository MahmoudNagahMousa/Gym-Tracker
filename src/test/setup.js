import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

/** localStorage وهمي — قابل للمسح بين الاختبارات */
class MemoryStorage {
  constructor() {
    this.store = new Map()
  }

  get length() {
    return this.store.size
  }

  key(index) {
    return Array.from(this.store.keys())[index] ?? null
  }

  getItem(key) {
    return this.store.has(String(key)) ? this.store.get(String(key)) : null
  }

  setItem(key, value) {
    this.store.set(String(key), String(value))
  }

  removeItem(key) {
    this.store.delete(String(key))
  }

  clear() {
    this.store.clear()
  }
}

const memoryStorage = new MemoryStorage()

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  writable: true,
  value: memoryStorage,
})

Object.defineProperty(window, 'sessionStorage', {
  configurable: true,
  writable: true,
  value: new MemoryStorage(),
})

/** Notification mock */
class MockNotification {
  static permission = 'granted'

  static requestPermission = vi.fn(async () => 'granted')

  static instances = []

  constructor(title, options = {}) {
    this.title = title
    this.options = options
    MockNotification.instances.push(this)
  }

  close() {}
}

/** AudioContext mock (jsdom ماعندهاش Web Audio) */
class MockAudioContext {
  constructor() {
    this.currentTime = 0
    this.state = 'running'
    this.destination = {}
  }

  createOscillator() {
    return {
      type: 'sine',
      frequency: { setValueAtTime: vi.fn(), value: 440 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }
  }

  createGain() {
    return {
      gain: {
        value: 1,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    }
  }

  resume() {
    return Promise.resolve()
  }

  close() {
    return Promise.resolve()
  }
}

function createMediaQueryList(query) {
  return {
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  }
}

beforeEach(() => {
  memoryStorage.clear()

  MockNotification.permission = 'granted'
  MockNotification.instances.length = 0
  MockNotification.requestPermission.mockClear()
  vi.stubGlobal('Notification', MockNotification)

  vi.stubGlobal('AudioContext', MockAudioContext)
  vi.stubGlobal('webkitAudioContext', MockAudioContext)

  Object.defineProperty(window.navigator, 'vibrate', {
    configurable: true,
    writable: true,
    value: vi.fn(() => true),
  })

  Object.defineProperty(window.navigator, 'wakeLock', {
    configurable: true,
    writable: true,
    value: {
      request: vi.fn(async () => ({
        released: false,
        release: vi.fn(async () => {}),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        onrelease: null,
      })),
    },
  })

  if (typeof window.matchMedia !== 'function') {
    window.matchMedia = vi.fn(createMediaQueryList)
  }

  window.scrollTo = vi.fn()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

export { MockNotification, memoryStorage }
