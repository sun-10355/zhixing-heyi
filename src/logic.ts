import type { AppData, Bucket, Habit } from './db'

/** 按 order 排序的习惯列表 */
export function habitsSorted(habits: Habit[]): Habit[] {
  return [...habits].sort((a, b) => a.order - b.order)
}

export const BUCKET_NAMES: Record<Bucket, string> = {
  trip: '出差桶',
  weekend: '周末桶',
  workday: '工作日桶'
}

const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const pad = (n: number) => String(n).padStart(2, '0')

export function keyOf(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function todayKey(): string {
  return keyOf(new Date())
}

export function isWeekend(d: Date): boolean {
  const w = d.getDay()
  return w === 0 || w === 6
}

export function defaultBucket(): Bucket {
  return isWeekend(new Date()) ? 'weekend' : 'workday'
}

export function mondayOf(d: Date): Date {
  const m = new Date(d)
  const w = (m.getDay() + 6) % 7 // 周一=0
  m.setDate(m.getDate() - w)
  return m
}

export function weekLabel(d: Date): string {
  const mon = mondayOf(d)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return `${mon.getMonth() + 1}月${mon.getDate()}日 – ${sun.getMonth() + 1}月${sun.getDate()}日`
}

/** 今天起的未来 n 天（用于风险日点选） */
export function nextDays(n: number): Date[] {
  const out: Date[] = []
  for (let i = 1; i <= n; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    out.push(d)
  }
  return out
}

export function dayLabel(d: Date): string {
  return `${WEEKDAY_CN[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`
}

/** 武装目标：过了午夜但不到 8 点 → 武装"今天"（到家补点）；否则武装"明天"（赴约前） */
export function armTargetInfo(): { date: string; bucket: Bucket; label: string } {
  const now = new Date()
  let target: Date
  if (now.getHours() < 8) {
    target = now
  } else {
    target = new Date(now)
    target.setDate(target.getDate() + 1)
  }
  return {
    date: keyOf(target),
    bucket: isWeekend(target) ? 'weekend' : 'workday',
    label: dayLabel(target)
  }
}

/** 某周（默认本周）某习惯的打卡天数 */
export function weekCount(checkins: AppData['checkins'], habitId: string, mon: Date = mondayOf(new Date())): number {
  let n = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    if (checkins[keyOf(d)]?.[habitId]) n++
  }
  return n
}

/** 连续打卡天数：今天还没打卡则从昨天起算（断签当天不清零，明天才是生死线） */
export function streak(checkins: AppData['checkins']): number {
  let n = 0
  const d = new Date()
  if (!hasCheckin(checkins, d)) d.setDate(d.getDate() - 1)
  while (n < 365 && hasCheckin(checkins, d)) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

function hasCheckin(checkins: AppData['checkins'], d: Date): boolean {
  const c = checkins[keyOf(d)]
  return !!c && Object.values(c).some(Boolean)
}

/** 近 30 天完成率（%）：从第一次打卡日起算，按各习惯每周频率加权；无任何打卡返回 null */
export function rate30(checkins: AppData['checkins'], habits: Habit[]): number | null {
  const first = Object.keys(checkins)
    .filter(k => Object.values(checkins[k]).some(Boolean))
    .sort()[0]
  if (!first) return null
  const today = todayKey()
  let expected = 0
  let actual = 0
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const k = keyOf(d)
    if (k > today || k < first) continue
    const c = checkins[k] ?? {}
    for (const h of habits) {
      expected += h.freq / 7
      if (c[h.id]) actual++
    }
  }
  if (expected === 0) return null
  return Math.min(100, Math.round((actual / expected) * 100))
}

/** 宿醉日回笼觉上限：当天 10:30 */
export function hangoverTarget(): Date {
  const t = new Date()
  t.setHours(10, 30, 0, 0)
  return t
}
