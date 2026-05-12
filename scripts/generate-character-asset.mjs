#!/usr/bin/env node
/**
 * 캐릭터 일러스트 생성 스크립트 (Google Gemini API — Nano Banana)
 *
 * Reference: public/outfit/characters/{male-cool-v1.webp, female-warm-v1.png}
 * Output:    public/outfit/characters/{gender}-{slot}-v1.png + .webp
 *
 * Usage:
 *   GEMINI_API_KEY=... node scripts/generate-character-asset.mjs --all
 *   GEMINI_API_KEY=... node scripts/generate-character-asset.mjs male-mild-v1 female-cold-v1
 *   GEMINI_API_KEY=... node scripts/generate-character-asset.mjs --list
 *
 * Add to .env.local:  GEMINI_API_KEY=AIza...  (get a free key from https://aistudio.google.com)
 */

import { GoogleGenAI } from '@google/genai'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CHAR_DIR = path.join(ROOT, 'public', 'outfit', 'characters')

// .env.local 자동 로딩 (단순 파서)
const ENV_PATH = path.join(ROOT, '.env.local')
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY 가 없습니다. .env.local 또는 환경변수에 추가하세요.')
  console.error('   발급: https://aistudio.google.com → Get API Key (무료)')
  process.exit(1)
}

// outfit-asset 스킬 §1-A 의 STYLE LOCK 블록과 동기화 필수
const STYLE_LOCK_MALE = `
[STYLE LOCK — MALE]
Korean webtoon / manhwa illustration style — soft thin colored line + light watercolor wash.
NOT thick black outlines, NOT chibi.
Same young Korean man in his mid-20s, slim athletic build, ~178 cm tall, ~7 head body proportion.
Short tousled dark brown hair with a soft wavy fringe falling slightly to the right of the forehead.
Almond-shaped eyes with light brown irises, single eyelid crease, calm neutral expression,
head turned very slightly toward camera-right.
Pale skin, soft pink lips, no facial hair, no glasses.
Pure white background (#FFFFFF), no shadows, no floor, generous margin,
vertical 2:3 canvas, centered full-body standing pose.
Thin medium-grey outlines, gentle cel shading with soft watercolor wash, subtle clothing folds.
No text, no watermarks, no logos.
The provided reference image shows the canonical character — keep the exact same face, hairstyle,
body proportion and art style. ONLY change the outfit as described below.
`.trim()

const STYLE_LOCK_FEMALE = `
[STYLE LOCK — FEMALE]
Simple flat cartoon mobile-app illustration style — clean thin uniform black outlines, flat soft-pastel fills.
NOT semi-realistic, NOT anime, NOT watercolor.
Same young Korean woman in her mid-20s, slim slender build, ~5.5 head body proportion, slightly chibi feel.
Chestnut brown shoulder-length hair with eyebrow-grazing straight fringe and a gentle inward curl at the ends.
Round soft face, small simple solid-black dot eyes, faint thin smile,
two small pink blush dots on the cheeks.
NO nose line. NO eyelash detail. NO ear detail. Keep the face minimal.
Pose: straight front-facing, both arms relaxed at sides, gentle warm smile.
Pure white background (#FFFFFF), no shadows, no floor, generous margin,
vertical 2:3 canvas, centered full-body standing pose.
Thin uniform black outlines, flat pastel colors, NO heavy shading, only a few minimal cloth crease lines.
No text, no watermarks, no logos.
The provided reference image shows the canonical character — keep the exact same face, hairstyle,
body proportion and art style. ONLY change the outfit as described below.
`.trim()

const CANON_MALE = 'male-cool-v1.webp'
const CANON_FEMALE = 'female-warm-v1.png'

