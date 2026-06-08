# SNS Coach 웹앱 빌드 지시서 v2
> Claude Code에 붙여넣고 "이대로 만들어줘" 하면 됩니다.

---

## 프로젝트 개요

개인용 SNS 전략 분석 웹앱입니다.
Instagram과 YouTube 2개 채널 데이터를 자동 수집하고
Claude API가 매주 맞춤형 콘텐츠 전략을 분석 + 추천해주는 대시보드입니다.
폰과 PC 모두에서 접속 가능해야 합니다.

---

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **DB**: better-sqlite3 (SQLite)
- **AI**: Claude API (claude-sonnet-4-6)
- **스케줄러**: node-cron
- **언어**: TypeScript

---

## 환경변수 (.env.local)

```
ANTHROPIC_API_KEY=
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_USER_ID=
YOUTUBE_API_KEY=
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REFRESH_TOKEN=
DATABASE_PATH=./data/sns-coach.db
```

---

## 브랜드 프로필 (모든 Claude 분석에 항상 포함)

```
채널: Instagram (릴스 + 피드/캐러셀) / YouTube (쇼츠 + 롱폼)
핵심 주제:
  1. 해외 생활 / 워홀 / 해외 이주 현실
  2. 직장인 일상 + 솔직한 감정 일기
  3. 디자이너 커리어 / 프리랜싱 초보 성장기
타깃: 18~30대 한국인, 해외 생활 관심자, 직장인, 디자이너 지망생
톤: 감성적이고 솔직하되 유머 섞인. 일기 쓰듯 진솔하게.
레퍼런스: fromwatertoworld 스타일 (건강한 마인드 + 뷰티 + 일상 + 해외생활)
포지셔닝: "회사 다니면서 해외+프리랜서 준비하는 비전공 디자이너의 현실 일기"
목표: 팔로워 성장 → 협찬 → 수익화
금지 주제: 정치
```

---

## 데이터베이스 스키마

