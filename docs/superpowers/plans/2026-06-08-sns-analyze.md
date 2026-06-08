# SNS Analyze Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first (iPhone 14 Pro) SNS analytics web app for Instagram + YouTube with brutalist poster design, localStorage caching, and GitHub Pages deployment.

**Architecture:** React + Vite SPA with React Router v6 for 5 pages (Dashboard, Instagram, YouTube, Compare, Report). API calls to YouTube Data API v3 and Instagram Graph API are abstracted in `services/`, cached in localStorage with 24h TTL via custom hooks in `hooks/`. No backend.

**Tech Stack:** React 18, Vite, React Router v6, Chart.js + react-chartjs-2, Tailwind CSS v3, Pretendard (jsdelivr CDN), Barlow Condensed + IBM Plex Mono (Google Fonts), GitHub Pages via `gh-pages` package.

---

## File Map

```
SNS-ANALYZE/
├── src/
│   ├── main.jsx                        # React entry point
│   ├── App.jsx                         # Router + layout shell
│   ├── index.css                       # Global CSS vars, font imports, Tailwind directives
│   ├── components/
│   │   ├── TabBar.jsx                  # Fixed bottom navigation (5 tabs)
│   │   ├── StatCard.jsx                # Stat display: label + big number + delta
│   │   ├── LineChart.jsx               # Chart.js line chart wrapper
│   │   ├── BarChart.jsx                # Chart.js bar chart wrapper
│   │   ├── HeatmapGrid.jsx             # Day×Hour upload time heatmap
│   │   ├── PostCard.jsx                # Single post/video card with metrics
│   │   ├── FilterChip.jsx              # Toggle chip (30일/7일/90일)
│   │   ├── Toast.jsx                   # Notification banner (success/error)
│   │   └── PageHeader.jsx              # Page title block (Barlow Condensed, big)
│   ├── pages/
│   │   ├── Settings.jsx                # API key onboarding + save to localStorage
│   │   ├── Dashboard.jsx               # Combined IG + YT summary
│   │   ├── InstagramPage.jsx           # Follower trend, posts, heatmap
│   │   ├── YouTubePage.jsx             # Subscriber trend, videos, heatmap
│   │   ├── ComparePage.jsx             # Search + side-by-side comparison
│   │   └── ReportPage.jsx              # Weekly/monthly summary + history
│   ├── hooks/
│   │   ├── useLocalStorage.js          # Generic get/set localStorage with JSON parse
│   │   └── useCache.js                 # 24h TTL cache wrapper around useLocalStorage
│   ├── services/
│   │   ├── youtube.js                  # YouTube Data API v3 fetch functions
│   │   └── instagram.js                # Instagram Graph API fetch functions
│   └── utils/
│       ├── formatNumber.js             # 24100 → "24.1K"
│       ├── formatDate.js               # ISO → "6월 8일"
│       └── calcBestUploadTime.js       # Posts array → day×hour engagement matrix
├── public/
│   └── favicon.svg
├── .github/
│   └── workflows/
│       └── deploy.yml                  # GitHub Actions → GitHub Pages
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.js`, `tailwind.config.js`, `src/index.css`, `src/main.jsx`

- [ ] **Step 1: Scaffold Vite + React project**

```bash
cd D:\SNS-ANALYZE
npm create vite@latest . -- --template react
```

When prompted: select `React`, then `JavaScript`.

- [ ] **Step 2: Install all dependencies**

```bash
npm install
npm install react-router-dom chart.js react-chartjs-2
npm install -D tailwindcss postcss autoprefixer
npm install gh-pages
npx tailwindcss init -p
```

- [ ] **Step 3: Configure Tailwind**

Replace `tailwind.config.js` with:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        yellow: '#FFEE00',
        blue:   '#0033FF',
        black:  '#0A0A0A',
        offwhite: '#F5F5F0',
        gray:   '#1A1A1A',
      },
      fontFamily: {
        condensed: ['"Barlow Condensed"', 'sans-serif'],
        sans:      ['Pretendard', 'sans-serif'],
        mono:      ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: { DEFAULT: '0px', none: '0px' },
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: Configure `vite.config.js` for GitHub Pages**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/SNS-ANALYZE/',
})
```

- [ ] **Step 5: Set up global CSS**

Replace `src/index.css` with:

```css
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=IBM+Plex+Mono:wght@500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --yellow: #FFEE00;
  --blue:   #0033FF;
  --black:  #0A0A0A;
  --white:  #F5F5F0;
  --gray:   #1A1A1A;
}

* {
  border-radius: 0 !important;
  box-sizing: border-box;
}

body {
  background: var(--black);
  color: var(--white);
  font-family: 'Pretendard', sans-serif;
  letter-spacing: -0.05em;
  max-width: 390px;
  margin: 0 auto;
  overflow-x: hidden;
}

/* Korean text always Pretendard */
:lang(ko), .korean { font-family: 'Pretendard', sans-serif; letter-spacing: -0.05em; }

/* English condensed headings */
.heading-en {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

/* Stat number */
.stat-num {
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 500;
  letter-spacing: -0.02em;
}
```

- [ ] **Step 6: Update `src/main.jsx`**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 7: Update `index.html` viewport**

In `index.html`, replace the `<meta name="viewport">` line with:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

Also add inside `<head>`:

```html
<meta name="theme-color" content="#0A0A0A">
```

- [ ] **Step 8: Verify scaffold runs**

```bash
npm run dev
```

Expected: Vite dev server starts at `http://localhost:5173`. Default React page shows in browser.

- [ ] **Step 9: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold React + Vite + Tailwind project"
```

---

## Task 2: Utility Functions

**Files:**
- Create: `src/utils/formatNumber.js`, `src/utils/formatDate.js`, `src/utils/calcBestUploadTime.js`

- [ ] **Step 1: Create `src/utils/formatNumber.js`**

```js
export function formatNumber(n) {
  if (n == null) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}

export function formatDelta(n) {
  if (n == null) return ''
  return (n >= 0 ? '▲ +' : '▼ ') + formatNumber(Math.abs(n))
}
```

- [ ] **Step 2: Create `src/utils/formatDate.js`**

```js
export function formatDate(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

export function formatDateShort(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function isWithinDays(isoString, days) {
  const cutoff = Date.now() - days * 86400 * 1000
  return new Date(isoString).getTime() > cutoff
}
```

- [ ] **Step 3: Create `src/utils/calcBestUploadTime.js`**

```js
// posts: array of { timestamp: ISO string, engagement: number }
// Returns 7×24 matrix [dayIndex][hourIndex] = avg engagement
// dayIndex: 0=Sun … 6=Sat
export function calcBestUploadTime(posts) {
  const matrix = Array.from({ length: 7 }, () => Array(24).fill(null))
  const counts = Array.from({ length: 7 }, () => Array(24).fill(0))
  const sums   = Array.from({ length: 7 }, () => Array(24).fill(0))

  for (const post of posts) {
    const d = new Date(post.timestamp)
    const day  = d.getDay()   // 0–6
    const hour = d.getHours() // 0–23
    sums[day][hour]   += post.engagement
    counts[day][hour] += 1
  }

  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      matrix[d][h] = counts[d][h] > 0 ? sums[d][h] / counts[d][h] : null
    }
  }

  return matrix
}

export const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
```

- [ ] **Step 4: Commit**

```bash
git add src/utils/
git commit -m "feat: add formatNumber, formatDate, calcBestUploadTime utils"
```

---

## Task 3: localStorage Hooks

**Files:**
- Create: `src/hooks/useLocalStorage.js`, `src/hooks/useCache.js`

- [ ] **Step 1: Create `src/hooks/useLocalStorage.js`**

```js
import { useState } from 'react'

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (e) {
      console.error('localStorage write error:', e)
    }
  }

  const removeValue = () => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (e) {
      console.error('localStorage remove error:', e)
    }
  }

  return [storedValue, setValue, removeValue]
}
```

- [ ] **Step 2: Create `src/hooks/useCache.js`**

```js
const TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export function readCache(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > TTL_MS) {
      localStorage.removeItem(key)
      return null
    }
    return data
  } catch {
    return null
  }
}

