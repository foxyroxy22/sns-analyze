/**
 * Google Generative AI REST API v1
 * POST https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=KEY
 */

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
const UPLOAD   = 'https://generativelanguage.googleapis.com/upload/v1beta/files'
const FILES    = 'https://generativelanguage.googleapis.com/v1beta/files'

// ─── localStorage ────────────────────────────────────────────────────────────

function getKey() {
  return localStorage.getItem('gemini_api_key') || ''
}

export function getAccountProfile() {
  try { return JSON.parse(localStorage.getItem('account_profile') || '{}') }
  catch { return {} }
}

export function getConfirmedRefs() {
  try { return JSON.parse(localStorage.getItem('confirmed_refs') || '[]') }
  catch { return [] }
}

export function saveConfirmedRefs(refs) {
  localStorage.setItem('confirmed_refs', JSON.stringify(refs))
}

// ─── 유틸 ────────────────────────────────────────────────────────────────────

function profileToText(p) {
  if (!p || (!p.concept && !p.target && !p.visual)) return null
  const lines = []
  if (p.concept) lines.push(`- 계정 컨셉/정체성: ${p.concept}`)
  if (p.target)  lines.push(`- 핵심 타겟 오디언스: ${p.target}`)
  if (p.visual)  lines.push(`- 추구하는 비주얼 스타일: ${p.visual}`)
  return lines.join('\n')
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function uploadFile(file, key) {
  const meta     = { file: { displayName: file.name } }
  const boundary = 'b' + Math.floor(Math.random() * 1e12)
  const url      = `${UPLOAD}?key=${key}`

  const metaBytes = new TextEncoder().encode(
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(meta)}`
    + `\r\n--${boundary}\r\nContent-Type: ${file.type}\r\n\r\n`
  )
  const endBytes = new TextEncoder().encode(`\r\n--${boundary}--`)
  const fileBuf  = await file.arrayBuffer()

  const body = new Uint8Array(metaBytes.byteLength + fileBuf.byteLength + endBytes.byteLength)
  body.set(metaBytes, 0)
  body.set(new Uint8Array(fileBuf), metaBytes.byteLength)
  body.set(endBytes, metaBytes.byteLength + fileBuf.byteLength)

  const res = await fetch(url, {
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

async function waitActive(fileName, key, maxMs = 60000) {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    const res  = await fetch(`${FILES}/${fileName.split('/').pop()}?key=${key}`)
    const data = await res.json()
    if (data.state === 'ACTIVE') return data
    if (data.state === 'FAILED') throw new Error('FILE_PROCESSING_FAILED')
    await new Promise(r => setTimeout(r, 2000))
  }
  throw new Error('FILE_UPLOAD_TIMEOUT')
}

// ─── 핵심 호출 함수 ───────────────────────────────────────────────────────────

async function callGemini(systemText, userParts) {
  const key = getKey()
  if (!key) throw new Error('NO_GEMINI_KEY')

  const body = JSON.stringify({
    contents: [
      {
        parts: userParts,
      },
    ],
    systemInstruction: {
      parts: [{ text: systemText }],
    },
    generationConfig: {
      temperature: 0.75,
      maxOutputTokens: 2048,
    },
  })

  const res = await fetch(`${ENDPOINT}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err.error?.message || `GEMINI_ERROR:${res.status}`
    if (res.status === 400) throw new Error(`요청 오류: ${msg}`)
    if (res.status === 403) throw new Error('API 키가 유효하지 않아요')
    if (res.status === 429) throw new Error('요청 한도 초과 — 잠시 후 다시 시도해줘요')
    throw new Error(msg)
  }

  const json = await res.json()
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('EMPTY_RESPONSE')
  return text
}

function extractJson(raw) {
  const m = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (m) return m[1].trim()
  const a = raw.indexOf('{')
  const b = raw.lastIndexOf('}')
  if (a !== -1 && b !== -1) return raw.slice(a, b + 1)
  return raw
}

// ─── 레퍼런스 분석 ────────────────────────────────────────────────────────────

export async function analyzeContent({ videoFile, textInput, onProgress }) {
  if (!videoFile && !textInput?.trim()) throw new Error('NO_INPUT')

  const profileText = profileToText(getAccountProfile())

  const systemText = `너는 인스타그램 전문 BX(브랜드 경험) 디자이너이자 트렌디한 마케터야.
${profileText ? `\n[이 계정의 정체성과 방향성]\n${profileText}\n` : ''}
사용자가 올린 레퍼런스를 분석해서,${profileText
  ? ' 위 계정 방향성과 결이 맞는지 냉정하게 비교하고 구체적으로 피드백해줘.'
  : ' 콘텐츠의 톤앤매너와 브랜딩 방향성을 분석하고 개선점을 제안해줘.'}

반드시 아래 JSON 스키마로만 응답해:
{"overall":"전체 평가 한 줄","score":75,"fit":"계정 방향성 일치도 2-3문장","tone":"톤앤매너 분석 2-3문장","strengths":["강점1","강점2","강점3"],"improvements":["개선점1","개선점2","개선점3"],"direction":"구체적 방향성 3-4문장","hashtags":["#태그1","#태그2","#태그3","#태그4","#태그5"]}`

  const parts = []
  const key   = getKey()

  if (videoFile) {
    onProgress?.('영상 업로드 중...')
    if (videoFile.size <= 20 * 1024 * 1024) {
      const b64 = await fileToBase64(videoFile)
      parts.push({ inlineData: { mimeType: videoFile.type, data: b64 } })
    } else {
      onProgress?.('대용량 영상 처리 중...')
      const uploaded = await uploadFile(videoFile, key)
      onProgress?.('영상 분석 준비 중...')
      const active = await waitActive(uploaded.name, key)
      parts.push({ fileData: { mimeType: videoFile.type, fileUri: active.uri } })
    }
  }

  if (textInput?.trim()) parts.push({ text: textInput.trim() })

  onProgress?.('Gemini 분석 중...')
  const raw = await callGemini(systemText, parts)
  try { return JSON.parse(extractJson(raw)) } catch { return { raw } }
}

