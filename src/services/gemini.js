const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'

function apiKey() {
  return localStorage.getItem('gemini_api_key') || ''
}

export function getAccountProfile() {
  try {
    return JSON.parse(localStorage.getItem('account_profile') || '{}')
  } catch {
    return {}
  }
}

function profileToText(profile) {
  if (!profile || (!profile.concept && !profile.target && !profile.visual)) return null
  const lines = []
  if (profile.concept) lines.push(`- 계정 컨셉/정체성: ${profile.concept}`)
  if (profile.target)  lines.push(`- 핵심 타겟 오디언스: ${profile.target}`)
  if (profile.visual)  lines.push(`- 추구하는 비주얼 스타일: ${profile.visual}`)
  return lines.join('\n')
}

// 파일을 base64로 변환
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Gemini Files API에 파일 업로드 (대용량 영상용)
async function uploadFile(file, key) {
  const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${key}`
  const metadata = { file: { display_name: file.name } }
  const boundary = 'boundary' + Math.floor(Math.random() * 1e9)

  const metadataBytes = new TextEncoder().encode(
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${file.type}\r\n\r\n`
  )
  const endBytes = new TextEncoder().encode(`\r\n--${boundary}--`)
  const fileBytes = await file.arrayBuffer()

  const body = new Uint8Array(metadataBytes.byteLength + fileBytes.byteLength + endBytes.byteLength)
  body.set(metadataBytes, 0)
  body.set(new Uint8Array(fileBytes), metadataBytes.byteLength)
  body.set(endBytes, metadataBytes.byteLength + fileBytes.byteLength)

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || `UPLOAD_ERROR:${res.status}`)
  }
  const json = await res.json()
  return json.file
}

// 파일 처리 완료 대기
async function waitForFileActive(fileName, key, maxWait = 60000) {
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    const res = await fetch(`${GEMINI_BASE}/files/${fileName.split('/').pop()}?key=${key}`)
    const json = await res.json()
    if (json.state === 'ACTIVE') return json
    if (json.state === 'FAILED') throw new Error('FILE_PROCESSING_FAILED')
    await new Promise(r => setTimeout(r, 2000))
  }
  throw new Error('FILE_UPLOAD_TIMEOUT')
}

