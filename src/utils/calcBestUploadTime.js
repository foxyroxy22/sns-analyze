// posts: array of { timestamp: ISO string, engagement: number }
// Returns 7×24 matrix [dayIndex][hourIndex] = avg engagement
// dayIndex: 0=Sun … 6=Sat
export function calcBestUploadTime(posts) {
  const counts = Array.from({ length: 7 }, () => Array(24).fill(0))
  const sums   = Array.from({ length: 7 }, () => Array(24).fill(0))

  for (const post of posts) {
    const d = new Date(post.timestamp)
    const day  = d.getDay()
    const hour = d.getHours()
    sums[day][hour]   += post.engagement
    counts[day][hour] += 1
  }

  return Array.from({ length: 7 }, (_, d) =>
    Array.from({ length: 24 }, (_, h) =>
      counts[d][h] > 0 ? sums[d][h] / counts[d][h] : null
    )
  )
}

export const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