// ─── 게시물 성과 분석 ─────────────────────────────────────────────────────────

export async function analyzePost({ post, comments, onProgress }) {
  const profileText = profileToText(getAccountProfile())

  onProgress?.('Gemini 분석 중...')

  const date       = post.timestamp ? new Date(post.timestamp).toLocaleDateString('ko-KR') : '날짜 없음'
  const captionTxt = post.caption        || '(캡션 없음)'
  const likes      = post.like_count     ?? '-'
  const cmtCount   = post.comments_count ?? '-'
  const mediaType  = post.media_type     || 'POST'

  const commentsStr = comments?.length
    ? comments.slice(0, 20).map((c, i) => `${i + 1}. ${c.text || c}`).join('\n')
    : '(댓글 데이터 없음)'

  const systemText = `너는 인스타그램 전문 BX 디자이너이자 냉정한 콘텐츠 전략가야.
${profileText ? `\n[이 계정의 정체성]\n${profileText}\n` : ''}
아래 게시물 데이터를 분석해서 실용적이고 구체적인 피드백을 줘. 칭찬보다 개선점과 인사이트에 집중해.

반드시 아래 JSON 스키마로만 응답해:
{"verdict":"게시물 한 줄 판정","performanceScore":72,"whyItWorked":"2-3문장","brandFit":"2문장","audienceInsight":"2-3문장","doNextTime":["다음엔1","다음엔2","다음엔3"]}`

  const userText = `[게시물 정보]
유형: ${mediaType} / 날짜: ${date} / 좋아요: ${likes} / 댓글: ${cmtCount}
캡션: ${captionTxt}

[댓글 목록 (최대 20개)]
${commentsStr}`

  const raw = await callGemini(systemText, [{ text: userText }])
  try { return JSON.parse(extractJson(raw)) } catch { return { raw } }
}

// ─── 주간 루틴 생성 ───────────────────────────────────────────────────────────

export async function getWeeklyRoutine({ igProfile, recentMedia, confirmedRefs, onProgress }) {
  const profileText = profileToText(getAccountProfile())

  onProgress?.('데이터 정리 중...')

  const igSummary = igProfile
    ? `팔로워: ${igProfile.followers_count ?? '-'} / 게시물 수: ${igProfile.media_count ?? '-'}`
    : '(계정 데이터 없음)'

  const mediaText = recentMedia?.length
    ? recentMedia.slice(0, 10).map((m, i) => {
        const d = m.timestamp ? new Date(m.timestamp).toLocaleDateString('ko-KR') : '날짜 없음'
        const c = m.caption   ? m.caption.slice(0, 80) + (m.caption.length > 80 ? '…' : '') : '(캡션 없음)'
        return `${i + 1}. [${m.media_type || 'POST'}] ${d} | 좋아요: ${m.like_count ?? '-'} | 댓글: ${m.comments_count ?? '-'} | ${c}`
      }).join('\n')
    : '(인스타그램 데이터 없음)'

  const refsText = confirmedRefs?.length
    ? confirmedRefs.map((r, i) => {
        const lines = [`${i + 1}. ${r.memo || '(메모 없음)'}`]
        if (r.url) lines.push(`   링크: ${r.url}`)
        return lines.join('\n')
      }).join('\n')
    : '(저장된 레퍼런스 없음)'

  const systemText = `너는 인스타그램 전문 BX 디자이너이자 실행력 있는 콘텐츠 코치야.
사용자의 계정 데이터와 컨펌된 레퍼런스를 바탕으로 이번 주 월~일 7일 즉시 실행 가능한 루틴을 만들어줘.

[필수 규칙 ①] 미감 중심 비주얼 캐러셀 주 1회 필수 포함
- 정보성·설명형 카드뉴스 절대 금지
- "이 사람 미감 좋다, 힙하다" 시각적 감탄 유발 비주얼 캐러셀 반드시 1회 이상
- 레퍼런스 무드(키치, 비비드, 그래픽 오브제, 별, 감각적 타이포) 기반 매칭
- type 필드 반드시 "비주얼캐러셀"로 표기

[필수 규칙 ②] 릴스 화면/자막 반드시 분리
- screen: 출근·작업·회사 일상·디자인 업무 브이로그 장면
- caption: 화면 설명 금지. 디자이너의 진솔한 생각·브랜딩 인사이트·마인드셋 (인스타 트렌드 스타일)

반드시 아래 JSON 스키마로만 응답해:
{"weekSummary":"이번 주 계정 상태 총평 2문장","weekTheme":"이번 주 통일 테마 한 줄","routine":[{"day":"월","type":"릴스|비주얼캐러셀|스토리|피드|휴식","action":"구체적 행동 설명","screen":"릴스일 때만","caption":"릴스일 때만","refMatch":"비주얼캐러셀일 때만","tip":"실행 팁 한 문장"}],"mustDo":["할것1","할것2"],"mustAvoid":["피할것1","피할것2"]}`

  const userText = `[계정 프로필]
${profileText || '(미설정)'}

[계정 현황]
${igSummary}

[최근 게시물 10개]
${mediaText}

[컨펌된 레퍼런스 보관함]
${refsText}`

  onProgress?.('Gemini 루틴 생성 중...')
  const raw = await callGemini(systemText, [{ text: userText }])
  try { return JSON.parse(extractJson(raw)) } catch { return { raw } }
}