// 슬롯별 의상 한 줄. docs/outfit-character-assets.md §1-A.1 / §4-A.1 / §4-B 와 동기화.
const SLOTS = {
  // 베이스 온도 슬롯 (남자)
  'male-freezing-v1': { gender: 'male', outfit: 'Long navy puffer coat (knee-length), thick grey scarf, dark thermal pants, dark winter boots, both hands in pockets.' },
  'male-cold-v1':     { gender: 'male', outfit: 'Navy or charcoal wool pea coat over a cream knit sweater, dark wool pants, brown leather lace-up boots.' },
  'male-mild-v1':     { gender: 'male', outfit: 'Beige knit cardigan open over a white tee, light beige slacks, white minimalist sneakers.' },
  'male-warm-v1':     { gender: 'male', outfit: 'Plain white short-sleeve T-shirt, slim light-blue jeans, white sneakers.' },
  'male-hot-v1':      { gender: 'male', outfit: 'Light pastel-blue short-sleeve T-shirt, beige knee-length shorts, white slip-on sneakers.' },
  // 베이스 온도 슬롯 (여자) — warm-v1 은 캐논, 생성 대상에서 제외
  'female-freezing-v1': { gender: 'female', outfit: 'Long ivory or pastel-blue puffer coat, soft cream scarf, slim thermal pants, white snow boots.' },
  'female-cold-v1':     { gender: 'female', outfit: 'Beige or camel mid-length wool coat over a cream knit, grey wide-leg trousers, brown ankle boots.' },
  'female-cool-v1':     { gender: 'female', outfit: 'Sage green cardigan open over a white tee, light blue ankle pants, off-white sneakers.' },
  'female-mild-v1':     { gender: 'female', outfit: 'Pink ribbed cardigan open over a cream knit top, blue ankle jeans, ivory sneakers.' },
  'female-hot-v1':      { gender: 'female', outfit: 'Soft coral short-sleeve T-shirt, mint-green knee-length shorts, white sneakers.' },
  // 상황 슬롯 (1차+2차)
  'male-rain-light-v1':   { gender: 'male', outfit: 'Beige trench coat, slacks and loafers, holding a navy open umbrella tilted slightly above the head, the other arm relaxed at the side, dry shoes.' },
  'female-rain-light-v1': { gender: 'female', outfit: 'Trench coat or knee-length raincoat, midi skirt or pants, loafers, holding a pastel-yellow open umbrella tilted slightly above the head.' },
  'male-rain-heavy-v1':   { gender: 'male', outfit: 'Yellow or olive hooded raincoat with the hood up, dark pants, black waterproof ankle boots, both hands tucked near the pockets, slight shoulder hunch.' },
  'female-rain-heavy-v1': { gender: 'female', outfit: 'Belted yellow raincoat with the hood up, slim pants, chelsea-style waterproof boots, both hands tucked near pockets.' },
  'male-snow-v1':         { gender: 'male', outfit: 'Long charcoal puffer coat, knitted beanie, soft scarf wrapped around the neck, dark thermal pants, winter boots, hands in pockets, subtle breath cloud near the mouth.' },
  'female-snow-v1':       { gender: 'female', outfit: 'Ivory puffer coat, knitted beanie, soft cream scarf, slim thermal pants, white snow boots, hands in pockets, soft smile, tiny breath cloud near the mouth.' },
  'male-sunny-uv-v1':     { gender: 'male', outfit: 'Short-sleeve light shirt, beige chinos, white sneakers, baseball cap and sunglasses, one hand lightly touching the cap brim.' },
  'female-sunny-uv-v1':   { gender: 'female', outfit: 'Light linen short-sleeve blouse, beige knee-length shorts or skirt, wide-brim straw sun hat, sunglasses, white sandals, one hand softly holding the hat brim.' },
  'male-windy-v1':        { gender: 'male', outfit: 'Lightweight grey windbreaker half-zipped, slim pants, sneakers, hair and jacket hem softly swept sideways by wind, one hand holding the jacket collar.' },
  'female-windy-v1':      { gender: 'female', outfit: 'Lightweight pastel windbreaker, ankle pants, sneakers, hair softly swept sideways by wind with a small headband keeping the fringe tidy, one hand softly holding the jacket collar.' },
  // 여성 라이프스타일 v2
  'female-warm-v2': { gender: 'female', outfit: 'Knee-length floral pastel sundress with thin shoulder straps, tan flat sandals.' },
  'female-cool-v2': { gender: 'female', outfit: 'Beige trench coat open over a white blouse, ankle-length camel midi skirt, brown ankle boots.' },
  'female-mild-v2': { gender: 'female', outfit: 'Cream wide-collar blouse, A-line beige midi skirt, white sneakers, small shoulder bag strap visible.' },
}

