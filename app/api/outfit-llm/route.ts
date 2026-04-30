import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { OUTFIT_LLM_SYSTEM, buildOutfitLlmUserMessage, type OutfitLlmRequestPayload } from '@/lib/outfit/llmOutfitPrompt'

const BodySchema = z.object({
  locationName: z.string().optional().default(''),
  temperature: z.number(),
  feelsLike: z.number(),
  humidity: z.number(),
  windSpeed: z.number(),
  windDirection: z.number().optional(),
  uvIndex: z.number(),
  precipitation: z.number(),
  ptyCode: z.string(),
  skyCode: z.string(),
  pm10Value: z.number().optional(),
  pm25Value: z.number().optional(),
  dustGradeLabel: z.string(),
  o3GradeLabel: z.string().optional(),
  activityLabel: z.string(),
  genderLabel: z.string(),
  terrainLabel: z.string(),
  hour: z.number().int().min(0).max(23),
  durationHours: z.number().positive().max(24),
  layerLabel: z.string(),
  tempZone: z.string(),
  ruleRequiredNames: z.array(z.string()),
  ruleOptionalNames: z.array(z.string()),
  dangerLevel: z.string(),
  cancelActivity: z.boolean(),
  dangerSummary: z.array(z.string()),
  tips: z.array(z.string()),
  uvAlert: z.boolean(),
  dustAlert: z.boolean(),
  rainAlert: z.boolean(),
  windAlert: z.boolean(),
})

const LlmJsonSchema = z.object({
  explanation: z.string(),
  outfitSuggestions: z.array(
    z.object({
      area: z.string(),
      detail: z.string(),
    }),
  ),
})

function extractJsonObject(text: string): unknown {
  const t = text.trim()
  try {
    return JSON.parse(t)
  } catch {
    const m = t.match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0])
    throw new Error('no_json')
  }
}

export async function POST(req: NextRequest) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    return NextResponse.json(
      { error: 'no_api_key', message: 'ANTHROPIC_API_KEY가 설정되어 있지 않습니다.' },
      { status: 503 },
    )
  }

  let body: z.infer<typeof BodySchema>
  try {
    const json = await req.json()
    body = BodySchema.parse(json)
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const payload: OutfitLlmRequestPayload = {
    locationName: body.locationName || '조회 위치',
    temperature: body.temperature,
    feelsLike: body.feelsLike,
    humidity: body.humidity,
    windSpeed: body.windSpeed,
    windDirection: body.windDirection,
    uvIndex: body.uvIndex,
    precipitation: body.precipitation,
    ptyCode: body.ptyCode,
    skyCode: body.skyCode,
    pm10Value: body.pm10Value,
    pm25Value: body.pm25Value,
    dustGradeLabel: body.dustGradeLabel,
    o3GradeLabel: body.o3GradeLabel,
    activityLabel: body.activityLabel,
    genderLabel: body.genderLabel,
    terrainLabel: body.terrainLabel,
    hour: body.hour,
    durationHours: body.durationHours,
    layerLabel: body.layerLabel,
    tempZone: body.tempZone,
    ruleRequiredNames: body.ruleRequiredNames,
    ruleOptionalNames: body.ruleOptionalNames,
    dangerLevel: body.dangerLevel,
    cancelActivity: body.cancelActivity,
    dangerSummary: body.dangerSummary,
    tips: body.tips,
    uvAlert: body.uvAlert,
    dustAlert: body.dustAlert,
    rainAlert: body.rainAlert,
    windAlert: body.windAlert,
  }

  const userText = buildOutfitLlmUserMessage(payload)
  /** Haiku 3.5(claude-3-5-haiku-20241022)는 API에서 폐기됨 → Haiku 4.5 권장 */
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5'

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1400,
        temperature: 0.35,
        system: OUTFIT_LLM_SYSTEM,
        messages: [{ role: 'user', content: userText }],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Anthropic API', res.status, errText)
      let detail = errText.slice(0, 280)
      try {
        const j = JSON.parse(errText) as { error?: { message?: string; type?: string } }
        if (j?.error?.message) detail = j.error.message
      } catch {
        /* raw text */
      }
      return NextResponse.json(
        {
          error: 'upstream',
          message: 'AI 응답을 가져오지 못했습니다.',
          detail,
        },
        { status: 502 },
      )
    }

    const data = (await res.json()) as {
      content?: { type: string; text?: string }[]
    }
    const block = data.content?.find((c) => c.type === 'text')
    const raw = block?.text?.trim() ?? ''
    if (!raw) {
      return NextResponse.json({ error: 'empty', message: 'AI 응답이 비었습니다.' }, { status: 502 })
    }

    let parsed: z.infer<typeof LlmJsonSchema>
    try {
      const obj = extractJsonObject(raw)
      parsed = LlmJsonSchema.parse(obj)
    } catch {
      return NextResponse.json(
        {
          error: 'parse',
          message: 'AI 응답 형식을 해석하지 못했습니다.',
          rawPreview: raw.slice(0, 400),
        },
        { status: 502 },
      )
    }

    return NextResponse.json({
      explanation: parsed.explanation,
      outfitSuggestions: parsed.outfitSuggestions,
    })
  } catch (e) {
    console.error('outfit-llm route', e)
    return NextResponse.json({ error: 'server', message: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