```sql
-- 게시물 데이터
CREATE TABLE posts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  channel         TEXT NOT NULL,        -- 'instagram' | 'youtube'
  post_id         TEXT UNIQUE,
  post_type       TEXT,                 -- 'reel' | 'feed' | 'carousel' | 'shorts' | 'video'
  caption         TEXT,
  hashtags        TEXT,
  published_at    DATETIME,
  likes           INTEGER DEFAULT 0,
  comments        INTEGER DEFAULT 0,
  shares          INTEGER DEFAULT 0,
  saves           INTEGER DEFAULT 0,
  views           INTEGER DEFAULT 0,
  reach           INTEGER DEFAULT 0,
  impressions     INTEGER DEFAULT 0,
  watch_time_avg  REAL,
  ctr             REAL,
  completion_rate REAL,
  collected_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 계정 스냅샷 (주간 단위)
CREATE TABLE account_snapshots (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  channel       TEXT NOT NULL,
  followers     INTEGER,
  following     INTEGER,
  total_posts   INTEGER,
  avg_engagement_rate REAL,
  snapshot_date DATE,
  collected_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 최적 업로드 시간 분석
CREATE TABLE best_posting_times (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  channel     TEXT NOT NULL,
  post_type   TEXT,
  day_of_week INTEGER,                  -- 0=일, 1=월 ... 6=토
  hour        INTEGER,                  -- 0~23시
  avg_views   REAL,
  avg_engagement REAL,
  sample_count INTEGER,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 콘텐츠 유형별 성과 비교
CREATE TABLE format_performance (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  channel     TEXT NOT NULL,
  post_type   TEXT,                     -- 'reel' | 'feed' | 'carousel' | 'shorts' | 'video'
  avg_views   REAL,
  avg_likes   REAL,
  avg_saves   REAL,
  avg_reach   REAL,
  avg_engagement_rate REAL,
  post_count  INTEGER,
  period      TEXT,                     -- 'last_30d' | 'last_90d'
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Claude 분석 보고서
CREATE TABLE analysis_reports (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  report_type     TEXT DEFAULT 'weekly', -- 'weekly' | 'monthly'
  diagnosis       TEXT,
  trend_summary   TEXT,
  fit_analysis    TEXT,
  content_plan    TEXT,
  keep_drop       TEXT,
  monetization    TEXT,
  best_times      TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 추천 콘텐츠 아이디어
CREATE TABLE content_ideas (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id   INTEGER REFERENCES analysis_reports(id),
  channel     TEXT,
  priority    INTEGER,
  title       TEXT,
  hook        TEXT,
  format      TEXT,
  duration    TEXT,
  hashtags    TEXT,
  cta         TEXT,
  goal_metric TEXT,
  series_yn   BOOLEAN,
  done        BOOLEAN DEFAULT FALSE,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 콘텐츠 검증 기록
CREATE TABLE content_validations (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  channel         TEXT,
  post_type       TEXT,
  input_content   TEXT,
  input_caption   TEXT,
  fit_score       TEXT,                 -- '상' | '중' | '하'
  fit_reason      TEXT,
  improvements    TEXT,
  optimized_caption TEXT,
  hashtags        TEXT,
  best_time       TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 페이지 구성

### 1. 메인 대시보드 `/`
- **상단 채널 현황 카드**
  - Instagram: 팔로워 수 + 전주 대비 증감
  - YouTube: 구독자 수 + 전주 대비 증감
- **콘텐츠 유형별 성과 비교**
  - 인스타: 릴스 vs 피드 vs 캐러셀 평균 성과
  - 유튜브: 쇼츠 vs 롱폼 평균 성과
- **최근 게시물 TOP 3** (조회수 기준)
- **최적 업로드 시간** (채널별, 내 데이터 기반)
- **최신 분석 보고서 미리보기** + "전체 보기" 버튼
- **"지금 분석하기" 버튼** (Claude API 호출)

### 2. 분석 + 추천 `/analysis`
- **최신 보고서 전체 내용** (섹션별 펼쳐보기)
  - 📊 계정 포지션 진단
  - 🔥 트렌드 요약
  - 🎯 내 계정 × 트렌드 적합도
  - 📅 이번 주 추천 콘텐츠 5개
  - 🗑️ 버릴 것 / 유지할 것
  - 💰 협찬·수익화 액션 아이템
  - ⏰ 이번 주 최적 업로드 시간
- **과거 보고서 히스토리** (날짜별 목록)
- **"새로 분석하기" 버튼**

### 3. 콘텐츠 검증 `/verify`
콘텐츠 올리기 전에 Claude가 검사해주는 기능

**입력 폼**
- 채널 선택: Instagram / YouTube
- 형식 선택: 릴스 | 피드 | 캐러셀 | 쇼츠 | 롱폼
- 영상/게시물 내용 (간략하게)
- 초안 캡션 (선택)

**Claude 출력**
- ✅ 방향성 적합도: 상/중/하 + 이유
- 💡 개선점: 구체적으로 뭘 바꾸면 좋은지
- 📝 최적화 캡션: 채널별 특성에 맞게 재작성
- #️⃣ 해시태그: 대형(100만+) / 중형(10만~100만) / 소형(1만~10만) 섞어서 20개
- ⏰ 추천 업로드 시간: 내 데이터 기반

### 4. 콘텐츠 캘린더 `/calendar`
- 이번 주 추천 콘텐츠 요일별 배치
- 각 카드: 채널 / 제목 / 훅 / 형식 / 해시태그
- 완료 체크 기능
- 직접 아이디어 추가 기능

### 5. 설정 `/settings`
- 브랜드 프로필 편집 (핵심 주제, 타깃, 톤 등)
- API 연동 상태 (Instagram ✅ / YouTube ✅)
- 수동 데이터 수집 버튼
- 장기 데이터 현황 (DB에 쌓인 게시물 수, 기간)

---

## API Routes

```
GET  /api/collect/instagram       → 인스타 전체 데이터 수집
GET  /api/collect/youtube         → 유튜브 전체 데이터 수집
POST /api/analyze/weekly          → Claude 주간 분석 실행
POST /api/analyze/verify          → 콘텐츠 검증 (Claude)
GET  /api/reports                 → 보고서 목록
GET  /api/reports/[id]            → 보고서 상세
GET  /api/stats/format            → 콘텐츠 유형별 성과
GET  /api/stats/best-times        → 최적 업로드 시간
PATCH /api/ideas/[id]/done        → 콘텐츠 완료 체크
```

---

## Claude 시스템 프롬프트

### 주간 분석용
```
당신은 SNS 전략 코치입니다. 항상 한국어로 답하세요.

[브랜드 프로필]
포지셔닝: "회사 다니면서 해외+프리랜서 준비하는 비전공 디자이너의 현실 일기"
채널: Instagram (릴스+피드/캐러셀) / YouTube (쇼츠+롱폼)
핵심 주제: 해외 생활/워홀 현실 | 직장인 일상 솔직 일기 | 디자이너 커리어/프리랜싱
타깃: 18~30대 한국인, 워홀 관심자, 직장인, 디자이너 지망생
톤: 감성적이고 솔직하되 유머 섞인. fromwatertoworld 스타일.
목표: 팔로워 성장 → 협찬 → 수익화 / 금지: 정치

[분석 원칙]
1. 핵심 주제 3가지 항상 유지. 트렌드만 쫓지 않는다.
2. 추천은 전략→전술→실행 3단계.
3. 애매한 표현 금지. 근거 있는 판단만.
4. 릴스/쇼츠와 피드/캐러셀을 각각 다른 목적으로 활용 전략 제안.
5. 피드/캐러셀은 저장 유도 + 체류시간 증가에 집중.
6. 협찬 가능성 항상 염두. 니치 타깃 밀도 우선.