const ai = new GoogleGenAI({ apiKey: API_KEY })
const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image'

async function loadCanonRef(gender) {
  const file = gender === 'male' ? CANON_MALE : CANON_FEMALE
  const buf = fs.readFileSync(path.join(CHAR_DIR, file))
  const mime = file.endsWith('.webp') ? 'image/webp' : 'image/png'
  // Nano Banana는 PNG/JPEG 입력을 가장 안정적으로 처리. WebP면 PNG로 변환.
  if (mime === 'image/webp') {
    const pngBuf = await sharp(buf).png().toBuffer()
    return { data: pngBuf.toString('base64'), mimeType: 'image/png' }
  }
  return { data: buf.toString('base64'), mimeType: mime }
}

async function generateOne(slotKey) {
  const cfg = SLOTS[slotKey]
  if (!cfg) throw new Error(`Unknown slot: ${slotKey}`)
  const styleLock = cfg.gender === 'male' ? STYLE_LOCK_MALE : STYLE_LOCK_FEMALE
  const ref = await loadCanonRef(cfg.gender)

  const prompt = `${styleLock}\n\nOUTFIT FOR THIS RENDER:\n${cfg.outfit}`

  console.log(`▶ ${slotKey}  (model: ${MODEL})`)
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      { role: 'user', parts: [
        { inlineData: { mimeType: ref.mimeType, data: ref.data } },
        { text: prompt },
      ] },
    ],
    config: { responseModalities: ['IMAGE', 'TEXT'] },
  })

  const parts = response?.candidates?.[0]?.content?.parts ?? []
  const imgPart = parts.find((p) => p.inlineData?.data)
  if (!imgPart) {
    const txt = parts.find((p) => p.text)?.text || '(no text)'
    throw new Error(`No image in response. Model text: ${txt}`)
  }
  const pngBytes = Buffer.from(imgPart.inlineData.data, 'base64')

  const pngPath = path.join(CHAR_DIR, `${slotKey}.png`)
  fs.writeFileSync(pngPath, pngBytes)

  const webpPath = path.join(CHAR_DIR, `${slotKey}.webp`)
  await sharp(pngBytes).webp({ quality: 80 }).toFile(webpPath)

  const pngKb = (pngBytes.length / 1024).toFixed(0)
  const webpKb = (fs.statSync(webpPath).size / 1024).toFixed(0)
  console.log(`  ✓ ${slotKey}.png (${pngKb}KB) + .webp (${webpKb}KB)`)
}

async function main() {
  const args = process.argv.slice(2)
  if (args.length === 0 || args.includes('--help')) {
    console.log('Usage: node scripts/generate-character-asset.mjs [--all | --list | <slot> [<slot> ...]]')
    console.log('Slots:', Object.keys(SLOTS).join(', '))
    process.exit(0)
  }
  if (args.includes('--list')) {
    Object.entries(SLOTS).forEach(([k, v]) => console.log(`${k.padEnd(28)} (${v.gender})  ${v.outfit.slice(0, 80)}`))
    return
  }
  const targets = args.includes('--all') ? Object.keys(SLOTS) : args
  const unknown = targets.filter((t) => !SLOTS[t])
  if (unknown.length) { console.error('Unknown slots:', unknown.join(', ')); process.exit(1) }

  for (const slot of targets) {
    try {
      await generateOne(slot)
    } catch (err) {
      console.error(`  ✗ ${slot}:`, err?.message || err)
    }
    // 무료 티어 RPM(10/min) 보호용 딜레이 — 6.5s ≈ 9 RPM
    await new Promise((r) => setTimeout(r, 6500))
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
