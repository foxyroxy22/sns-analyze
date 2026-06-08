# SNS Analyze — Design Spec
**Date:** 2026-06-08  
**Status:** Approved

---

## Overview

A mobile-first (iPhone 14 Pro, 390px) personal SNS analytics web app for monitoring and comparing Instagram and YouTube account performance. Single user, no backend, no auth. Data fetched via official APIs and cached in localStorage.

---

## Tech Stack

- **Framework:** React + Vite
- **Routing:** React Router v6
- **Charts:** Chart.js + react-chartjs-2
- **Styling:** Tailwind CSS (mobile-first)
- **Storage:** localStorage (API keys, cache, history)
- **Deployment:** GitHub Pages

---

## Pages (5)

| Page | Purpose |
|------|---------|
| Dashboard | Combined summary of both platforms — key metrics at a glance |
| Instagram | Follower trend, post analysis, best upload time |
| YouTube | Subscriber trend, video performance, view analysis |
| Compare | Search a competitor account and compare against own account |
| Report | Weekly/monthly report summary, local history snapshots |

Navigation: bottom tab bar (mobile optimized).

---

## Architecture

```
src/
├── components/      # Reusable UI (Card, Chart, TabBar, Toast, Loader)
├── pages/           # Dashboard, Instagram, YouTube, Compare, Report
├── hooks/           # useLocalStorage, useYouTubeAPI, useInstagramAPI
├── services/        # youtube.js, instagram.js (API communication)
├── utils/           # formatNumber, formatDate, calcBestUploadTime
└── App.jsx          # Router setup
```

---

## Data Flow

```
App load
  → Check localStorage for API keys
  → Keys exist → fetch API → cache in localStorage (24h TTL) → render
  → Keys missing → show onboarding / settings guide
```

### localStorage Keys

| Key | Content |
|-----|---------|
| `yt_api_key` | YouTube Data API v3 key |
| `ig_access_token` | Instagram Graph API token |
| `yt_cache` | YouTube API response (24h TTL) |
| `ig_cache` | Instagram API response (24h TTL) |
| `yt_history` | Daily subscriber snapshots (array) |
| `ig_history` | Daily follower snapshots (array) |
| `compare_recents` | Recently searched competitor accounts |

---

## API Integration

### YouTube Data API v3
- Source: Google Cloud Console (free tier: 10,000 units/day)
- Key endpoints: `channels`, `videos`, `search`
- Auth: API key only (no OAuth needed for public data)
- Own channel stats require OAuth 2.0

### Instagram Graph API
- Source: Facebook Developer Console
- Requires: Creator/Business account + Facebook Page link
- Auth: User Access Token (long-lived, 60 days)
- Key endpoints: `me/media`, `me/insights`, `me/account`

---

## Features

### Dashboard
- Follower count (Instagram) + Subscriber count (YouTube)
- Total views / reach this week
- Top performing post/video this week
- Quick links to each platform page

### Instagram Page
- Follower count trend (line chart, 30 days)
- Post list: thumbnail, likes, comments, reach, saved
- Best upload time heatmap (day × hour engagement rate)
- Engagement rate per post (bar chart)

### YouTube Page
- Subscriber trend (line chart, 30 days)
- Video list: thumbnail, views, likes, comments, watch time
- Best upload time (day × hour views heatmap)
- Top videos by views (horizontal bar chart)

### Compare Page
- Search competitor by username (Instagram) or channel ID (YouTube)
- Side-by-side metric comparison: followers, avg engagement, post frequency
- Growth rate comparison chart

### Report Page
- Weekly summary: top post, subscriber delta, avg engagement
- Monthly summary: growth %, best/worst performing content
- History list from localStorage snapshots
- Export as text (copy to clipboard)

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| API key not set | Onboarding screen with setup instructions |
| API quota exceeded | Show cached data + toast warning |
| Network error | Fallback to last cached data |
| Private account searched | "Cannot analyze private account" message |
| Token expired (Instagram) | Prompt to refresh token with guide link |

---

## Visual Design System

### Aesthetic
Swiss/Brutalist poster design. Typography-driven, high-contrast, zero decorative radius. NOT a typical SaaS/AI UI.

### Typography
| Usage | Font | Notes |
|-------|------|-------|
| English headings, labels, numbers | **Barlow Condensed** (Bold/ExtraBold) | Condensed gothic — all caps preferred |
| Korean text (all) | **Pretendard** | letter-spacing: -0.05em (-5%), weight 400–700 |
| Monospace / data | **IBM Plex Mono** | For raw numbers in stat blocks |

### Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| `--yellow` | `#FFEE00` | Primary accent, highlights, active tab |
| `--blue` | `#0033FF` | Secondary accent, Instagram color |
| `--black` | `#0A0A0A` | Base background, main text |
| `--white` | `#F5F5F0` | Surface, reversed text |
| `--gray` | `#222222` | Cards, secondary surfaces |

### Rules
- `border-radius: 0` everywhere — buttons, cards, inputs, tabs, chips
- Borders: 1px solid lines everywhere, no shadows
- Buttons: solid fill or outlined, no rounded corners
- Cards: flat rect with visible border, no drop shadow
- Charts: flat color fills matching palette, no gradients
- Active state: yellow fill + black text (high contrast swap)
- Dividers: 1px lines between sections

### Layout
- Grid: strict column grid (4-col on mobile)
- Spacing scale: multiples of 8px
- Section headers: ALL CAPS, Barlow Condensed, oversized (32–48px)
- Numbers/stats: huge, full-width, poster-style type treatment

## Mobile Design Constraints

- Target: iPhone 14 Pro (390 × 844px)
- Safe area insets respected (notch, home indicator)
- Bottom tab bar: fixed, above home indicator, border-radius 0, thick top border
- Touch targets: minimum 44px
- No hover-dependent interactions
- Dark mode: black bg default (already poster-style)

---

## Out of Scope (v1)

- Claude API / AI insights (planned for v2)
- Multi-user / login system
- TikTok, Twitter/X integration
- Push notifications
- Data export to PDF/CSV
