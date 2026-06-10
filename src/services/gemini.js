const GEMINI_BASE  = 'https://generativelanguage.googleapis.com/v1'
const GEMINI_BETA  = 'https://generativelanguage.googleapis.com/v1beta'
const GEMINI_MODEL = 'gemini-1.5-flash'

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

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function uploadFile(file, key) {
  const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${key}`
  const metadata = { file: { display_name: file.name } }
  const boundary = 'b' + Math.floor(Math.random() * 1e12)

  const metaBytes = new TextEncoder().encode(
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${file.type}\r\n\r\n`
  )
  const endBytes  = new TextEncoder().encode(`\r\n--${boundary}--`)
  const fileBytes = await file.arrayBuffer()

  const body = new Uint8Array(metaBytes.byteLength + fileBytes.byteLength + endBytes.byteLength)
  body.set(metaBytes, 0)
  body.set(new Uint8Array(fileBytes), metaBytes.byteLength)
  body.set(endBytes, metaBytes.byteLength + fileBytes.byteLength)

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || `UPLOAD_ERROR:${res.status}`)
  }
  return (await res.json()).file
}

async function waitForFileActive(fileName, key, maxWait = 60000) {
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    const res  = await fetch(`${GEMINI_BETA}/files/${fileName.split('/').pop()}?key=${key}`)
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
    `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${key}`,
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

  const profile     = getAccountProfile()
  const profileText = profileToText(profile)

  const systemInstruction = `너는 인스타그램 전문 BX(브랜드 경험) 디자이너이자 트렌디한 마케터야.
${profileText ? `\n[이 계정의 정체성과 방향성 — 반드시 기준점으로 삼아]\n${profileText}\n` : ''}
사용자가 올린 레퍼런스를 분석해서,${profileText
  ? ' 위 계정 방향성과 결이 맞는지 냉정하게 비교하고, 이 레퍼런스를 어떻게 소화하면 계정 아이덴티티를 강화할 수 있는지 구체적으로 피드백해줘.'
  : ' 콘텐츠의 톤앤매너·브랜딩 방향성을 분석하고 개선점을 제안해줘.'}

결과는 반드시 아래 JSON 형식으로만 반환해:
{
  "overall": "전체 평가 한 줄",
  "score": 75,
  "fit": "${profileText ? '계정 방향성과의 결 일치도 (2-3문장)' : ''}",
  "tone": "톤앤매너 분석 (2-3문장)",
  "strengths": ["강점1", "강점2", "강점3"],
  "improvements": ["개선점1", "개선점2", "개선점3"],
  "direction": "적용 가능한 구체적 방향성 (3-4문장)",
  "hashtags": ["#해시태그1", "#해시태그2", "#해시태그3", "#해시태그4", "#해시태그5"]
}`

  const parts = []

  if (videoFile) {
    onProgress?.('영상 업로드 중...')
    if (videoFile.size <= 20 * 1024 * 1024) {
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
    parts.push({ text: `\n사용자 입력:\n${textInput.trim()}` })
  }
  parts.push({ text: '\nJSON 형식으로 분석 결과를 반환해줘.' })

  onProgress?.('Gemini 분석 중...')

  try {
    const text = await callGemini(key, systemInstruction, parts, true)
    return JSON.parse(text)
  } catch (e) {
    try { return JSON.parse(e.message) } catch { throw e }
  }
}

// ── 개별 게시물 AI 성과 분석 ─────────────────────────────────────────────────
export async function analyzePost({ post, comments, onProgress }) {
  const key = apiKey()
  if (!key) throw new Error('NO_GEMINI_KEY')

  const profile     = getAccountProfile()
  const profileText = profileToText(profile)

  onProgress?.('Gemini 분석 중...')

  const date    = post.timestamp ? new Date(post.timestamp).toLocaleDateString('ko-KR') : '날짜 없음'
  const caption = post.caption   || '(캡션 없음)'
  const likes   = post.like_count      ?? '-'
  const cmtCnt  = post.comments_count  ?? '-'
  const type    = post.media_type      || 'POST'

  const commentsText = comments?.length
    ? comments.slice(0, 20).map((c, i) => `${i + 1}. ${c.text || c}`).join('\n')
    : '(댓글 데이터 없음)'

  const systemInstruction = `너는 인스타그램 전문 BX 디자이너이자 냉정한 콘텐츠 전략가야.
${profileText ? `\n[이 계정의 정체성]\n${profileText}\n` : ''}
아래 게시물 데이터를 분석해서, 실용적이고 구체적인 피드백을 줘. 칭찬보다 개선점과 인사이트에 집중해.

결과는 반드시 아래 JSON 형식으로만 반환해:
{
  "verdict": "이 게시물 한 줄 판정 (예: 기대 이상 성과 / 아쉬운 반응)",
  "performanceScore": 72,
  "whyItWorked": "반응이 좋았던 이유 또는 아쉬웠던 이유 (2-3문장)",
  "brandFit": "${profileText ? '계정 아이덴티티와의 결 일치도 평가 (2문장)' : '(프로필 미설정)'}",
  "audienceInsight": "댓글 민심·반응 핵심 요약 (2-3문장)",
  "nextAction": "이 게시물 성과를 바탕으로 다음 게시물에 바로 적용할 것 (3가지 bullet)",
  "doNextTime": ["다음엔 이렇게1", "다음엔 이렇게2", "다음엔 이렇게3"]
}`

  const userText = `[게시물 정보]
유형: ${type}
날짜: ${date}
좋아요: ${likes}
댓글 수: ${cmtCnt}
캡션:
${caption}

[댓글 목록 (최대 20개)]
${commentsText}

위 데이터를 분석해서 JSON으로 반환해줘.`

  const text = await callGemini(key, systemInstruction, [{ text: userText }], true)

  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

// ── 주간 브랜딩 루틴 생성 ─────────────────────────────────────────────────────
export async function getWeeklyRoutine({ igProfile, recentMedia, confirmedRefs, onProgress }) {
  const key = apiKey()
  if (!key) throw new Error('NO_GEMINI_KEY')

  const profile     = getAccountProfile()
  const profileText = profileToText(profile)

  onProgress?.('데이터 정리 중...')

  let mediaText = '(인스타그램 데이터 없음)'
  if (recentMedia?.length) {
    mediaText = recentMedia.slice(0, 10).map((m, i) => {
      const date    = m.timestamp ? new Date(m.timestamp).toLocaleDateString('ko-KR') : '날짜 없음'
      const caption = m.caption   ? m.caption.slice(0, 80) + (m.caption.length > 80 ? '…' : '') : '(캡션 없음)'
      return `${i + 1}. [${m.media_type || 'POST'}] ${date} | 좋아요: ${m.like_count ?? '-'} | 댓글: ${m.comments_count ?? '-'} | ${caption}`
    }).join('\n')
  }

  const igSummary = igProfile
    ? `팔로워: ${igProfile.followers_count ?? '-'} / 게시물 수: ${igProfile.media_count ?? '-'}`
    : '(계정 데이터 없음)'

  let refsText = '(저장된 레퍼런스 없음)'
  if (confirmedRefs?.length) {
    refsText = confirmedRefs.map((r, i) => {
      const parts = [`${i + 1}. ${r.memo || r.text || '(메모 없음)'}`]
      if (r.url) parts.push(`   링크: ${r.url}`)
      return parts.join('\n')
    }).join('\n')
  }

  const systemInstruction = `너는 인스타그램 전문 BX 디자이너이자 실행력 있는 콘텐츠 코치야.
사용자의 계정 데이터와 컨펌된 레퍼런스를 바탕으로, 이번 주 월~일 7일간 즉시 실행 가능한 요일별 콘텐츠 루틴을 만들어줘.

━━━ 반드시 지켜야 할 2가지 핵심 규칙 ━━━

[규칙 ①] 미감 중심 비주얼 캐러셀 주 1회 필수 포함
- 정보성·설명형 카드뉴스는 절대 제안 금지.
- 대신 "와, 이 사람 미감 좋다, 힙하다" 는 시각적 감탄이 나오는 비주얼 캐러셀 피드를 반드시 주 1회 이상 스케줄에 넣어.
- 이 캐러셀은 반드시 사용자가 컨펌한 레퍼런스 무드(키치, 비비드, 그래픽 오브제, 별, 감각적 타이포그래피 레이아웃 등)를 기반으로 매칭해서 제안해.
- 캐러셀 타입은 반드시 "비주얼캐러셀"로 표기해.

[규칙 ②] 회사 생활 브이로그 릴스 화면/자막 분리 출력
- 릴스 루틴은 반드시 [화면]과 [자막] 필드를 분리해서 출력해.
- 화면: 매일 반복되는 출근·작업·회사 일상·디자인 업무 장면(브이로그 소스)
- 자막: 화면을 설명하지 말고, 디자이너로서의 진솔한 생각·브랜딩 인사이트·솔직한 고민·마인드셋을 요즘 인스타 트렌드 스타일로 매일 다르게.
  예) "내가 뛰어난 디자이너들 사이에서 주눅 들지 않고 내 색깔을 지키는 법"

추상적인 말 금지. 당장 오늘부터 따라할 수 있는 구체적 행동만.

결과는 반드시 아래 JSON 형식으로만 반환해:
{
  "weekSummary": "이번 주 계정 상태 총평 (2문장)",
  "weekTheme": "이번 주 통일 테마 한 줄",
  "routine": [
    {
      "day": "월",
      "type": "릴스 또는 비주얼캐러셀 또는 스토리 또는 피드 또는 휴식",
      "action": "구체적 행동 설명",
      "screen": "릴스일 때만: 화면 소스 설명 (예: 출근길 카페 들르는 장면 브이로그)",
      "caption": "릴스일 때만: 자막/나레이션 컨셉 (예: 내가 디자인에서 '힙함'보다 '나다움'을 선택한 이유)",
      "refMatch": "비주얼캐러셀일 때만: 참고한 레퍼런스와 매칭 포인트",
      "tip": "실행 팁 한 문장"
    }
  ],
  "mustDo": ["이번 주 반드시 할 것1", "할 것2"],
  "mustAvoid": ["이번 주 절대 피할 것1", "피할 것2"]
}`

  const userText = `[내 계정 프로필]
${profileText || '(계정 프로필 미설정)'}

[현재 계정 현황]
${igSummary}

[최근 게시물 10개]
${mediaText}

[컨펌된 레퍼런스 보관함]
${refsText}

위 데이터를 분석해서 이번 주 요일별 콘텐츠 루틴을 JSON으로 만들어줘.
규칙①(비주얼 캐러셀 주1회)과 규칙②(릴스 화면/자막 분리)를 반드시 지켜줘.`

  onProgress?.('Gemini 루틴 생성 중...')

  const text = await callGemini(key, systemInstruction, [{ text: userText }], true)

  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

// ── 레퍼런스 보관함 localStorage 헬퍼 ────────────────────────────────────────
export function getConfirmedRefs() {
  try { return JSON.parse(localStorage.getItem('confirmed_refs') || '[]') } catch { return [] }
}

export function saveConfirmedRefs(refs) {
  localStorage.setItem('confirmed_refs', JSON.stringify(refs))
}