export function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }))
  } catch (e) {
    console.error('cache write error:', e)
  }
}

export function clearCache(key) {
  localStorage.removeItem(key)
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/
git commit -m "feat: add useLocalStorage hook and cache utils"
```

---

## Task 4: API Services

**Files:**
- Create: `src/services/youtube.js`, `src/services/instagram.js`

- [ ] **Step 1: Create `src/services/youtube.js`**

```js
const BASE = 'https://www.googleapis.com/youtube/v3'

function apiKey() {
  return localStorage.getItem('yt_api_key') || ''
}

export async function fetchChannelStats(channelId) {
  const key = apiKey()
  if (!key) throw new Error('NO_API_KEY')

  const url = `${BASE}/channels?part=statistics,snippet&id=${channelId}&key=${key}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`YT_API_ERROR:${res.status}`)
  const json = await res.json()

  if (!json.items?.length) throw new Error('CHANNEL_NOT_FOUND')
  const { statistics, snippet } = json.items[0]
  return {
    channelId,
    title: snippet.title,
    thumbnail: snippet.thumbnails?.default?.url,
    subscribers: Number(statistics.subscriberCount),
    totalViews: Number(statistics.viewCount),
    videoCount: Number(statistics.videoCount),
  }
}

export async function fetchRecentVideos(channelId, maxResults = 20) {
  const key = apiKey()
  if (!key) throw new Error('NO_API_KEY')

  // Step 1: get uploads playlist ID
  const chanUrl = `${BASE}/channels?part=contentDetails&id=${channelId}&key=${key}`
  const chanRes = await fetch(chanUrl)
  const chanJson = await chanRes.json()
  const playlistId = chanJson.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
  if (!playlistId) throw new Error('PLAYLIST_NOT_FOUND')

  // Step 2: get video IDs from playlist
  const plUrl = `${BASE}/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=${maxResults}&key=${key}`
  const plRes = await fetch(plUrl)
  const plJson = await plRes.json()
  const videoIds = plJson.items?.map(i => i.contentDetails.videoId).join(',')
  if (!videoIds) return []

  // Step 3: get video stats
  const vidUrl = `${BASE}/videos?part=statistics,snippet,contentDetails&id=${videoIds}&key=${key}`
  const vidRes = await fetch(vidUrl)
  const vidJson = await vidRes.json()

  return (vidJson.items || []).map(v => ({
    videoId: v.id,
    title: v.snippet.title,
    thumbnail: v.snippet.thumbnails?.medium?.url,
    publishedAt: v.snippet.publishedAt,
    views: Number(v.statistics.viewCount || 0),
    likes: Number(v.statistics.likeCount || 0),
    comments: Number(v.statistics.commentCount || 0),
    duration: v.contentDetails.duration,
  }))
}

export async function searchChannel(query) {
  const key = apiKey()
  if (!key) throw new Error('NO_API_KEY')

  const url = `${BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&maxResults=5&key=${key}`
  const res = await fetch(url)
  const json = await res.json()
  return (json.items || []).map(i => ({
    channelId: i.snippet.channelId,
    title: i.snippet.channelTitle,
    thumbnail: i.snippet.thumbnails?.default?.url,
  }))
}
```

- [ ] **Step 2: Create `src/services/instagram.js`**

```js
const BASE = 'https://graph.instagram.com'

function token() {
  return localStorage.getItem('ig_access_token') || ''
}

export async function fetchIGProfile() {
  const t = token()
  if (!t) throw new Error('NO_ACCESS_TOKEN')

  const url = `${BASE}/me?fields=id,username,followers_count,media_count&access_token=${t}`
  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.json()
    if (err.error?.code === 190) throw new Error('TOKEN_EXPIRED')
    throw new Error(`IG_API_ERROR:${res.status}`)
  }
  return res.json()
}

export async function fetchIGMedia(limit = 20) {
  const t = token()
  if (!t) throw new Error('NO_ACCESS_TOKEN')

  const fields = 'id,caption,media_type,thumbnail_url,media_url,timestamp,like_count,comments_count'
  const url = `${BASE}/me/media?fields=${fields}&limit=${limit}&access_token=${t}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`IG_API_ERROR:${res.status}`)
  const json = await res.json()
  return json.data || []
}

export async function fetchIGInsights(mediaId) {
  const t = token()
  if (!t) throw new Error('NO_ACCESS_TOKEN')

  const url = `${BASE}/${mediaId}/insights?metric=reach,saved,impressions&access_token=${t}`
  const res = await fetch(url)
  if (!res.ok) return { reach: 0, saved: 0, impressions: 0 }
  const json = await res.json()
  const result = {}
  for (const item of json.data || []) {
    result[item.name] = item.values?.[0]?.value ?? 0
  }
  return result
}
```

- [ ] **Step 3: Commit**

```bash
git add src/services/
git commit -m "feat: add YouTube and Instagram API service modules"
```

---

## Task 5: Core UI Components

**Files:**
- Create: `src/components/PageHeader.jsx`, `src/components/StatCard.jsx`, `src/components/FilterChip.jsx`, `src/components/Toast.jsx`, `src/components/PostCard.jsx`

- [ ] **Step 1: Create `src/components/PageHeader.jsx`**

```jsx
export default function PageHeader({ en, ko, accent }) {
  return (
    <div className="px-5 pt-6 pb-5 border-b border-white/10">
      {en && (
        <div className="heading-en text-5xl leading-none text-yellow mb-1">
          {en}
        </div>
      )}
      {ko && (
        <div className="text-base text-white/50" style={{ letterSpacing: '-0.05em' }}>
          {ko}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/StatCard.jsx`**

```jsx
import { formatNumber, formatDelta } from '../utils/formatNumber'

export default function StatCard({ label, value, delta, accent = false, className = '' }) {
  return (
    <div
      className={`p-5 border border-white/10 ${accent ? 'border-yellow' : ''} ${className}`}
      style={{ background: '#1A1A1A' }}
    >
      <div className="text-xs text-white/40 uppercase tracking-widest mb-1" style={{ fontFamily: 'Pretendard', letterSpacing: '-0.02em' }}>
        {label}
      </div>
      <div className="stat-num text-4xl leading-none text-yellow">
        {formatNumber(value)}
      </div>
      {delta != null && (
        <div
          className={`heading-en text-sm mt-1 ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}
        >
          {formatDelta(delta)}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/FilterChip.jsx`**

```jsx
export default function FilterChip({ options, value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`heading-en px-4 py-2 text-sm border transition-colors ${
            value === opt.value
              ? 'bg-yellow text-black border-yellow'
              : 'bg-transparent text-white border-white/20'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Create `src/components/Toast.jsx`**

```jsx
import { useEffect } from 'react'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      className={`fixed top-4 left-0 right-0 mx-auto w-[calc(100%-40px)] max-w-[350px] z-50 px-5 py-3 heading-en text-base flex justify-between items-center ${
        type === 'error'
          ? 'border border-red-500 text-red-400 bg-black'
          : 'bg-yellow text-black'
      }`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 opacity-60 text-lg leading-none">✕</button>
    </div>
  )
}
```

- [ ] **Step 5: Create `src/components/PostCard.jsx`**

```jsx
import { formatNumber } from '../utils/formatNumber'
import { formatDate } from '../utils/formatDate'

export default function PostCard({ thumbnail, title, timestamp, metrics = [] }) {
  return (
    <div className="flex gap-3 border-b border-white/10 py-4">
      {thumbnail && (
        <img
          src={thumbnail}
          alt=""
          className="w-16 h-16 object-cover flex-shrink-0"
          style={{ borderRadius: 0 }}
        />
      )}
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm text-white/80 truncate mb-2" style={{ letterSpacing: '-0.05em' }}>
            {title}
          </p>
        )}
        <div className="text-xs text-white/30 mb-2">{formatDate(timestamp)}</div>
        <div className="flex gap-4 flex-wrap">
          {metrics.map(m => (
            <div key={m.label}>
              <div className="text-xs text-white/30 uppercase" style={{ fontFamily: 'Barlow Condensed', letterSpacing: '0.05em' }}>
                {m.label}
              </div>
              <div className="stat-num text-base text-white">
                {formatNumber(m.value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/
git commit -m "feat: add core UI components (StatCard, FilterChip, Toast, PostCard, PageHeader)"
```

---

## Task 6: Chart Components

**Files:**
- Create: `src/components/LineChart.jsx`, `src/components/BarChart.jsx`, `src/components/HeatmapGrid.jsx`

- [ ] **Step 1: Create `src/components/LineChart.jsx`**

```jsx
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, Tooltip, Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

export default function LineChart({ labels, values, color = '#FFEE00', label = '' }) {
  const data = {
    labels,
    datasets: [{
      label,
      data: values,
      borderColor: color,
      backgroundColor: color + '18',
      fill: true,
      tension: 0,
      pointRadius: 2,
      pointBackgroundColor: color,
      borderWidth: 1,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: {
      backgroundColor: '#0A0A0A',
      borderColor: color,
      borderWidth: 1,
      titleColor: color,
      bodyColor: '#F5F5F0',
      titleFont: { family: 'IBM Plex Mono', size: 12 },
    }},
    scales: {
      x: {
        grid: { color: '#ffffff10' },
        ticks: { color: '#ffffff40', font: { family: 'IBM Plex Mono', size: 10 } },
      },
      y: {
        grid: { color: '#ffffff10' },
        ticks: { color: '#ffffff40', font: { family: 'IBM Plex Mono', size: 10 } },
      },
    },
  }

  return (
    <div style={{ height: 180, background: '#1A1A1A', padding: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
      <Line data={data} options={options} />
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/BarChart.jsx`**

```jsx
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

export default function BarChart({ labels, values, color = '#FFEE00', horizontal = false, label = '' }) {
  const data = {
    labels,
    datasets: [{
      label,
      data: values,
      backgroundColor: color,
      borderWidth: 0,
    }],
  }

  const options = {
    indexAxis: horizontal ? 'y' : 'x',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: {
      backgroundColor: '#0A0A0A',
      borderColor: color,
      borderWidth: 1,
      titleColor: color,
      bodyColor: '#F5F5F0',
    }},
    scales: {
      x: { grid: { color: '#ffffff10' }, ticks: { color: '#ffffff40', font: { family: 'IBM Plex Mono', size: 10 } } },
      y: { grid: { color: '#ffffff10' }, ticks: { color: '#ffffff40', font: { family: 'IBM Plex Mono', size: 10 } } },
    },
  }

  return (
    <div style={{ height: horizontal ? Math.max(200, labels.length * 36) : 180, background: '#1A1A1A', padding: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
      <Bar data={data} options={options} />
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/HeatmapGrid.jsx`**

```jsx
import { DAY_LABELS } from '../utils/calcBestUploadTime'

// matrix: 7×24 (day × hour), values are avg engagement or null
export default function HeatmapGrid({ matrix }) {
  // Find max value for normalization
  const allVals = matrix.flat().filter(v => v != null)
  const max = allVals.length ? Math.max(...allVals) : 1

  const alpha = (val) => val == null ? 0 : Math.round((val / max) * 200)

  const displayHours = [0, 3, 6, 9, 12, 15, 18, 21]

  return (
    <div style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', padding: 12, overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '32px repeat(24, 1fr)', gap: 2, minWidth: 340 }}>
        {/* Header row: hours */}
        <div />
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} style={{
            fontFamily: 'IBM Plex Mono', fontSize: 8, color: 'rgba(255,255,255,0.3)',
            textAlign: 'center', paddingBottom: 4,
          }}>
            {displayHours.includes(h) ? h : ''}
          </div>
        ))}

        {/* Day rows */}
        {matrix.map((row, d) => (
          <>
            <div key={`label-${d}`} style={{
              fontFamily: 'Barlow Condensed', fontSize: 10, fontWeight: 700,
              color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center',
              textTransform: 'uppercase',
            }}>
              {DAY_LABELS[d]}
            </div>
            {row.map((val, h) => (
              <div key={`${d}-${h}`} style={{
                height: 16,
                background: `rgba(255, 238, 0, ${alpha(val) / 255})`,
                border: '1px solid rgba(255,255,255,0.05)',
              }} title={val != null ? `${DAY_LABELS[d]} ${h}시: ${val.toFixed(0)}` : ''} />
            ))}
          </>
        ))}
      </div>
      <div style={{ fontFamily: 'Pretendard', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8, letterSpacing: '-0.05em' }}>
        밝을수록 참여율이 높은 시간대
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/
git commit -m "feat: add LineChart, BarChart, HeatmapGrid chart components"
```

---

## Task 7: TabBar + App Shell + Router

**Files:**
- Create: `src/components/TabBar.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `src/components/TabBar.jsx`**

```jsx
import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { path: '/',         label: '대시보드', icon: '◼' },
  { path: '/instagram', label: 'INSTA',   icon: '◻' },
  { path: '/youtube',   label: 'YT',      icon: '▷' },
  { path: '/compare',   label: '비교',    icon: '⇄' },
  { path: '/report',    label: '리포트',  icon: '≡' },
]

export default function TabBar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex"
      style={{
        background: '#0A0A0A',
        borderTop: '1px solid #FFEE00',
        maxWidth: 390,
        margin: '0 auto',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map(tab => {
        const active = pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="flex-1 flex flex-col items-center justify-center py-3 heading-en text-[10px] transition-colors"
            style={{
              background: active ? '#FFEE00' : 'transparent',
              color: active ? '#0A0A0A' : 'rgba(255,255,255,0.3)',
              border: 'none',
              minHeight: 56,
            }}
          >
            <span style={{ fontSize: 16, display: 'block', marginBottom: 2 }}>{tab.icon}</span>
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 2: Replace `src/App.jsx`**

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TabBar from './components/TabBar'
import Dashboard    from './pages/Dashboard'
import InstagramPage from './pages/InstagramPage'
import YouTubePage  from './pages/YouTubePage'
import ComparePage  from './pages/ComparePage'
import ReportPage   from './pages/ReportPage'
import Settings     from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter basename="/SNS-ANALYZE">
      <div style={{ paddingBottom: 80 }}>
        <Routes>
          <Route path="/"          element={<Dashboard />} />
          <Route path="/instagram" element={<InstagramPage />} />
          <Route path="/youtube"   element={<YouTubePage />} />
          <Route path="/compare"   element={<ComparePage />} />
          <Route path="/report"    element={<ReportPage />} />
          <Route path="/settings"  element={<Settings />} />
        </Routes>
      </div>
      <TabBar />
    </BrowserRouter>
  )
}
```

- [ ] **Step 3: Create stub pages so the app compiles**

Create each of these as a minimal stub (replace with real content in later tasks):

`src/pages/Dashboard.jsx`:
```jsx
export default function Dashboard() {
  return <div className="p-5 heading-en text-3xl text-yellow">DASHBOARD</div>
}
```

`src/pages/InstagramPage.jsx`:
```jsx
export default function InstagramPage() {
  return <div className="p-5 heading-en text-3xl text-yellow">INSTAGRAM</div>
}
```

`src/pages/YouTubePage.jsx`:
```jsx
export default function YouTubePage() {
  return <div className="p-5 heading-en text-3xl text-yellow">YOUTUBE</div>
}
```

`src/pages/ComparePage.jsx`:
```jsx
export default function ComparePage() {
  return <div className="p-5 heading-en text-3xl text-yellow">COMPARE</div>
}
```

`src/pages/ReportPage.jsx`:
```jsx
export default function ReportPage() {
  return <div className="p-5 heading-en text-3xl text-yellow">REPORT</div>
}
```

`src/pages/Settings.jsx`:
```jsx
export default function Settings() {
  return <div className="p-5 heading-en text-3xl text-yellow">SETTINGS</div>
}
```

- [ ] **Step 4: Run and verify routing**

```bash
npm run dev
```

Expected: App loads, bottom tab bar shows 5 tabs in yellow/black. Clicking each tab navigates to the stub page.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: add TabBar and React Router shell with stub pages"
```

---

## Task 8: Settings Page (API Key Onboarding)

**Files:**
- Modify: `src/pages/Settings.jsx`

- [ ] **Step 1: Implement Settings page**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'

export default function Settings() {
  const navigate = useNavigate()
  const [ytKey, setYtKey]     = useState(localStorage.getItem('yt_api_key') || '')
  const [igToken, setIgToken] = useState(localStorage.getItem('ig_access_token') || '')
  const [ytChannelId, setYtChannelId] = useState(localStorage.getItem('yt_channel_id') || '')
  const [toast, setToast]     = useState(null)

  function save() {
    localStorage.setItem('yt_api_key', ytKey.trim())
    localStorage.setItem('ig_access_token', igToken.trim())
    localStorage.setItem('yt_channel_id', ytChannelId.trim())
    setToast({ message: '저장 완료!', type: 'success' })
    setTimeout(() => navigate('/'), 1500)
  }

  const inputStyle = {
    width: '100%',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 0,
    color: '#F5F5F0',
    fontFamily: 'IBM Plex Mono',
    fontSize: 12,
    padding: '12px 14px',
    outline: 'none',
    letterSpacing: '0.02em',
    display: 'block',
    marginBottom: 8,
  }

  const labelStyle = {
    fontFamily: 'Barlow Condensed',
    fontWeight: 700,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'rgba(255,255,255,0.5)',
    display: 'block',
    marginBottom: 6,
    marginTop: 20,
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader en="SETTINGS" ko="API 연동 설정" />

      <div className="px-5 pt-4">
        {/* YouTube */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 24, marginBottom: 8 }}>
          <div className="heading-en text-xl text-yellow mb-3">YOUTUBE</div>
          <label style={labelStyle}>YouTube Data API v3 Key</label>
          <input
            style={inputStyle}
            value={ytKey}
            onChange={e => setYtKey(e.target.value)}
            placeholder="AIza..."
            spellCheck={false}
          />
          <label style={labelStyle}>내 채널 ID</label>
          <input
            style={inputStyle}
            value={ytChannelId}
            onChange={e => setYtChannelId(e.target.value)}
            placeholder="UCxxxxx..."
            spellCheck={false}
          />
          <p style={{ fontFamily: 'Pretendard', fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: '-0.05em', lineHeight: 1.6 }}>
            Google Cloud Console → YouTube Data API v3 → 사용 설정 → 사용자 인증 정보 → API 키 생성
          </p>
        </div>

        {/* Instagram */}
        <div style={{ paddingBottom: 24 }}>
          <div className="heading-en text-xl text-blue mb-3" style={{ color: '#0033FF' }}>INSTAGRAM</div>
          <label style={labelStyle}>User Access Token</label>
          <input
            style={inputStyle}
            value={igToken}
            onChange={e => setIgToken(e.target.value)}
            placeholder="IGQVJ..."
            spellCheck={false}
          />
          <p style={{ fontFamily: 'Pretendard', fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: '-0.05em', lineHeight: 1.6 }}>
            Facebook Developer Console → 앱 → Instagram Graph API → 사용자 토큰 생성 (크리에이터/비즈니스 계정 필요)
          </p>
        </div>

        <button
          onClick={save}
          style={{
            width: '100%',
            background: '#FFEE00',
            color: '#0A0A0A',
            fontFamily: 'Barlow Condensed',
            fontWeight: 800,
            fontSize: 20,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            border: 'none',
            borderRadius: 0,
            padding: '16px 20px',
            cursor: 'pointer',
            marginTop: 8,
          }}
        >
          저장 →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add Settings link to TabBar**

In `src/components/TabBar.jsx`, add a settings icon link in the top-right corner. Update the component to add a gear icon button:

Add this inside the `<nav>` after the tab buttons:

Actually, add a small gear button to the top-right of the page — easier than modifying the tab bar. Instead, add a `SettingsButton` component:

Create `src/components/SettingsButton.jsx`:

```jsx
import { useNavigate } from 'react-router-dom'

export default function SettingsButton() {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate('/settings')}
      style={{
        position: 'fixed',
        top: 16,
        right: 20,
        zIndex: 50,
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.2)',
        color: 'rgba(255,255,255,0.5)',
        fontFamily: 'Barlow Condensed',
        fontSize: 18,
        padding: '4px 10px',
        cursor: 'pointer',
        borderRadius: 0,
      }}
    >
      ⚙
    </button>
  )
}
```

Add `<SettingsButton />` to `App.jsx` inside the `<div style={{ paddingBottom: 80 }}>` wrapper.

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Navigate to `/settings` via the gear icon. Enter dummy values and click 저장. Expected: toast appears, redirects to `/`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Settings.jsx src/components/SettingsButton.jsx src/App.jsx
git commit -m "feat: Settings page with YouTube API key and Instagram token input"
```

---

## Task 9: Dashboard Page

**Files:**
- Modify: `src/pages/Dashboard.jsx`

- [ ] **Step 1: Implement Dashboard**

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import Toast from '../components/Toast'
import { fetchChannelStats, fetchRecentVideos } from '../services/youtube'
import { fetchIGProfile, fetchIGMedia } from '../services/instagram'
import { readCache, writeCache } from '../hooks/useCache'
import { formatDate } from '../utils/formatDate'
import { formatNumber } from '../utils/formatNumber'

export default function Dashboard() {
  const navigate = useNavigate()
  const [yt, setYt]       = useState(null)
  const [ig, setIg]       = useState(null)
  const [ytTop, setYtTop] = useState(null)
  const [igTop, setIgTop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const hasYtKey = !!localStorage.getItem('yt_api_key')
  const hasIgToken = !!localStorage.getItem('ig_access_token')
  const channelId = localStorage.getItem('yt_channel_id')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // YouTube
        if (hasYtKey && channelId) {
          let ytData = readCache('yt_stats')
          if (!ytData) {
            ytData = await fetchChannelStats(channelId)
            writeCache('yt_stats', ytData)
          }
          setYt(ytData)

          let videos = readCache('yt_videos')
          if (!videos) {
            videos = await fetchRecentVideos(channelId, 10)
            writeCache('yt_videos', videos)
          }
          const top = videos.sort((a, b) => b.views - a.views)[0]
          setYtTop(top)
        }
      } catch (e) {
        if (e.message === 'NO_API_KEY') {
          // silent
        } else {
          setToast({ message: 'YouTube 로드 실패 — 캐시 사용 중', type: 'error' })
        }
      }

      try {
        // Instagram
        if (hasIgToken) {
          let igData = readCache('ig_profile')
          if (!igData) {
            igData = await fetchIGProfile()
            writeCache('ig_profile', igData)
          }
          setIg(igData)

          let media = readCache('ig_media')
          if (!media) {
            media = await fetchIGMedia(10)
            writeCache('ig_media', media)
          }
          const top = media.sort((a, b) => (b.like_count || 0) - (a.like_count || 0))[0]
          setIgTop(top)
        }
      } catch (e) {
        if (e.message === 'TOKEN_EXPIRED') {
          setToast({ message: 'Instagram 토큰 만료 — 설정에서 갱신하세요', type: 'error' })
        } else if (e.message !== 'NO_ACCESS_TOKEN') {
          setToast({ message: 'Instagram 로드 실패', type: 'error' })
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  if (!hasYtKey && !hasIgToken) {
    return (
      <div className="flex flex-col items-start justify-center min-h-screen px-5">
        <div className="heading-en text-5xl text-yellow leading-none mb-4">API<br/>연동<br/>필요</div>
        <p style={{ fontFamily: 'Pretendard', letterSpacing: '-0.05em', color: 'rgba(255,255,255,0.5)', marginBottom: 24, lineHeight: 1.6 }}>
          분석을 시작하려면 YouTube API 키와 Instagram 토큰을 설정하세요.
        </p>
        <button
          onClick={() => navigate('/settings')}
          style={{
            background: '#FFEE00', color: '#0A0A0A',
            fontFamily: 'Barlow Condensed', fontWeight: 800,
            fontSize: 20, textTransform: 'uppercase',
            letterSpacing: '0.05em', border: 'none',
            borderRadius: 0, padding: '14px 24px', cursor: 'pointer',
          }}
        >
          설정 시작 →
        </button>
      </div>
    )
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader en="DASHBOARD" ko="전체 요약" />

      {loading ? (
        <div className="heading-en text-white/30 text-xl px-5 pt-8">LOADING...</div>
      ) : (
        <>
          {/* Key stats */}
          <div className="grid grid-cols-2 gap-px bg-white/10 m-5">
            <StatCard label="팔로워" value={ig?.followers_count} />
            <StatCard label="구독자" value={yt?.subscribers} />
            <StatCard label="총 조회수" value={yt?.totalViews} />
            <StatCard label="게시물" value={ig?.media_count} />
          </div>

          {/* Top YouTube video */}
          {ytTop && (
            <div className="px-5 mb-5">
              <div className="heading-en text-xs text-white/40 mb-2">TOP VIDEO THIS PERIOD</div>
              <div style={{ border: '1px solid rgba(255,255,255,0.1)', background: '#1A1A1A' }}>
                {ytTop.thumbnail && (
                  <img src={ytTop.thumbnail} alt="" className="w-full object-cover" style={{ maxHeight: 160 }} />
                )}
                <div className="p-3">
                  <p style={{ fontFamily: 'Pretendard', fontSize: 13, letterSpacing: '-0.05em', color: '#F5F5F0', marginBottom: 8 }}>
                    {ytTop.title}
                  </p>
                  <div className="flex gap-4">
                    <div>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>VIEWS</div>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 16, color: '#FFEE00' }}>{formatNumber(ytTop.views)}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>LIKES</div>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 16, color: '#F5F5F0' }}>{formatNumber(ytTop.likes)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top IG post */}
          {igTop && (
            <div className="px-5 mb-5">
              <div className="heading-en text-xs text-white/40 mb-2">TOP POST THIS PERIOD</div>
              <div style={{ border: '1px solid rgba(255,255,255,0.1)', background: '#1A1A1A', display: 'flex', gap: 12, padding: 12 }}>
                {(igTop.thumbnail_url || igTop.media_url) && (
                  <img src={igTop.thumbnail_url || igTop.media_url} alt="" style={{ width: 72, height: 72, objectFit: 'cover', flexShrink: 0 }} />
                )}
                <div>
                  <p style={{ fontFamily: 'Pretendard', fontSize: 12, letterSpacing: '-0.05em', color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
                    {formatDate(igTop.timestamp)}
                  </p>
                  <div className="flex gap-4">
                    <div>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>LIKES</div>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 16, color: '#FFEE00' }}>{formatNumber(igTop.like_count)}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>COMMENTS</div>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 16, color: '#F5F5F0' }}>{formatNumber(igTop.comments_count)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick nav */}
          <div className="px-5 grid grid-cols-2 gap-2 mb-5">
            <button
              onClick={() => navigate('/instagram')}
              style={{ background: '#0033FF', color: '#F5F5F0', fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 18, textTransform: 'uppercase', border: 'none', borderRadius: 0, padding: '14px 16px', cursor: 'pointer', textAlign: 'left' }}
            >
              INSTAGRAM →
            </button>
            <button
              onClick={() => navigate('/youtube')}
              style={{ background: '#FFEE00', color: '#0A0A0A', fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 18, textTransform: 'uppercase', border: 'none', borderRadius: 0, padding: '14px 16px', cursor: 'pointer', textAlign: 'left' }}
            >
              YOUTUBE →
            </button>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Expected: If no API keys set → onboarding screen with "설정 시작" button. If keys set → stats grid appears.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Dashboard.jsx
git commit -m "feat: Dashboard page with IG + YT stats, top content, onboarding state"
```

---

## Task 10: Instagram Page

**Files:**
- Modify: `src/pages/InstagramPage.jsx`

- [ ] **Step 1: Implement InstagramPage**

```jsx
import { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import LineChart from '../components/LineChart'
import BarChart from '../components/BarChart'
import HeatmapGrid from '../components/HeatmapGrid'
import PostCard from '../components/PostCard'
import FilterChip from '../components/FilterChip'
import Toast from '../components/Toast'
import { fetchIGProfile, fetchIGMedia } from '../services/instagram'
import { readCache, writeCache } from '../hooks/useCache'
import { calcBestUploadTime } from '../utils/calcBestUploadTime'
import { formatDateShort, isWithinDays } from '../utils/formatDate'

const PERIOD_OPTIONS = [
  { label: '7일', value: 7 },
  { label: '30일', value: 30 },
  { label: '90일', value: 90 },
]

export default function InstagramPage() {
  const [profile, setProfile] = useState(null)
  const [media, setMedia]     = useState([])
  const [period, setPeriod]   = useState(30)
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        let p = readCache('ig_profile')
        if (!p) { p = await fetchIGProfile(); writeCache('ig_profile', p) }
        setProfile(p)

        let m = readCache('ig_media')
        if (!m) { m = await fetchIGMedia(50); writeCache('ig_media', m) }
        setMedia(m)
      } catch (e) {
        setToast({ message: e.message === 'TOKEN_EXPIRED' ? 'Instagram 토큰 만료' : 'Instagram 로드 실패', type: 'error' })
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = media.filter(p => isWithinDays(p.timestamp, period))

  // Build history from localStorage snapshots for chart
  const history = JSON.parse(localStorage.getItem('ig_history') || '[]')
  const chartLabels = history.slice(-period).map(h => formatDateShort(h.date))
  const chartValues = history.slice(-period).map(h => h.followers)

  // Save today's snapshot
  useEffect(() => {
    if (!profile) return
    const today = new Date().toISOString().split('T')[0]
    const existing = JSON.parse(localStorage.getItem('ig_history') || '[]')
    if (!existing.find(h => h.date === today)) {
      existing.push({ date: today, followers: profile.followers_count })
      if (existing.length > 365) existing.shift()
      localStorage.setItem('ig_history', JSON.stringify(existing))
    }
  }, [profile])

  // Engagement per post for bar chart
  const engagementData = filtered.slice(0, 10).map(p => ({
    label: formatDateShort(p.timestamp),
    value: (p.like_count || 0) + (p.comments_count || 0),
  }))

  // Heatmap
  const heatmapPosts = filtered.map(p => ({
    timestamp: p.timestamp,
    engagement: (p.like_count || 0) + (p.comments_count || 0),
  }))
  const heatmatrix = calcBestUploadTime(heatmapPosts)

  if (loading) {
    return <div className="heading-en text-white/30 text-xl px-5 pt-8">LOADING...</div>
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader en="INSTAGRAM" ko="인스타그램 분석" />

      {/* Profile stats */}
      <div className="grid grid-cols-2 gap-px bg-white/10 mx-5 mt-5 mb-5">
        <StatCard label="팔로워" value={profile?.followers_count} />
        <StatCard label="게시물 수" value={profile?.media_count} />
      </div>

      {/* Period filter */}
      <div className="px-5 mb-4">
        <FilterChip options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
      </div>

      {/* Follower trend */}
      {chartValues.length > 1 && (
        <div className="px-5 mb-5">
          <div className="heading-en text-xs text-white/40 mb-2">FOLLOWER TREND</div>
          <LineChart labels={chartLabels} values={chartValues} color="#0033FF" />
        </div>
      )}

      {/* Engagement bar chart */}
      {engagementData.length > 0 && (
        <div className="px-5 mb-5">
          <div className="heading-en text-xs text-white/40 mb-2">ENGAGEMENT PER POST</div>
          <BarChart
            labels={engagementData.map(d => d.label)}
            values={engagementData.map(d => d.value)}
            color="#FFEE00"
          />
        </div>
      )}

      {/* Best upload time */}
      {heatmapPosts.length > 0 && (
        <div className="px-5 mb-5">
          <div className="heading-en text-xs text-white/40 mb-2">BEST UPLOAD TIME</div>
          <HeatmapGrid matrix={heatmatrix} />
        </div>
      )}

      {/* Post list */}
      <div className="px-5 mb-5">
        <div className="heading-en text-xs text-white/40 mb-2">RECENT POSTS ({filtered.length})</div>
        {filtered.map(p => (
          <PostCard
            key={p.id}
            thumbnail={p.thumbnail_url || p.media_url}
            timestamp={p.timestamp}
            metrics={[
              { label: 'LIKES', value: p.like_count },
              { label: 'COMMENTS', value: p.comments_count },
            ]}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/InstagramPage.jsx
git commit -m "feat: Instagram page with follower trend, engagement chart, heatmap, post list"
```

---

## Task 11: YouTube Page

**Files:**
- Modify: `src/pages/YouTubePage.jsx`

- [ ] **Step 1: Implement YouTubePage**

```jsx
import { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import LineChart from '../components/LineChart'
import BarChart from '../components/BarChart'
import HeatmapGrid from '../components/HeatmapGrid'
import PostCard from '../components/PostCard'
import FilterChip from '../components/FilterChip'
import Toast from '../components/Toast'
import { fetchChannelStats, fetchRecentVideos } from '../services/youtube'
import { readCache, writeCache } from '../hooks/useCache'
import { calcBestUploadTime } from '../utils/calcBestUploadTime'
import { formatDateShort, isWithinDays } from '../utils/formatDate'

const PERIOD_OPTIONS = [
  { label: '7일', value: 7 },
  { label: '30일', value: 30 },
  { label: '90일', value: 90 },
]

export default function YouTubePage() {
  const [stats, setStats]   = useState(null)
  const [videos, setVideos] = useState([])
  const [period, setPeriod] = useState(30)
  const [loading, setLoading] = useState(true)
  const [toast, setToast]   = useState(null)

  const channelId = localStorage.getItem('yt_channel_id')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        let s = readCache('yt_stats')
        if (!s) { s = await fetchChannelStats(channelId); writeCache('yt_stats', s) }
        setStats(s)

        let v = readCache('yt_videos')
        if (!v) { v = await fetchRecentVideos(channelId, 50); writeCache('yt_videos', v) }
        setVideos(v)
      } catch (e) {
        setToast({ message: 'YouTube 로드 실패 — 캐시 사용 중', type: 'error' })
      }
      setLoading(false)
    }
    if (channelId) load()
    else { setLoading(false); setToast({ message: '채널 ID를 설정에서 입력하세요', type: 'error' }) }
  }, [])

  useEffect(() => {
    if (!stats) return
    const today = new Date().toISOString().split('T')[0]
    const existing = JSON.parse(localStorage.getItem('yt_history') || '[]')
    if (!existing.find(h => h.date === today)) {
      existing.push({ date: today, subscribers: stats.subscribers })
      if (existing.length > 365) existing.shift()
      localStorage.setItem('yt_history', JSON.stringify(existing))
    }
  }, [stats])

  const filtered = videos.filter(v => isWithinDays(v.publishedAt, period))

  const history = JSON.parse(localStorage.getItem('yt_history') || '[]')
  const chartLabels = history.slice(-period).map(h => formatDateShort(h.date))
  const chartValues = history.slice(-period).map(h => h.subscribers)

  const topByViews = [...filtered].sort((a, b) => b.views - a.views).slice(0, 8)

  const heatmapPosts = filtered.map(v => ({
    timestamp: v.publishedAt,
    engagement: v.views,
  }))
  const heatmatrix = calcBestUploadTime(heatmapPosts)

  if (loading) {
    return <div className="heading-en text-white/30 text-xl px-5 pt-8">LOADING...</div>
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader en="YOUTUBE" ko="유튜브 분석" />

      <div className="grid grid-cols-2 gap-px bg-white/10 mx-5 mt-5 mb-5">
        <StatCard label="구독자" value={stats?.subscribers} />
        <StatCard label="총 조회수" value={stats?.totalViews} />
        <StatCard label="영상 수" value={stats?.videoCount} />
        <StatCard label="기간 내 영상" value={filtered.length} />
      </div>

      <div className="px-5 mb-4">
        <FilterChip options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
      </div>

      {chartValues.length > 1 && (
        <div className="px-5 mb-5">
          <div className="heading-en text-xs text-white/40 mb-2">SUBSCRIBER TREND</div>
          <LineChart labels={chartLabels} values={chartValues} color="#FFEE00" />
        </div>
      )}

      {topByViews.length > 0 && (
        <div className="px-5 mb-5">
          <div className="heading-en text-xs text-white/40 mb-2">TOP VIDEOS BY VIEWS</div>
          <BarChart
            labels={topByViews.map(v => v.title.slice(0, 20))}
            values={topByViews.map(v => v.views)}
            color="#FFEE00"
            horizontal={true}
          />
        </div>
      )}

      {heatmapPosts.length > 0 && (
        <div className="px-5 mb-5">
          <div className="heading-en text-xs text-white/40 mb-2">BEST UPLOAD TIME</div>
          <HeatmapGrid matrix={heatmatrix} />
        </div>
      )}

      <div className="px-5 mb-5">
        <div className="heading-en text-xs text-white/40 mb-2">VIDEOS ({filtered.length})</div>
        {filtered.map(v => (
          <PostCard
            key={v.videoId}
            thumbnail={v.thumbnail}
            title={v.title}
            timestamp={v.publishedAt}
            metrics={[
              { label: 'VIEWS', value: v.views },
              { label: 'LIKES', value: v.likes },
              { label: 'COMMENTS', value: v.comments },
            ]}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/YouTubePage.jsx
git commit -m "feat: YouTube page with subscriber trend, top videos chart, heatmap, video list"
```

---

## Task 12: Compare Page

**Files:**
- Modify: `src/pages/ComparePage.jsx`

- [ ] **Step 1: Implement ComparePage**

```jsx
import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'
import BarChart from '../components/BarChart'
import { fetchChannelStats, searchChannel } from '../services/youtube'
import { formatNumber } from '../utils/formatNumber'
import { readCache, writeCache } from '../hooks/useCache'

export default function ComparePage() {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [competitor, setComp]   = useState(null)
  const [myStats, setMyStats]   = useState(null)
  const [searching, setSearching] = useState(false)
  const [toast, setToast]       = useState(null)

  const channelId = localStorage.getItem('yt_channel_id')

  async function search() {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await searchChannel(query)
      setResults(res)
    } catch (e) {
      setToast({ message: '검색 실패 — API 키를 확인하세요', type: 'error' })
    }
    setSearching(false)
  }

  async function selectCompetitor(ch) {
    setResults([])
    try {
      // Save to recents
      const recents = JSON.parse(localStorage.getItem('compare_recents') || '[]')
      if (!recents.find(r => r.channelId === ch.channelId)) {
        recents.unshift(ch)
        if (recents.length > 5) recents.pop()
        localStorage.setItem('compare_recents', JSON.stringify(recents))
      }

      const [compStats, mine] = await Promise.all([
        fetchChannelStats(ch.channelId),
        channelId ? (readCache('yt_stats') || fetchChannelStats(channelId).then(s => { writeCache('yt_stats', s); return s })) : null,
      ])
      setComp(compStats)
      setMyStats(mine)
    } catch (e) {
      setToast({ message: '채널 정보 로드 실패', type: 'error' })
    }
  }

  const recents = JSON.parse(localStorage.getItem('compare_recents') || '[]')

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader en="COMPARE" ko="채널 비교" />

      <div className="px-5 pt-5">
        {/* Search */}
        <div className="flex gap-2 mb-4">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="채널명 검색..."
            style={{
              flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 0, color: '#F5F5F0', fontFamily: 'Pretendard',
              fontSize: 15, padding: '12px 14px', outline: 'none', letterSpacing: '-0.05em',
            }}
          />
          <button
            onClick={search}
            style={{
              background: '#FFEE00', color: '#0A0A0A', fontFamily: 'Barlow Condensed',
              fontWeight: 800, fontSize: 16, textTransform: 'uppercase',
              border: 'none', borderRadius: 0, padding: '12px 16px', cursor: 'pointer',
            }}
          >
            {searching ? '...' : '검색'}
          </button>
        </div>

        {/* Search results */}
        {results.map(ch => (
          <button
            key={ch.channelId}
            onClick={() => selectCompetitor(ch)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 0, padding: 12, cursor: 'pointer', marginBottom: 6, textAlign: 'left',
            }}
          >
            {ch.thumbnail && <img src={ch.thumbnail} alt="" style={{ width: 40, height: 40, borderRadius: 0, objectFit: 'cover' }} />}
            <span style={{ fontFamily: 'Pretendard', color: '#F5F5F0', fontSize: 14, letterSpacing: '-0.05em' }}>{ch.title}</span>
          </button>
        ))}

        {/* Recents */}
        {!results.length && recents.length > 0 && (
          <div className="mb-5">
            <div className="heading-en text-xs text-white/30 mb-2">RECENT SEARCHES</div>
            {recents.map(ch => (
              <button
                key={ch.channelId}
                onClick={() => selectCompetitor(ch)}
                style={{
                  display: 'block', width: '100%', background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 0,
                  color: 'rgba(255,255,255,0.5)', fontFamily: 'Pretendard',
                  fontSize: 13, letterSpacing: '-0.05em', padding: '10px 14px',
                  cursor: 'pointer', textAlign: 'left', marginBottom: 4,
                }}
              >
                {ch.title}
              </button>
            ))}
          </div>
        )}

        {/* Comparison */}
        {competitor && (
          <div className="mt-6">
            <div className="heading-en text-xs text-white/40 mb-3">COMPARISON</div>

            {/* Side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'rgba(255,255,255,0.1)', marginBottom: 16 }}>
              {[
                { label: '구독자', myVal: myStats?.subscribers, compVal: competitor.subscribers },
                { label: '총 조회수', myVal: myStats?.totalViews, compVal: competitor.totalViews },
                { label: '영상 수', myVal: myStats?.videoCount, compVal: competitor.videoCount },
              ].map(row => (
                <>
                  <div key={`my-${row.label}`} style={{ background: '#1A1A1A', padding: 16 }}>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: 4 }}>
                      나 / {row.label}
                    </div>
                    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 22, color: '#FFEE00' }}>
                      {formatNumber(row.myVal)}
                    </div>
                  </div>
                  <div key={`comp-${row.label}`} style={{ background: '#1A1A1A', padding: 16 }}>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: 4 }}>
                      {competitor.title.slice(0, 10)} / {row.label}
                    </div>
                    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 22, color: '#F5F5F0' }}>
                      {formatNumber(row.compVal)}
                    </div>
                  </div>
                </>
              ))}
            </div>

            {/* Bar comparison chart */}
            {myStats && (
              <div className="mb-5">
                <div className="heading-en text-xs text-white/40 mb-2">SUBSCRIBERS COMPARISON</div>
                <BarChart
                  labels={['나', competitor.title.slice(0, 12)]}
                  values={[myStats.subscribers, competitor.subscribers]}
                  color="#FFEE00"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/ComparePage.jsx
git commit -m "feat: Compare page with channel search, side-by-side stats, bar chart"
```

---

## Task 13: Report Page

**Files:**
- Modify: `src/pages/ReportPage.jsx`

- [ ] **Step 1: Implement ReportPage**

```jsx
import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'
import { formatNumber, formatDelta } from '../utils/formatNumber'
import { formatDate } from '../utils/formatDate'

function buildWeeklyReport() {
  const ytHistory = JSON.parse(localStorage.getItem('yt_history') || '[]')
  const igHistory = JSON.parse(localStorage.getItem('ig_history') || '[]')

  const ytLatest = ytHistory[ytHistory.length - 1]
  const ytWeekAgo = ytHistory[ytHistory.length - 8]
  const igLatest = igHistory[igHistory.length - 1]
  const igWeekAgo = igHistory[igHistory.length - 8]

  const ytDelta = ytLatest && ytWeekAgo ? ytLatest.subscribers - ytWeekAgo.subscribers : null
  const igDelta = igLatest && igWeekAgo ? igLatest.followers - igWeekAgo.followers : null

  const ytVideos = JSON.parse(localStorage.getItem('yt_videos') || '[]') // raw cache not used here
  const igMedia  = JSON.parse(localStorage.getItem('ig_media_raw') || '[]')

  return { ytDelta, igDelta, ytLatest, igLatest, ytHistory, igHistory }
}

export default function ReportPage() {
  const [period, setPeriod] = useState('weekly')
  const [toast, setToast]   = useState(null)

  const report = buildWeeklyReport()

  const ytHistory = JSON.parse(localStorage.getItem('yt_history') || '[]')
  const igHistory = JSON.parse(localStorage.getItem('ig_history') || '[]')

  function exportReport() {
    const lines = [
      `SNS ANALYZE REPORT — ${new Date().toLocaleDateString('ko-KR')}`,
      '',
      '[ YOUTUBE ]',
      `구독자: ${formatNumber(report.ytLatest?.subscribers)}`,
      `주간 증감: ${report.ytDelta != null ? (report.ytDelta >= 0 ? '+' : '') + report.ytDelta : 'N/A'}`,
      '',
      '[ INSTAGRAM ]',
      `팔로워: ${formatNumber(report.igLatest?.followers)}`,
      `주간 증감: ${report.igDelta != null ? (report.igDelta >= 0 ? '+' : '') + report.igDelta : 'N/A'}`,
    ]
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => setToast({ message: '클립보드에 복사됐어요!', type: 'success' }))
      .catch(() => setToast({ message: '복사 실패', type: 'error' }))
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader en="REPORT" ko="주간 · 월간 리포트" />

      <div className="px-5 pt-5">
        {/* Period toggle */}
        <div className="flex gap-2 mb-6">
          {['weekly', 'monthly'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 16,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                padding: '10px 20px', border: 'none', borderRadius: 0, cursor: 'pointer',
                background: period === p ? '#FFEE00' : 'transparent',
                color: period === p ? '#0A0A0A' : 'rgba(255,255,255,0.4)',
                borderBottom: period === p ? 'none' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {p === 'weekly' ? '주간' : '월간'}
            </button>
          ))}
        </div>

        {/* YouTube section */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 24, marginBottom: 24 }}>
          <div className="heading-en text-xl text-yellow mb-4">YOUTUBE</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            <div style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', padding: 16 }}>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: 4 }}>구독자</div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 28, color: '#FFEE00' }}>{formatNumber(report.ytLatest?.subscribers)}</div>
            </div>
            <div style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', padding: 16 }}>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: 4 }}>{period === 'weekly' ? '주간 증감' : '월간 증감'}</div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 28, color: report.ytDelta >= 0 ? '#44ff88' : '#ff4444' }}>
                {report.ytDelta != null ? (report.ytDelta >= 0 ? '+' : '') + report.ytDelta : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Instagram section */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 24, marginBottom: 24 }}>
          <div className="heading-en text-xl mb-4" style={{ color: '#0033FF' }}>INSTAGRAM</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            <div style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', padding: 16 }}>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: 4 }}>팔로워</div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 28, color: '#FFEE00' }}>{formatNumber(report.igLatest?.followers)}</div>
            </div>
            <div style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', padding: 16 }}>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: 4 }}>{period === 'weekly' ? '주간 증감' : '월간 증감'}</div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 28, color: report.igDelta >= 0 ? '#44ff88' : '#ff4444' }}>
                {report.igDelta != null ? (report.igDelta >= 0 ? '+' : '') + report.igDelta : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* History snapshots */}
        {(ytHistory.length > 0 || igHistory.length > 0) && (
          <div className="mb-6">
            <div className="heading-en text-xs text-white/40 mb-3">HISTORY SNAPSHOTS</div>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {ytHistory.slice().reverse().slice(0, 30).map((h, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '8px 0' }}>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{formatDate(h.date)}</span>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#FFEE00' }}>YT {formatNumber(h.subscribers)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export */}
        <button
          onClick={exportReport}
          style={{
            width: '100%', background: 'transparent', color: '#F5F5F0',
            fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 18,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: 0,
            padding: '14px 20px', cursor: 'pointer', marginBottom: 24,
          }}
        >
          클립보드에 복사 →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/ReportPage.jsx
git commit -m "feat: Report page with weekly/monthly summary, history snapshots, clipboard export"
```

---

## Task 14: GitHub Pages Deployment

**Files:**
- Modify: `package.json`
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Add deploy scripts to `package.json`**

Open `package.json`. In the `"scripts"` section, add:

```json
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"
```

Full scripts section should look like:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

- [ ] **Step 2: Create GitHub Actions workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

- [ ] **Step 3: Create GitHub repo and push**

On GitHub.com, create a new public repository named `SNS-ANALYZE`.

Then run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/SNS-ANALYZE.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

- [ ] **Step 4: Enable GitHub Pages in repo settings**

1. GitHub repo → Settings → Pages
2. Source: **GitHub Actions**
3. Save

- [ ] **Step 5: Trigger first deploy**

```bash
git push origin main
```

Wait ~2 minutes. Check the Actions tab on GitHub. Expected: green checkmark.

- [ ] **Step 6: Verify live URL**

Open `https://YOUR_USERNAME.github.io/SNS-ANALYZE/`

Expected: App loads, tab bar visible, onboarding screen if no API keys set.

- [ ] **Step 7: Final commit**

```bash
git add .github/ package.json
git commit -m "feat: GitHub Pages deployment via GitHub Actions"
git push
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Dashboard — IG + YT summary, top content, onboarding state
- ✅ Instagram page — follower trend, post list, heatmap, engagement chart
- ✅ YouTube page — subscriber trend, video list, heatmap, top videos chart
- ✅ Compare page — channel search, side-by-side metrics, bar chart, recents
- ✅ Report page — weekly/monthly, history snapshots, clipboard export
- ✅ Error handling — token expired, quota error, no API key, network fallback
- ✅ localStorage caching — 24h TTL via useCache, daily snapshots
- ✅ Design system — Barlow Condensed, Pretendard (-0.05em), IBM Plex Mono, yellow/blue/black, border-radius 0, 1px borders
- ✅ Mobile — 390px max-width, safe-area-inset-bottom on TabBar, 44px touch targets
- ✅ GitHub Pages — vite.config.js base, gh-pages package, GitHub Actions workflow
- ✅ Settings/onboarding — API key input, channel ID, token, save to localStorage

**Type consistency:**
- `readCache` / `writeCache` used consistently across all pages
- `formatNumber` / `formatDelta` imported from same file
- `fetchChannelStats`, `fetchRecentVideos`, `searchChannel` — all from `services/youtube.js`
- `fetchIGProfile`, `fetchIGMedia` — all from `services/instagram.js`
- `calcBestUploadTime` — used in both IG and YT pages with same `{ timestamp, engagement }` shape

**Placeholder scan:** No TBDs or vague steps — all steps contain actual code.
