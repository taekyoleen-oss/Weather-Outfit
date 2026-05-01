#!/usr/bin/env node
/**
 * 등산스틱(트레킹 폴) 악세사리 이미지 생성 스크립트
 * SVG → WebP (256×256, quality 80)
 * 실행: node scripts/create-trekking-pole-asset.mjs
 */
import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEST = join(__dirname, '..', 'public', 'outfit', 'accessories', 'acc-trekking-pole-v1.webp')

// 256×256 SVG: 두 개의 등산스틱 (한 쌍) — 교차 배치
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <!-- 배경: 투명 -->

  <!-- 왼쪽 스틱 (기울기: 왼→오) -->
  <g transform="rotate(-18, 128, 128)">
    <!-- 그립 (손잡이) -->
    <rect x="104" y="20" width="14" height="38" rx="7" ry="7"
      fill="#5D4037" />
    <!-- 스트랩 루프 -->
    <ellipse cx="111" cy="20" rx="8" ry="5" fill="none" stroke="#8D6E63" stroke-width="2.5"/>
    <!-- 샤프트 (알루미늄) -->
    <rect x="108" y="56" width="6" height="140" rx="3"
      fill="url(#shaftGradL)" />
    <!-- 바스켓 -->
    <ellipse cx="111" cy="196" rx="10" ry="5" fill="#78909C" />
    <!-- 팁 -->
    <polygon points="108,196 114,196 111,216" fill="#37474F" />
    <!-- 그립 텍스처 라인 -->
    <line x1="105" y1="30" x2="117" y2="30" stroke="#795548" stroke-width="1"/>
    <line x1="105" y1="38" x2="117" y2="38" stroke="#795548" stroke-width="1"/>
    <line x1="105" y1="46" x2="117" y2="46" stroke="#795548" stroke-width="1"/>
    <!-- 조절 잠금 -->
    <rect x="107" y="120" width="8" height="5" rx="1" fill="#546E7A"/>
  </g>

  <!-- 오른쪽 스틱 (기울기: 오→왼) -->
  <g transform="rotate(18, 128, 128)">
    <!-- 그립 (손잡이) -->
    <rect x="138" y="20" width="14" height="38" rx="7" ry="7"
      fill="#5D4037" />
    <!-- 스트랩 루프 -->
    <ellipse cx="145" cy="20" rx="8" ry="5" fill="none" stroke="#8D6E63" stroke-width="2.5"/>
    <!-- 샤프트 (알루미늄) -->
    <rect x="142" y="56" width="6" height="140" rx="3"
      fill="url(#shaftGradR)" />
    <!-- 바스켓 -->
    <ellipse cx="145" cy="196" rx="10" ry="5" fill="#78909C" />
    <!-- 팁 -->
    <polygon points="142,196 148,196 145,216" fill="#37474F" />
    <!-- 그립 텍스처 라인 -->
    <line x1="139" y1="30" x2="151" y2="30" stroke="#795548" stroke-width="1"/>
    <line x1="139" y1="38" x2="151" y2="38" stroke="#795548" stroke-width="1"/>
    <line x1="139" y1="46" x2="151" y2="46" stroke="#795548" stroke-width="1"/>
    <!-- 조절 잠금 -->
    <rect x="141" y="120" width="8" height="5" rx="1" fill="#546E7A"/>
  </g>

  <defs>
    <linearGradient id="shaftGradL" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#B0BEC5"/>
      <stop offset="50%" stop-color="#ECEFF1"/>
      <stop offset="100%" stop-color="#90A4AE"/>
    </linearGradient>
    <linearGradient id="shaftGradR" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#B0BEC5"/>
      <stop offset="50%" stop-color="#ECEFF1"/>
      <stop offset="100%" stop-color="#90A4AE"/>
    </linearGradient>
  </defs>
</svg>`

async function main() {
  const buf = Buffer.from(svg, 'utf-8')
  await sharp(buf, { density: 144 })
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 80 })
    .toFile(DEST)
  console.log(`✓ acc-trekking-pole-v1.webp 생성 완료: ${DEST}`)
}

main().catch((err) => { console.error(err); process.exit(1) })
