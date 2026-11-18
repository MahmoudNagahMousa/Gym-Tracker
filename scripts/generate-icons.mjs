/**
 * يولد أيقونات PNG بدون أي مكتبات خارجية (PNG encoder مكتوب من الصفر بـ zlib).
 * التشغيل:  npm run icons
 * الناتج:   public/icons/icon-192.png, icon-512.png, icon-512-maskable.png, apple-touch-icon-180.png
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(here, '..', 'public', 'icons')

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buffer) {
  let crc = -1
  for (let i = 0; i < buffer.length; i += 1) crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ -1) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const typeBuffer = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0)
  return Buffer.concat([length, typeBuffer, data, crc])
}

function encodePng(size, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0 // no filter
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const inRect = (x, y, x0, x1, y0, y1) => x >= x0 && x <= x1 && y >= y0 && y <= y1

/** دمبل بسيط على خلفية داكنة متدرجة */
function drawIcon(size, { rounded = true } = {}) {
  const rgba = Buffer.alloc(size * size * 4)
  const radius = rounded ? size * 0.22 : 0
  const bar = [34, 197, 94] // #22c55e
  const plate = [232, 238, 252] // #e8eefc

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4
      const nx = x / size
      const ny = y / size

      const t = (nx + ny) / 2
      let r = Math.round(10 + t * 14)
      let g = Math.round(17 + t * 26)
      let b = Math.round(32 + t * 48)
      let a = 255

      if (radius > 0) {
        const dx = x < radius ? radius - x : x > size - 1 - radius ? x - (size - 1 - radius) : 0
        const dy = y < radius ? radius - y : y > size - 1 - radius ? y - (size - 1 - radius) : 0
        if (dx > 0 && dy > 0 && Math.hypot(dx, dy) > radius) a = 0
      }

      if (a === 255) {
        let color = null
        if (inRect(nx, ny, 0.28, 0.72, 0.462, 0.538)) color = bar
        else if (inRect(nx, ny, 0.185, 0.29, 0.32, 0.68)) color = plate
        else if (inRect(nx, ny, 0.71, 0.815, 0.32, 0.68)) color = plate
        else if (inRect(nx, ny, 0.295, 0.36, 0.395, 0.605)) color = plate
        else if (inRect(nx, ny, 0.64, 0.705, 0.395, 0.605)) color = plate
        if (color) {
          r = color[0]
          g = color[1]
          b = color[2]
        }
      }

      rgba[i] = r
      rgba[i + 1] = g
      rgba[i + 2] = b
      rgba[i + 3] = a
    }
  }
  return rgba
}

mkdirSync(outDir, { recursive: true })

const targets = [
  ['icon-192.png', 192, { rounded: true }],
  ['icon-512.png', 512, { rounded: true }],
  ['icon-512-maskable.png', 512, { rounded: false }],
  ['apple-touch-icon-180.png', 180, { rounded: false }],
]

for (const [name, size, options] of targets) {
  const png = encodePng(size, drawIcon(size, options))
  writeFileSync(resolve(outDir, name), png)
  console.log(`OK  ${name}  ${size}x${size}  (${png.length} bytes)`)
}
