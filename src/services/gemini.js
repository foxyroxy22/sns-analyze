const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'

function apiKey() {
  return localStorage.getItem('gemini_api_key') || ''
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
  const boundary = 'boundary' + Date.now()

  // multipart 업로드
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

export async function analyzeContent({ videoFile, textInput, onProgress }) {
  const key = apiKey()
  if (!key) throw new Error('NO_GEMINI_KEY')
  if (!videoFile && !textInput?.trim()) throw new Error('NO_INPUT')

  const systemInstruction = `너는 인스타그램 전문 BX(브랜드 경험) 디자이너이자 트렌디한 마케터야. 사용자가 제공한 영상이나 텍스트 컨셉을 분석해서, 이 콘텐츠가 사용자의 현재 계정 방향성에 도움이 될지 냉정하게 판단하고, 피드 톤앤매너에 맞게 더 나은 브랜딩 방향성과 개선점을 제안해 줘.

분석 결과는 반드시 아래 JSON 형식으로만 반환해:
{
  "overall": "전체 평가 한 줄 (예: 브랜딩 일관성 부족, 리포지셔닝 필요)",
  "score": 75,
  "tone": "현재 톤앤매너 분석 (2-3문장)",
  "strengths": ["강점1", "강점2", "강점3"],
  "improvements": ["개선점1", "개선점2", "개선점3"],
  "direction": "추천 브랜딩 방향성 (3-4문장)",
  "hashtags": ["#추천해시태그1", "#추천해시태그2", "#추천해시태그3", "#추천해시태그4", "#추천해시태그5"]
}`

  const parts = []

  if (videoFile) {
    onProgress?.('영상 업로드 중...')
    const SIZE_LIMIT = 20 * 1024 * 1024 // 20MB — inline 한계

    if (videoFile.size <= SIZE_LIMIT) {
      // 소용량: base64 inline
      const base64 = await fileToBase64(videoFile)
      parts.push({ inline_data: { mime_type: videoFile.type, data: base64 } })
    } else {
      // 대용량: Files API 업로드
      onProgress?.('대용량 영상 처리 중...')
      const uploaded = await uploadFile(videoFile, key)
      onProgress?.('영상 분석 준비 중...')
      const active = await waitForFileActive(uploaded.name, key)
      parts.push({ file_data: { mime_type: videoFile.type, file_uri: active.uri } })
    }
  }

  if (textInput?.trim()) {
    parts.push({ text: `\n\n사용자 입력 텍스트/컨셉:\n${textInput.trim()}` })
  }

  parts.push({ text: '\n위 콘텐츠를 분석해서 지정된 JSON 형식으로 응답해줘.' })

  onProgress?.('Gemini 분석 중...')

  const payload = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts }],
    generationConfig: {
      response_mime_type: 'application/json',
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  }

  const res = await fetch(
    `${GEMINI_BASE}/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  )

  if (!res.ok) {
    const err = await res.json()
    const msg = err.error?.message || `GEMINI_ERROR:${res.status}`
    if (res.status === 400) throw new Error(`API 오류: ${msg}`)
    if (res.status === 403) throw new Error('API 키가 유효하지 않아요')
    if (res.status === 429) throw new Error('요청 한도 초과 — 잠시 후 다시 시도해줘요')
    throw new Error(msg)
  }

  const json = await res.json()
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('EMPTY_RESPONSE')

  try {
    return JSON.parse(text)
  } catch {
    // JSON 파싱 실패 시 텍스트로 fallback
    return { raw: text }
  }
}
