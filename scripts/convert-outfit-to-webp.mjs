#!/usr/bin/env node
/**
 * PNG → WebP 변환 스크립트 (quality 80)
 * 실행: node scripts/convert-outfit-to-webp.mjs
 *
 * - public/outfit/characters/*.png
 * - public/outfit/accessories/*.png
 * 를 찾아 같은 위치에 *-v1.webp (또는 원래 stem + .webp) 로 저장합니다.
 * 기존 PNG는 보존됩니다.
 */

import sharp from 'sharp'
import { readdir, stat } from 'fs/promises'
import { join, basename, extname } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_ROOT = join(__dirname, '..', 'public', 'outfit')

const DIRS = ['characters', 'accessories']

async function convertDir(dir) {
  const full = join(PUBLIC_ROOT, dir)
  const files = await readdir(full)
  const pngs = files.filter((f) => f.toLowerCase().endsWith('.png'))

  for (const file of pngs) {
    const srcPath = join(full, file)
    const stem = basename(file, extname(file))
    const destPath = join(full, `${stem}.webp`)

    const srcStat = await stat(srcPath)
    const srcKB = (srcStat.size / 1024).toFixed(1)

    await sharp(srcPath).webp({ quality: 80 }).toFile(destPath)

    const destStat = await stat(destPath)
    const destKB = (destStat.size / 1024).toFixed(1)
    const saving = (((srcStat.size - destStat.size) / srcStat.size) * 100).toFixed(0)

    console.log(`✓ ${dir}/${file} → ${stem}.webp  (${srcKB}KB → ${destKB}KB, -${saving}%)`)
  }
}

async function main() {
  console.log('Converting outfit PNGs to WebP (quality 80)...\n')
  for (const dir of DIRS) {
    await convertDir(dir)
  }
  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