async function callGemini(key, systemInstruction, userParts, jsonMode = true) {
  const payload = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts: userParts }],
    generationConfig: {
      temperature: 0.75,
      maxOutputTokens: 2048,
      ...(jsonMode ? { response_mime_type: 'application/json' } : {}),
    },
  }

  const res = await fetch(
    `${GEMINI_BASE}/models/gemini-1.5-flash:generateContent?key=${key}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
  )

  if (!res.ok) {
    const err = await res.json()
    const msg = err.error?.message || `GEMINI_ERROR:${res.status}`
    if (res.status === 403) throw new Error('API 키가 유효하지 않아요')
    if (res.status === 429) throw new Error('요청 한도 초과 — 잠시 후 다시 시도해줘요')
    throw new Error(msg)
  }

  const json = await res.json()
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('EMPTY_RESPONSE')
  return text
}

// ── 레퍼런스 콘텐츠 분석 ─────────────────────────────────────────────────────
export async function analyzeContent({ videoFile, textInput, onProgress }) {
  const key = apiKey()
  if (!key) throw new Error('NO_GEMINI_KEY')
  if (!videoFile && !textInput?.trim()) throw new Error('NO_INPUT')

  const profile = getAccountProfile()
  const profileText = profileToText(profile)

  const systemInstruction = `너는 인스타그램 전문 BX(브랜드 경험) 디자이너이자 트렌디한 마케터야.
${profileText
  ? `\n아래는 이 계정의 현재 정체성과 방향성이야. 이것을 반드시 기준점으로 삼아서 판단해:\n${profileText}\n`
  : ''}
사용자가 제공한 레퍼런스 영상 또는 텍스트 컨셉을 분석해서,
${profileText
  ? '위 계정 방향성과 얼마나 결이 맞는지 냉정하게 비교 분석하고, 이 레퍼런스를 어떻게 소화하면 계정 아이덴티티를 강화할 수 있는지 구체적으로 피드백해줘.'
  : '이 콘텐츠의 톤앤매너와 브랜딩 방향성을 분석하고 개선점을 제안해줘.'}

분석 결과는 반드시 아래 JSON 형식으로만 반환해:
{
  "overall": "전체 평가 한 줄",
  "score": 75,
  "fit": "${profileText ? '계정 방향성과의 결 일치도 평가 (2-3문장)' : null}",
  "tone": "이 레퍼런스의 톤앤매너 분석 (2-3문장)",
  "strengths": ["이 레퍼런스의 강점1", "강점2", "강점3"],
  "improvements": ["이 계정에 맞게 소화하려면 개선할 점1", "개선점2", "개선점3"],
  "direction": "이 레퍼런스를 참고해 적용할 수 있는 구체적 방향성 (3-4문장)",
  "hashtags": ["#추천해시태그1", "#추천해시태그2", "#추천해시태그3", "#추천해시태그4", "#추천해시태그5"]
}`

  const parts = []

  if (videoFile) {
    onProgress?.('영상 업로드 중...')
    const SIZE_LIMIT = 20 * 1024 * 1024

    if (videoFile.size <= SIZE_LIMIT) {
      const base64 = await fileToBase64(videoFile)
      parts.push({ inline_data: { mime_type: videoFile.type, data: base64 } })
    } else {
      onProgress?.('대용량 영상 처리 중...')
      const uploaded = await uploadFile(videoFile, key)
      onProgress?.('영상 분석 준비 중...')
      const active = await waitForFileActive(uploaded.name, key)
      parts.push({ file_data: { mime_type: videoFile.type, file_uri: active.uri } })
    }
  }

  if (textInput?.trim()) {
    parts.push({ text: `\n사용자 입력 텍스트/컨셉:\n${textInput.trim()}` })
  }

  parts.push({ text: '\n위 콘텐츠를 분석해서 지정된 JSON 형식으로 응답해줘.' })

  onProgress?.('Gemini 분석 중...')

  try {
    const text = await callGemini(key, systemInstruction, parts, true)
    return JSON.parse(text)
  } catch (e) {
    if (e.message.startsWith('{')) return JSON.parse(e.message)
    try { return JSON.parse(e.message) } catch { throw e }
  }
}

// ── 주간 브랜딩 방향성 추천 ──────────────────────────────────────────────────
export async function getWeeklyDirection({ igProfile, recentMedia, onProgress }) {
  const key = apiKey()
  if (!key) throw new Error('NO_GEMINI_KEY')

  const profile = getAccountProfile()
  const profileText = profileToText(profile)

  onProgress?.('데이터 정리 중...')

  // 최근 미디어 요약 텍스트 생성
  let mediaText = '(인스타그램 데이터 없음)'
  if (recentMedia?.length) {
    const items = recentMedia.slice(0, 10).map((m, i) => {
      const date = m.timestamp ? new Date(m.timestamp).toLocaleDateString('ko-KR') : '날짜 없음'
      const caption = m.caption ? m.caption.slice(0, 80) + (m.caption.length > 80 ? '…' : '') : '(캡션 없음)'
      return `${i + 1}. [${m.media_type || 'POST'}] ${date} | 좋아요: ${m.like_count ?? '-'} | 댓글: ${m.comments_count ?? '-'} | 캡션: ${caption}`
    })
    mediaText = items.join('\n')
  }

  const igSummary = igProfile
    ? `팔로워: ${igProfile.followers_count ?? '-'} / 게시물 수: ${igProfile.media_count ?? '-'}`
    : '(계정 데이터 없음)'

  const systemInstruction = `너는 인스타그램 전문 BX 디자이너이자 데이터 기반 콘텐츠 전략가야.
사용자의 계정 데이터와 프로필 정보를 종합 분석해서, 이번 주에 실행할 수 있는 구체적인 콘텐츠 전략을 제안해줘.

추상적인 말은 금지. 당장 써먹을 수 있는 구체적인 방향으로만 답해줘.

결과는 반드시 아래 JSON 형식으로만 반환해:
{
  "summary": "이번 주 계정 상태 총평 (2문장)",
  "weeklyTheme": "이번 주 추천 콘텐츠 테마 한 줄",
  "contentIdeas": [
    { "type": "릴스/카드뉴스/사진 중 하나", "title": "구체적인 게시물 제목/아이디어", "reason": "왜 이게 좋은지 한 문장" },
    { "type": "...", "title": "...", "reason": "..." },
    { "type": "...", "title": "...", "reason": "..." }
  ],
  "toneAdvice": "이번 주 적용할 톤앤매너 가이드 (2-3문장)",
  "visualConcept": "이번 주 시도할 비주얼 컨셉 (2-3문장)",
  "doThis": ["당장 이번 주에 할 것1", "할 것2", "할 것3"],
  "avoidThis": ["이번 주 피해야 할 것1", "피해야 할 것2"]
}`

  const userText = `
[내 계정 프로필]
${profileText || '(계정 프로필 미설정)'}

[현재 인스타그램 계정 현황]
${igSummary}

[최근 게시물 10개]
${mediaText}

위 데이터를 분석해서 이번 주 브랜딩 방향성을 JSON으로 제안해줘.`

  onProgress?.('Gemini 분석 중...')

  const text = await callGemini(key, systemInstruction, [{ text: userText }], true)

  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}