[출력 형식]
## 📊 계정 포지션 진단
## 🔥 트렌드 요약 (채널별)
## 🎯 내 계정 × 트렌드 적합도
## 📅 이번 주 추천 콘텐츠 5개
형식: 우선순위 / 채널 / 형식(릴스|피드|캐러셀|쇼츠|롱폼) / 제목 / 훅 / 길이 / 해시태그 / CTA / 목표지표 / 시리즈여부
## 🗑️ 버릴 것 / 유지할 것
## 💰 협찬·수익화 액션 아이템
## ⏰ 이번 주 최적 업로드 시간 (채널+형식별)
```

### 콘텐츠 검증용
```
당신은 SNS 콘텐츠 검증 전문가입니다. 항상 한국어로 답하세요.

[브랜드 프로필]
포지셔닝: "회사 다니면서 해외+프리랜서 준비하는 비전공 디자이너의 현실 일기"
핵심 주제: 해외 생활/워홀 | 직장인 일상 일기 | 디자이너 커리어/프리랜싱
타깃: 18~30대 한국인
톤: 감성적이고 솔직하되 유머 섞인
목표: 팔로워 성장 → 협찬 → 수익화

아래 콘텐츠를 검증하고 반드시 이 형식으로 출력하세요:

## ✅ 방향성 적합도
상/중/하 + 이유 (2~3줄)

## 💡 개선점
구체적으로 무엇을 바꾸면 좋은지 (3가지)

## 📝 최적화 캡션
채널 특성에 맞게 재작성한 캡션

## #️⃣ 해시태그 추천
대형(100만+): 5개
중형(10만~100만): 10개
소형(1만~10만): 5개

## ⏰ 추천 업로드 시간
요일 + 시간대 + 이유
```

---

## 자동화 스케줄러

```typescript
// 매일 오전 6시 - 데이터 자동 수집
cron.schedule('0 6 * * *', async () => {
  await collectInstagram();
  await collectYoutube();
  await updateFormatPerformance();  // 유형별 성과 업데이트
  await updateBestPostingTimes();   // 최적 시간 업데이트
});

// 매주 월요일 오전 7시 - Claude 주간 분석
cron.schedule('0 7 * * 1', async () => {
  await runWeeklyAnalysis();
});
```

---

## 디자인 요구사항

- 모바일 퍼스트 (폰에서 보기 좋게)
- 다크 모드 기본

### 컬러 스킴
```css
--bg-primary: #0a0a0a;
--bg-secondary: #141414;
--bg-tertiary: #1e1e1e;
--text-primary: #ffffff;
--text-secondary: #888888;
--neon-pink: #ff2d78;
--neon-green: #00ff87;
--border: #2a2a2a;
```

### 사용 규칙
- 네온 핑크: 주요 버튼, CTA, 인스타 관련, 중요 수치
- 네온 그린: 성장 지표(+), 완료 체크, 유튜브 관련
- 글로우 효과: box-shadow로 은은한 빛 효과
- 폰트: 영문 JetBrains Mono, 한글 Pretendard
- 카드 테두리: 1px solid #2a2a2a, hover시 네온 색상으로 변경
- 애니메이션: 부드럽고 절제된

### 분위기
사이버펑크 + 감성 일기. 차갑지 않고 따뜻한 다크 무드.

---

## 빌드 순서

### Phase 1: 기반 (1일)
1. Next.js 프로젝트 초기화
2. SQLite DB + 전체 스키마 생성
3. .env.local + .gitignore 세팅
4. CLAUDE.md 작성

### Phase 2: 데이터 수집 (2일)
5. YouTube Data API + Analytics API 연동
   - 쇼츠 / 롱폼 구분해서 수집
6. Instagram Graph API 연동
   - 릴스 / 피드 / 캐러셀 구분해서 수집
7. 콘텐츠 유형별 성과 집계 함수
8. 최적 업로드 시간 계산 함수
9. 스케줄러 연동

### Phase 3: Claude 분석 (1일)
10. 주간 분석 프롬프트 + API 연동
11. 콘텐츠 검증 프롬프트 + API 연동
12. 분석 결과 DB 저장

### Phase 4: UI (3일)
13. 메인 대시보드
14. 분석+추천 페이지
15. 콘텐츠 검증 페이지
16. 콘텐츠 캘린더
17. 설정 페이지

---

## 주의사항

- .env.local은 .gitignore에 반드시 추가
- Instagram Access Token 60일 만료 → Long-lived token + 자동 갱신 로직
- YouTube API 일일 쿼터 10,000 유닛 → 수집 주기 최소 6시간
- 쇼츠/릴스 구분: 유튜브는 60초 이하 → 쇼츠, 인스타는 post_type으로 구분
- 피드와 캐러셀은 media_type으로 구분 (CAROUSEL_ALBUM vs IMAGE)
- 모든 API 호출에 try/catch 적용 (에러나도 앱 안 죽게)
- 모든 날짜/시간은 KST 기준 표시
- 장기 데이터 보관: 인스타 90일 한계 극복을 위해 DB에 계속 누적 저장
