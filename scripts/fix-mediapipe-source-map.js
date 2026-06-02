import { copyFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const pkgRoot = resolve(process.cwd(), 'node_modules', '@mediapipe', 'tasks-vision')
const src = resolve(pkgRoot, 'vision_bundle.mjs.map')
const dest = resolve(pkgRoot, 'vision_bundle_mjs.js.map')

if (existsSync(src) && !existsSync(dest)) {
  copyFileSync(src, dest)
  console.log('Created missing MediaPipe source map:', dest)
}
